import { WebTransportPolyfill } from '@yomo/webtransport-polyfill';
import { Channel } from './channel';
import { Logger } from './logger';
import {
  ConnectionStatus,
  ConnectionStatusCallback,
  ConnectionStatusObject,
  IChannel,
  IPresence,
  InternalPresenceOptions,
  PresenceOptions,
  State,
} from './types.d';
import { randomId } from './utils';

export class Presence implements IPresence {
  #url: string = '';
  #state: State;
  #channels: Map<string, IChannel> = new Map();
  // conn is the connection, which is a WebTransport instance
  #conn: any;
  #options: InternalPresenceOptions;
  #logger: Logger;
  #eventListeners: Map<ConnectionStatus, ConnectionStatusCallback[]> = new Map();
  #onReadyCallbackFn: Function = () => { };
  #onErrorCallbackFn: Function = () => { };
  #onClosedCallbackFn: Function = () => { };
  #currentStatus: ConnectionStatus = ConnectionStatus.CLOSED;
  #retryCount = 0;
  #retryInterval = 10e3;

  get status(): ConnectionStatus {
    return this.#currentStatus;
  }

  constructor(url: string, options: InternalPresenceOptions) {
    this.#state = {
      id: options.id || (new Date).valueOf().toString(),
    };
    this.#options = options;
    this.#logger = new Logger({
      enabled: options.debug,
      module: 'presence',
    });

    // check url
    this.#url = this.#formatUrl(url);

    // (async () => {
    this.#notifyConnectionStatusChange(ConnectionStatus.CONNECTING, 'Attempting to establish a connection.');
    this.#connect();
    // })();
  }

  // #reconnect() will executes:
  // 1. try window.WebTransport()
  // 2. if failed, try window.WebTransportPolyfill() if options.autoDowngrade is true
  // 3. if failed, reconnect after 2 seconds
  #connect() {
    const conn = new window.WebTransport(this.#url);

    this.#conn = conn;

    conn.ready
      .then(() => {
        this.#logger.log('wt.ready.then', 'connected');
        // window.p = this.#conn;
        this.#notifyConnectionStatusChange(ConnectionStatus.OPEN, 'Connection established successfully.');
        this.#rejoinChannels();
        this.#onReadyCallbackFn();
      })
      .catch((e: Error) => {
        this.#logger.log('**wt.ready.catch', e);
      });

    conn.closed
      .then((p: any) => {
        // user call close() method
        this.#logger.log('wt.closed.then', p);
        if (this.#onClosedCallbackFn) {
          this.#logger.log('\twt.closed.then', this.#onClosedCallbackFn);
          this.#onClosedCallbackFn();
        }
        // leave all channels
        this.#channels.forEach((channel) => {
          this.#notifyConnectionStatusChange(ConnectionStatus.CLOSED, 'Connection has been disconnected.');
          channel.leave();
        });
      })
      .catch((e: Error) => {
        this.#logger.log('>>>wt.closed.catch', `name=${e.name}, message=${e.message}`);
        if (e.name === 'WebTransportError') {
          if (e.message === 'Opening handshake failed.') {
            // udp is disabled to the server
            this.#logger.log('S1>', 'WebTransport is not supported by the server, downgrade to websocket');
          } else if (e.message === 'remote WebTransport close' || e.message === 'Connection lost.') {
            this.#logger.log('S1>', `WebTransport server rejected, do NOT downgrade to websocket: ${e.message}`);
            this.#logger.log('START Reconnect.......', this.#retryInterval);
            return setTimeout(() => {
              this.#notifyConnectionStatusChange(ConnectionStatus.CLOSED, 'Connection has been disconnected.');
              this.#connect();
            }, this.#retryInterval);
          }
        } else if (e.message === 'WebTransport connection rejected') {
          // firefox will emit this error when proxy not support webtransport.
          // so we have to downgrade to websocket
        } else {
          this.#logger.log('connect.wt', { e });
        }
        // 是否降级到 WebSocket
        if (this.#options.autoDowngrade) {
          this.#logger.log('S2>', 'downgrade to websocket');
          this.#conn = new WebTransportPolyfill(this.#url);
          this.#retryCount++;
          this.#conn.ready
            .then(() => {
              this.#logger.log('ws.ready.then', 'connected');
              this.#notifyConnectionStatusChange(ConnectionStatus.OPEN, 'Connection established successfully.');
              this.#rejoinChannels();
              this.#onReadyCallbackFn();
            })
            .catch((pp: Error) => {
              this.#logger.log('ws.ready.catch', pp)
              this.#notifyConnectionStatusChange(ConnectionStatus.CLOSED, 'Connection has been disconnected.');
            });
          this.#conn.closed
            .then(() => {
              this.#logger.log('ws.closed.then', 'closed')
            })
            .catch((pp: Error) => {
              this.#logger.log('ws.closed.catch', pp)
              this.#logger.log('START Reconnect.......', this.#retryInterval);
              this.#notifyConnectionStatusChange(ConnectionStatus.CLOSED, 'Connection has been disconnected.');
              setTimeout(() => {
                this.#retryCount++;
                this.#connect();
              }, this.#retryInterval);
            });
        } else {
          this.#logger.log('connect.downgrade = false', 'retry ');
          this.#retryCount++;
          this.#logger.log('[wt] START Reconnect.......', this.#retryInterval);
          this.#notifyConnectionStatusChange(ConnectionStatus.CLOSED, 'Connection has been disconnected.');
          setTimeout(() => {
            this.#connect();
          }, this.#retryInterval);
        }
      });
  }

  #formatUrl(url: string) {
    if (typeof url !== 'string' || !url.startsWith('https://')) {
      throw new Error('Invalid url');
    }
    if ('publicKey' in this.#options) {
      return this.#formatUrlWithPublicKey(url);
    }
    throw new Error('Invalid options');
  }

  #formatUrlWithPublicKey(url: string) {
    return `${url}?publickey=${this.#options.publicKey}&id=${this.#state.id}`;
  }

  onReady(callbackFn: Function) {
    this.#onReadyCallbackFn = callbackFn;
  }

  onError(callbackFn: Function) {
    this.#onErrorCallbackFn = callbackFn;
  }

  onClosed(callbackFn: Function) {
    this.#logger.log('$Register onClosed', callbackFn);
    this.#onClosedCallbackFn = callbackFn;
  }

  async joinChannel(channelId: string, state?: State) {
    return new Promise<IChannel>((resolve) => {
      this.#state = {
        ...this.#state,
        ...(state || {}),
      };
      const channel = new Channel(channelId, this.#state, this.#conn, {
        reliable: this.#options.reliable,
        debug: this.#options.debug || false,
      });
      this.#channels.set(channelId, channel);
      channel.on('join', () => {
        resolve(channel);
      })
    });
  }

  leaveChannel(channelId: string) {
    const channel = this.#channels.get(channelId);
    if (channel) {
      channel.leave();
    }
  }

  // re-join channel after reconnected
  #rejoinChannels() {
    this.#logger.log('rejoin after connect', this.#channels);
    this.#channels.forEach((channel) => {
      this.joinChannel(channel.id, channel.state).then((ch) => {
        this.#logger.log(`rejoin ${ch.id} success`);
      }).catch((err) => {
        this.#logger.log(`rejoin ${channel.id} err:`, err);
      });
    })

  }

  on(status: ConnectionStatus, cb: ConnectionStatusCallback) {
    if (!this.#eventListeners.has(status)) {
      this.#eventListeners.set(status, []);
    }
    this.#eventListeners.get(status)!.push(cb);
  }

  #notifyConnectionStatusChange(status: ConnectionStatus, details: string) {
    this.#currentStatus = status;

    const code = ConnectionStatusCode[status];

    const statusObject: ConnectionStatusObject = {
      status,
      code,
      details,
    };

    const callbacks = this.#eventListeners.get(status);
    if (callbacks) {
      callbacks.forEach((callback) => callback(statusObject));
    }
  }
}

