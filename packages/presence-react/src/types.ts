export interface PresenceHook {
  <T>(roomName: string): {
    self: T;
    setSelf(newSelf: T): void;
    peers: T[];
  };
}
