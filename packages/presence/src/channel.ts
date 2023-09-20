import { decode, encode as msgPackEncode } from '@msgpack/msgpack';
import { JsonSerializer } from './JsonSerializer';
import { Logger } from './logger';
import { Peers } from './peers';
import {
  ChannelEventSubscribeCallbackFn,
  IChannel,
  JsonSerializable,
  PeersSubscribeCallbackFn,
  Signaling,
  State,
} from './types';

const signalingEncode = (data: Signaling) => msgPackEncode(data);

export class Channel implements IChannel {
  #transport: any;
  #state: State;
  #subscribers = new Map<string, ChannelEventSubscribeCallbackFn<any>>();
  #members: State[] = [];
  #peers: Peers | null = null;
  #joinTimestamp: number;
  #writer: any;
  #reliable: boolean;
  #logger: Logger;
  id: string;
  #joinCallbackFns: Function[] = [];
  constructor(
    id: string,
    state: State,
    transport: any,
    options: {
      reliable: boolean;
      debug: boolean;
    }
  ) {
    this.id = id;
    this.#state = state;
    this.#transport = transport;
    this.#logger = new Logger({
      enabled: options.debug,
      module: 'Presence Channel',
    });
    this.#joinTimestamp = Date.now();
    this.#joinTimestamp;
    this.#reliable = options.reliable;
    this.#read();
    this.#joinChannel();
    this.#addLeaveListener();
  }

  #addLeaveListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.leave();
      });
    }
  }

  broadcast<T extends JsonSerializable>(event: string, data: T): void {
    try {
      const serializedData = JsonSerializer.serialize(data)

      this.#broadcast(
        event,
        serializedData
      );
    } catch (e) {
      this.#logger.log('broadcast error: ', e);
      throw new Error('data must be json serializable');
    }
  }

  subscribe<T extends JsonSerializable>(
    eventName: string,
    callbackFn: ChannelEventSubscribeCallbackFn<T>
  ) {
    this.#subscribers.set(eventName, callbackFn);
    // unsubscribe
    return () => {
      this.#subscribers.delete(eventName);
    };
  }

  subscribePeers(callbackFn: PeersSubscribeCallbackFn) {
    if (!this.#peers) {
      this.#peers = new Peers(this.#transport);
    }
    return this.#peers.subscribe(callbackFn);
  }

  leave() {
    this.#write(
      signalingEncode({
        t: 'control',
        op: 'peer_offline',
        c: this.id,
      })
    );
    // this.#transport.close();
  }

  on(event: 'join', callbackFn: Function) {
    if (event === 'join') {
      this.#joinCallbackFns.push(callbackFn);
    }
  }

  #joinChannel() {
    this.#write(
      signalingEncode({
        t: 'control',
        op: 'channel_join',
        c: this.id,
        pl: msgPackEncode(this.#state),
      })
    );
  }

  #broadcast<T>(event: string, data: T) {
    this.#write(
      signalingEncode({
        t: 'data',
        c: this.id,
        pl: msgPackEncode({
          event, data,
        }),
      })
    );
  }

  async #write(data: Uint8Array) {
    if (!this.#writer) {
      if (this.#transport.datagrams.writable.locked) {
        try {
          this.#transport.datagrams.writable.releaseLock();
        } catch (e) {
          this.#logger.log('release lock error: ', e)
        }
      }
      if (this.#reliable) {
        this.#writer = this.#transport.createSendStream().getWriter();
      }
      this.#writer = this.#transport.datagrams.writable.getWriter();
    }
    // check connection state
    // FIXME: infinite wait
    // if (await this.#transport.closed) {
    //   throw new Error('Connection is disconnected');
    // }
    await this.#writer.ready;
    this.#writer.write(data);
    // writer.close();
  }

  async #read() {
    try {
      let reader;
      if (this.#reliable) {
        reader = this.#transport.receiveStreams.readable.getReader();
      } else {
        reader = this.#transport.datagrams.readable.getReader();
      }
      while (true) {
        const { value } = await reader.read();
        const data = new Uint8Array(value);
        const signaling: Signaling = decode(data) as Signaling;
        if (signaling.t === 'control') {
          this.#logger.log(
            'control ',
            `op: ${signaling.op}\n`,
            `p: ${signaling.p}\n`,
            'pl: ',
            signaling.pl
          );
          if (signaling.op === 'channel_join') {
            this.#online();
            this.#syncState();
            this.#joinCallbackFns.forEach((fn) => fn());
            continue;
          }
          if (signaling.op === 'peer_online') {
            // console.log('*************peer_online: ', signaling);
            this.#handleOnline(signaling.p!);
            continue;
          }
          if (signaling.op === 'peer_offline') {
            this.#offline(signaling.p!);
            continue;
          }

          if (signaling.op === 'peer_state') {
            // console.log('*************peer_state: ', signaling);
            this.#handleSync({
              id: signaling.p,
              ...(decode(signaling.pl!) as any),
            });
            continue;
          }
        } else if (signaling.t === 'data') {
          let { event, data } = decode(signaling.pl!) as any;
          data = JsonSerializer.deserialize(data);
          if (this.#subscribers.has(event)) {
            this.#subscribers.get(event)!(data, { id: signaling.p! });
          }
        }
      }
    } catch (e) {
      this.#logger.log('read error: ', e);
      return;
    }
  }

  #handleOnline(id: string) {
    if (id !== this.#state.id) {
      const idx = this.#members.findIndex((member) => member.id === id);
      if (idx > -1) {
        this.#members[idx] = { id };
      } else {
        this.#members.push({ id });
      }
      this.#syncState();
      this.#peers?.trigger(this.#members);
    }
  }

  #handleSync(payload: any) {
    if (payload.id !== this.#state.id) {
      const idx = this.#members.findIndex((member) => {
        return String(member.id) === String(payload.id);
      });

      if (idx > -1) {
        this.#members[idx] = payload;
      } else {
        this.#members.push(payload);
      }
      this.#peers?.trigger(this.#members);
    }
  }

  #online() {
    this.#logger.log(`online cid: ${this.id} state: `, this.#state);
    this.#write(
      signalingEncode({
        t: 'control',
        op: 'peer_online',
        c: this.id,
        p: this.#state.id,
      })
    );
  }

  #syncState() {
    this.#logger.log('sync state: ', this.#state);
    this.#write(
      signalingEncode({
        t: 'control',
        op: 'peer_state',
        c: this.id,
        p: this.#state.id,
        pl: msgPackEncode(this.#state),
      })
    );
  }

  #offline(id: string) {
    this.#logger.log(`offline id: ${id}`);
    if (id !== this.#state.id) {
      const idx = this.#members.findIndex((member) => {
        return member.id === id;
      });

      if (idx > -1) {
        this.#members.splice(idx, 1);
      }

      this.#peers?.trigger(this.#members);
    }
  }
}
