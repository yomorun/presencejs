import { decode, encode } from '@msgpack/msgpack';
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

const signalingEncode = (data: Signaling) => encode(data);

export class Channel implements IChannel {
  #transport: any;
  state: State;
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
    this.state = state;
    this.#transport = transport;
    this.#logger = new Logger({
      enabled: options.debug,
      module: 'presence.Channel:' + this.id,
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
    this.#write({
      t: 'control',
      op: 'peer_offline',
      c: this.id,
    });
    this.#members = [];
    this.#peers?.trigger(this.#members);
  }

  on(event: 'join', callbackFn: Function) {
    if (event === 'join') {
      this.#joinCallbackFns.push(callbackFn);
    }
  }

  #joinChannel() {
    this.#write({
      t: 'control',
      op: 'channel_join',
      c: this.id,
      pl: encode(this.state),
    });
  }

  #broadcast<T>(event: string, data: T) {
    this.#write({
      t: 'data',
      c: this.id,
      pl: encode({
        event, data,
      }),
    });
  }

  // #write(data: Uint8Array) {
  #write(sig: Signaling) {
    this.#logger.log(`sig[${sig.t}]->`, `c: ${sig.c}, op: ${sig.op}, pl: ${sig.pl?.byteLength}`);
    const data = signalingEncode(sig);
    if (!this.#writer) {
      // if (this.#transport.datagrams.writable.locked) {
      //   try {
      //     this.#transport.datagrams.writable.releaseLock();
      //   } catch (e) {
      //     this.#logger.log('release lock error: ', e)
      //   }
      // }
      if (this.#reliable) {
        this.#writer = this.#transport.createSendStream().getWriter();
      } else {
        this.#writer = this.#transport.datagrams.writable.getWriter();
      }
    }
    this.#writer.write(data);
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
          this.#logger.log('>sig[control]', `op: ${signaling.op}, p: ${signaling.p}, pl: ${signaling.pl?.byteLength}`);
          if (signaling.op === 'channel_join') {
            // when receive `channel_join`, means join success, should broadcast `peer_state` to this channel
            // to notify other peers that I'm online
            this.#online();
            this.#syncState();
            this.#joinCallbackFns.forEach((fn) => fn());
            continue;
          }
          if (signaling.op === 'peer_online') {
            // someone is online
            this.#handlePeerOnline(signaling.p!);
            continue;
          }
          if (signaling.op === 'peer_offline') {
            // someone is offline
            this.#handlePeerOffline(signaling.p!);
            continue;
          }
          if (signaling.op === 'peer_state') {
            // someone's state is changed
            this.#handlePeerState({
              id: signaling.p,
              ...(decode(signaling.pl!) as any),
            });
            continue;
          }
        } else if (signaling.t === 'data') {
          this.#logger.log('>sig[data]', `p: ${signaling.p}, pl: ${signaling.pl?.byteLength}`);
          // the payload of signaling is encoded by msgpack
          let { event, data } = decode(signaling.pl!) as any;
          // the data of the payload is encoded by JSON
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

  // [receive] signal: peer_online
  #handlePeerOnline(id: string) {
    if (id !== this.state.id) {
      const idx = this.#members.findIndex((member) => member.id === id);
      if (idx > -1) {
        this.#members[idx] = { id };
      } else {
        this.#members.push({ id });
      }
      // when receive `peer_online`, should broadcast `peer_state` to this channel
      this.#syncState();
      // this.#peers?.trigger(this.#members);
    }
  }

  // [receive] signal: peer_state
  #handlePeerState(peer: State) {
    this.#logger.log('#handlePeerState', { peer });
    if (peer.id !== this.state.id) {
      const idx = this.#members.findIndex((member) => {
        return String(member.id) === String(peer.id);
      });
      if (idx > -1) {
        this.#members[idx] = peer;
      } else {
        this.#members.push(peer);
      }
      this.#peers?.trigger(this.#members);
    }
  }

  // [send] signal: peer_online
  #online() {
    this.#write({
      t: 'control',
      op: 'peer_online',
      c: this.id,
      // p: this.#state.id,
    })
  }

  // [send] signal: peer_state
  #syncState() {
    this.#write({
      t: 'control',
      op: 'peer_state',
      c: this.id,
      // p: this.#state.id,
      pl: encode(this.state),
    })
  }

  // [receive] signal: peer_offline
  #handlePeerOffline(id: string) {
    this.#logger.log(`offline id: ${id}`);
    if (id !== this.state.id) {
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
