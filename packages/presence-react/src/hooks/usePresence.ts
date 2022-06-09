import { useContext } from 'react';
import { PresenceContext, PresenceContextValue } from '../components/Context';
import { PresenceHook } from '../types';
import { usePresenceContext as useDefaultPresenceContext } from './usePresenceContext';

export function createPresenceHook(
  context = PresenceContext
): (roomName: string) => PresenceHook | PresenceContextValue {
  const usePresenceContext =
    context === PresenceContext
      ? useDefaultPresenceContext
      : () => useContext(context);

  // roomName: string, initialState: any
  return function(roomName: string) {
    // TODO: set initialState
    return usePresenceContext(roomName);
  };
}

export const usePresence = createPresenceHook();
