import WebTransport from '@yomo/webtransport-polyfill';
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
  #transport: any;
  #options: InternalPresenceOptions;
  #logger: Logger;
  #eventListeners: Map<ConnectionStatus, ConnectionStatusCallback[]> = new Map();
  #onReadyCallbackFn: Function = () => { };
  #onErrorCallbackFn: Function = () => { };
  #onClosedCallbackFn: Function = () => { };
  #currentStatus: ConnectionStatus = ConnectionStatus.CLOSED;
  #retryCount = 0;

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

    (async () => {
      // this.#url = await this.#formatUrl(url);
      this.#notifyConnectionStatusChange(ConnectionStatus.CONNECTING, 'Attempting to establish a connection.');
      this.#connect();
    })();
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
    this.#onClosedCallbackFn = callbackFn;
  }

  async joinChannel(channelId: string, state?: State) {
    return new Promise<IChannel>((resolve) => {
      this.#state = {
        ...this.#state,
        ...(state || {}),
      };
      const channel = new Channel(channelId, this.#state, this.#transport, {
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

  #connect() {
    this.#transport = new window.WebTransport(this.#url);

    this.#transport.ready
      .then(() => {
        this.#notifyConnectionStatusChange(ConnectionStatus.OPEN, 'Connection established successfully.');
        this.#onReadyCallbackFn();
      })
      .catch((e: Error) => {
        this.#onErrorCallbackFn(e);
      });

    this.#transport.closed
      .then(() => {
        this.#onClosedCallbackFn();
        this.#channels.forEach((channel) => {
          this.#notifyConnectionStatusChange(ConnectionStatus.CLOSED, 'Connection has been disconnected.');
          channel.leave();
        });
      })
      .catch((e: Error) => {
        this.#logger.log('error: ', e);
        if (!this.#options.autoDowngrade) {
          return;
        }
        setTimeout(() => {
          if (this.#retryCount > 3) {
            this.#logger.log('retry count exceeded');
            this.#notifyConnectionStatusChange(ConnectionStatus.CLOSED, 'Connection has been disconnected.');
            return;
          }
          // force to use the polyfill
          window.WebTransport = WebTransport;
          this.#connect();
          this.#retryCount++;
        }, 2_000);
      });
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
export function createPresence(
  url: string,
  options: PresenceOptions
): Promise<IPresence>;
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
    presence.onClosed(() => {
      reject('closed');
    });
    presence.onError((e: any) => {
      reject(e);
    });
  });
}
