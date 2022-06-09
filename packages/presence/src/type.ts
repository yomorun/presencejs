export type EventMessage = {
  event: string;
  data: any;
};

export type Auth = {
  // Certification Type
  type: 'publickey' | 'token';
  // The public key in your Allegro Mesh project.
  publicKey?: string;
  // api for getting access token
  endpoint?: string;
};

export type ConnectType = 'WebSocket' | 'WebTransport';
export interface PresenceOption {
  // Authentication
  auth?: Auth;
  type?:ConnectType;
  // The reconnection interval value.
  reconnectInterval?: number;
  // The reconnection attempts value.
  reconnectAttempts?: number;
}
