import { useContext, useEffect, useState } from 'react';
import { PresenceContext } from '../components/Context';
import { _presence, _id } from '../components/Provider';
import { PresenceHook } from '../types';

/**
 * A hook to access the value of the `PresenceContext`. This is a low-level
 * hook that you should usually not need to call directly.
 *
 * @returns {any} the value of the `PresenceContext`
 *
 * @example
 *
 * import React from 'react'
 * import { usePresenceContext } from '@precence/react'
 *
 * export const MyComponent = () => {
 *   const { room1 } = usePresenceContext()
 *   return <div>{room1.length}</div>
 * }
 */
export function usePresenceContext(roomName: string): PresenceHook {
  const contextValue = useContext(PresenceContext);
  // if (contextValue[roomName]) return contextValue[roomName];
  const [self, setSelf] = useState({ id: _id });
  const [peers, setPeers] = useState<any>([]);

  useEffect(() => {
    _presence.on('connected', () => {
      _presence.toRoom(roomName);

      _presence.on('ONLINE', (data: any) => {
        if (data.id === _id) return;
        _presence.send(`SYNC_${data.id}`, self);
        const idx = peers.findIndex((item: any) => item.id === data.id);
        if (idx === -1) {
          setPeers([...peers, data]);
        } else {
          const newPeers = [...peers];
          newPeers[idx] = data;
          setPeers(newPeers);
        }
      });

      _presence.on(`SYNC_${_id}`, (data: any) => {
        console.log(
          '有人上线啦！上线的人的数据：',
          data,
          '我自己的数据：',
          self
        );

        const newPeers = [...peers];
        if (!newPeers.find(item => item.id === data.id)) newPeers.push(data);
        setPeers(newPeers);
      });
      _presence.send('ONLINE', self);

      _presence.on('SYNC', (state: any) => {
        if (state.id === _id) return;

        const peerIdx = peers.findIndex(
          ({ id }: { id: string }) => id === state.id
        );

        const newPeers = [...peers];
        console.log('idx: ', peerIdx);

        if (peerIdx > -1) {
          return;
        }
        newPeers.push(state);
        setPeers(newPeers);
      });
    });
  }, []);

  contextValue[roomName] = {
    self,
    peers,
    setState: (state: any) => {
      const newState = { ...self, ...state };
      setSelf(newState);
      _presence.send('SYNC', newState);
    },
    offline: () => {
      // presence.send('OFF_LINE')
    },
  };

  if (!contextValue) {
    throw new Error(
      'could not find presence context value; please ensure the component is wrapped in a <Provider>'
    );
  }

  return contextValue[roomName];
}
