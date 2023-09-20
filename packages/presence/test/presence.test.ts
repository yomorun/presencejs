/// <reference lib="dom" />

import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { beforeEach, describe, expect, test } from 'bun:test';
import { createPresence } from '../src/presence';

GlobalRegistrator.register();

import { WebTransportPolyfill } from '@yomo/webtransport-polyfill';

beforeEach(() => {
  Object.assign(window, {
    WebTransport: WebTransportPolyfill,
    addEventListener: () => { },
  })
})

describe('Presence', () => {
  test('create presence', async () => {
    expect(async () => {
      const presence = await createPresence('https://lo.yomo.dev:8443/v1', {});
      expect(presence).toBeDefined();
    }).toThrow('Invalid options');
  });

  test('join channel', async () => {
    const presence = await createPresence('https://lo.yomo.dev:8443/v1', {
      publicKey: 'join-channel',
    });

    const groupHugChannel = await presence.joinChannel('ch-id', { id: '123' });
    expect(groupHugChannel).toBeDefined();
  });

  test('subscribePeers', async (done) => {
    const p1 = await createPresence('https://lo.yomo.dev:8443/v1', {
      publicKey: 'subscribePeers',
      id: '1',
    });

    const ch1 = await p1.joinChannel('test-ch', { id: 'p1' });
    ch1.subscribePeers((peers: any) => {
      expect(peers[0].id).toBe('p2');
      done();
    });

    const p2 = await createPresence('https://lo.yomo.dev:8443/v1', {
      publicKey: 'subscribePeers',
      id: '2',
    });

    const ch2 = await p2.joinChannel('test-ch', { id: 'p2' });
    ch2.subscribePeers((peers: any) => {
      expect(peers[0].id).toBe('p1');
      done();
    });
  });
});
