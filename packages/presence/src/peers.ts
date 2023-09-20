import { IPeers, PeersSubscribeCallbackFn, State } from "./types";

export class Peers implements IPeers {
  #transport: any = null;
  #callbackFns: PeersSubscribeCallbackFn[] = [];
  constructor(transport: any) {
    this.#transport = transport;
    this.#transport;
  }

  subscribe(callbackFn: PeersSubscribeCallbackFn) {
    this.#callbackFns.push(callbackFn);
    return () => {
      const fnIndex = this.#callbackFns.findIndex((fn) => fn === callbackFn);
      if (fnIndex > -1) {
        this.#callbackFns.splice(fnIndex, 1);
      }
    };
  }

  trigger(members: State[]) {
    this.#callbackFns.forEach((callbackFn) => {
      callbackFn(members);
    });
  }
}
