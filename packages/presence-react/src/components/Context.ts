import React from 'react';

// example data source
// const value = {
//   room1: [{ id: '1', k1: 'v1', k2: 'v2' }],
//   room2: [{ id: '1', k1: 'v1', k2: 'v2' }],
// };

export type PresenceContextValue<R = any> = {
  [key in string]: R;
};

export const PresenceContext = React.createContext<PresenceContextValue>(null as any);

export type PresenceContextInstance = typeof PresenceContext

export default PresenceContext;
