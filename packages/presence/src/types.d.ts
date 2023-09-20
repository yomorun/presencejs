declare global {
  interface Window {
    WebTransport: any;
  }
}

export type State = {
  id: string;
  [key: string]: any;
};

export type PresenceOptions = {
  id?: string;
  publicKey?: string;
  reliable?: boolean; // default: false
  debug?: boolean; // default: false
  autoDowngrade?: boolean; // default: false
};

// internal options, create presence instance with this options
export type InternalPresenceOptions = {
  id: string;
  reliable: boolean;
  publicKey?: string;
  debug: boolean;
  autoDowngrade: boolean;
};

export enum ConnectionStatus {
  CONNECTING = 'connecting', // Connecting, indicates the initial connection attempt, code 0
  OPEN = 'open', // Connected successfully, code 1
  CLOSED = 'closed', // Disconnected, code 2
}

export interface ConnectionStatusObject {
  status: ConnectionStatus;
  code: number;
  details: string;
}

export type ConnectionStatusCallback = (status: ConnectionStatusObject) => void;

/**
 * @param onReady - callback function when the presence instance is ready
 * @param onError - callback function when the presence instance is error
 * @param onClosed - callback function when the presence instance is closed
 */
export interface IPresence {
  onReady(callbackFn: (presence: IPresence) => void): void;
  /**
   * join a channel
   * @param channelId a unique channel id
   * @param state join channel initial state
   * @returns {Channel}
   */
  joinChannel: (channelId: string, metadata?: State) => Promise<IChannel>;
  leaveChannel: (channelId: string) => void;
  on: (status: ConnectionStatus, cb: ConnectionStatusCallback) => void;
  status: ConnectionStatus;
}

type Peers = State[];

export type PeersSubscribeCallbackFn = (peers: Peers) => any;
export type PeersUnsubscribe = Function;
export type Unsubscribe = Function;
export type PeersSubscribe = (
  callbackFn: PeersSubscribeCallbackFn
) => PeersUnsubscribe;
export type IPeers = { subscribe: PeersSubscribe };

type Peer = {
  id: string;
}

export type ChannelEventSubscribeCallbackFn<Data> = (
  data: Data,
  peer: Peer
) => any;

// type JsonPrimitive = string | number | boolean | null

// interface JsonArray extends Array<JsonSerializable> { }

// interface JsonObject {
//   [key: string]: JsonSerializable;
// }

// interface JsonSerializableObject {
//   toJSON(): JsonSerializable;
// }

// export type JsonSerializable = JsonPrimitive | JsonObject | JsonSerializableObject | JsonArray;

export type JsonSerializable =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined
  | JsonSerializable[]
  | { [key: string]: JsonSerializable }
  | { toJSON(): JsonSerializable };

export interface IChannel {
  id: string;
  broadcast<T extends JsonSerializable>(event: string, data: T): void;
  subscribe<T extends JsonSerializable>(
    event: string,
    callbackFn: ChannelEventSubscribeCallbackFn<T>
  ): Unsubscribe;
  subscribePeers: PeersSubscribe;
  leave(): void;
  on(event: 'join', callbackFn: Function): void;
}

export interface Signaling {
  t: 'control' | 'data';
  op?: 'channel_join' | 'peer_online' | 'peer_state' | 'peer_offline';
  p?: string;
  c: string;
  pl?: ArrayBuffer;
}