const ConnectionStatusCode: Record<ConnectionStatus, number> = {
  [ConnectionStatus.CONNECTING]: 0,
  [ConnectionStatus.OPEN]: 1,
  [ConnectionStatus.CLOSED]: 2
}

const defaultOptions: InternalPresenceOptions = {
  id: randomId(),
  reliable: false,
  debug: false,
  autoDowngrade: true,
};

/**
 * create a presence instance
 * @param url backend url
 * @param {string} options.id - the id of the presence instance
 * @param {string} options.publicKey - the public key of the presence instance
 * @param {boolean} options.reliable - whether to use reliable transport
 * @param {boolean} options.debug - whether to enable debug mode
 * @param {boolean} options.autoDowngrade - whether to auto downgrade to unreliable transport, when the reliable transport is not available
 * @returns {Promise<IPresence>}
 */
export function createPresence(url: string, options: PresenceOptions) {
  return new Promise((resolve, reject) => {
    const internalOptions: InternalPresenceOptions = {
      ...defaultOptions,
      ...options,
    };
    const presence = new Presence(url, internalOptions);
    presence.onReady(() => {
      resolve(presence);
    });
    // presence.onClosed(() => {
    //   reject('closed');
    // });
    presence.onError((e: any) => {
      reject(e);
    });
  });
}
