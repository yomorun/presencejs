import React, { 
} from 'react';
import { PresenceContext } from './Context';
import Presence from '@yomo/presence';
import type { Auth, ConnectType } from '@yomo/presence/dist/type';
import { nanoid } from 'nanoid'

export let _presence: Presence;
export let _id: string;

export type PresenceProviderProps<R = any> = {
  presence?: Presence;
  host: string;
  id?: string;
  auth?: Auth;
  type?: ConnectType;
  children: React.ReactNode;
  context?: React.Context<R>;
};

function Provider({
  presence,
  host,
  id,
  auth,
  type,
  children,
  context,
}: PresenceProviderProps) {
  _id = _id || id || nanoid()
  _presence = _presence || presence || new Presence(host, { auth, type });

  const contextValue = {}

  const Context = context || PresenceContext;

  return <Context.Provider value={contextValue}>{children}</Context.Provider>;
}

export default Provider;
