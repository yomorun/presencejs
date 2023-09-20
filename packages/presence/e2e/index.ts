/// <reference types="vite/client" />
import { createPresence } from '../dist/index';

const scenesSelector = document.getElementById('scenes-selector');
const contentEl = document.getElementById('content')!;

scenesSelector?.addEventListener('change', (e: any) => {
  handleSceneChange(e.target.value);
});

enum Scenes {
  Chat = 'chat',
  Online = 'online',
  SendContinuously = 'send-continuously',
}

function handleSceneChange(scene: Scenes) {
  clear();
  switch (scene) {
    case Scenes.Chat:
      changeToChatScene();
      break;
    case Scenes.Online:
      changeToOnlineScene();
      break;
    case Scenes.SendContinuously:
      changeToSendContinuouslyScene();
      break;
    default:
      break;
  }
}

function clear() {
  contentEl.innerHTML = '';
}

async function changeToChatScene() {
  contentEl.innerHTML = `<div id="msgs"></div>
  <input id="p1-ipt" />
  <button id="p1-btn">p1 send a message</button>
  <input id="p2-ipt" />
  <button id="p2-btn">p2 send a message</button>`;

  const p1Id = Math.random().toString();
  const p2Id = Math.random().toString();

  const receive = await createPresence(
    import.meta.env.VITE_PUBLIC_URL as string,
    {
      publicKey: import.meta.env.VITE_PUBLIC_KEY as string,
      id: p1Id,
      debug: true,
      autoDowngrade: true,
    }
  );

  const channel = await receive.joinChannel('chat');
  const msgs = document.getElementById('msgs') as HTMLButtonElement;

  channel.subscribe<string>('chat', (message, { id }) => {
    msgs.innerHTML += `<p>${id}: ${message}</p>`;
  });

  const p1 = await createPresence(import.meta.env.VITE_PUBLIC_URL as string, {
    publicKey: import.meta.env.VITE_PUBLIC_KEY as string,
    id: p1Id,
    debug: true,
    autoDowngrade: true,
  });

  const c1 = await p1.joinChannel('chat');
  const btn = document.getElementById('p1-btn') as HTMLButtonElement;
  const ipt = document.getElementById('p1-ipt') as HTMLInputElement;
  btn?.addEventListener('click', () => {
    c1.broadcast('chat', ipt.value);
    ipt.value = '';
  });

  const p2 = await createPresence(import.meta.env.VITE_PUBLIC_URL as string, {
    publicKey: import.meta.env.VITE_PUBLIC_KEY as string,
    id: p2Id,
    debug: true,
    autoDowngrade: true,
  });

  const c2 = await p2.joinChannel('chat');
  const btn2 = document.getElementById('p2-btn') as HTMLButtonElement;
  const ipt2 = document.getElementById('p2-ipt') as HTMLInputElement;
  btn2?.addEventListener('click', () => {
    c2.broadcast('chat', ipt2.value);
    ipt2.value = '';
  });
}

async function changeToOnlineScene() {
  contentEl.innerHTML = `<div>Current Online Users: <ul id="users"></ul></div>
  <input id="username" />
  <button id="add-btn">add a new user</button>`;

  const p1 = await createPresence(import.meta.env.VITE_PUBLIC_URL as string, {
    publicKey: import.meta.env.VITE_PUBLIC_KEY as string,
    debug: true,
    autoDowngrade: true,
  });

  const c1 = await p1.joinChannel('online', {
    id: Math.random().toString(),
    username: 'Noah',
  });
  c1.subscribePeers((peers: any) => {
    const users = document.getElementById('users') as HTMLSpanElement;
    users.innerHTML = peers
      .filter(peer => peer.username)
      .map(peer => `<li>${peer.username}</li>`)
      .join('');
  });

  function handleAddANewUser() {
    const p = createPresence(import.meta.env.VITE_PUBLIC_URL as string, {
      publicKey: import.meta.env.VITE_PUBLIC_KEY as string,
      debug: true,
      autoDowngrade: true,
    });

    const username = (document.getElementById('username') as HTMLInputElement)
      .value;

    (document.getElementById('username') as HTMLInputElement).value = '';
    p.then(presence => {
      presence.joinChannel('online', {
        id: Math.random().toString(),
        username,
      });
    });
  }

  const btn = document.getElementById('add-btn') as HTMLButtonElement;
  btn?.addEventListener('click', handleAddANewUser);
}

function makeId() {
  // 6 digits
  return Math.floor(Math.random() * 1000000).toString();
}

async function changeToSendContinuouslyScene() {
  const reId = makeId();
  const p1Id = makeId();
  const p2Id = makeId();
  const channelId = makeId();

  contentEl.innerHTML = `
  <div>
    receive id: ${reId}
    p1 id: ${p1Id}
    p2 id: ${p2Id}
    channel id: ${channelId}
  </div>
  <div id="msgs"></div>
  <input id="p1-ipt" />
  <input id="p1-send-count-ipt" />
  <button id="p1-btn">p1 send a message</button>
  <input id="p2-ipt" />
  <input id="p2-send-count-ipt" />
  <button id="p2-btn">p2 send a message</button>`;

  const receive = await createPresence(
    import.meta.env.VITE_PUBLIC_URL as string,
    {
      publicKey: import.meta.env.VITE_PUBLIC_KEY as string,
      id: reId,
      debug: true,
      autoDowngrade: true,
    }
  );

  const channel = await receive.joinChannel(channelId);
  const msgs = document.getElementById('msgs') as HTMLButtonElement;

  channel.subscribe<string>('chat', (message, { id }) => {
    msgs.innerHTML += `<p>${id}: ${message}</p>`;
  });

  const p1 = await createPresence(import.meta.env.VITE_PUBLIC_URL as string, {
    publicKey: import.meta.env.VITE_PUBLIC_KEY as string,
    id: p1Id,
    debug: true,
    autoDowngrade: true,
  });

  const c1 = await p1.joinChannel(channelId);
  const btn = document.getElementById('p1-btn') as HTMLButtonElement;
  btn?.addEventListener('click', () => {
    const msgIpt = document.getElementById('p1-ipt') as HTMLInputElement;
    const sendCountIpt = document.getElementById(
      'p1-send-count-ipt'
    ) as HTMLInputElement;
    const message = msgIpt.value;
    const sendCount = Number(sendCountIpt.value);
    for (let i = 0; i < sendCount; i++) {
      c1.broadcast('chat', message);
    }

    msgIpt.value = '';
    sendCountIpt.value = '';
  });

  const p2 = await createPresence(import.meta.env.VITE_PUBLIC_URL as string, {
    publicKey: import.meta.env.VITE_PUBLIC_KEY as string,
    id: p2Id,
    debug: true,
    autoDowngrade: true,
  });

  const c2 = await p2.joinChannel(channelId);
  const btn2 = document.getElementById('p2-btn') as HTMLButtonElement;
  const ipt2 = document.getElementById('p2-ipt') as HTMLInputElement;
  btn2?.addEventListener('click', () => {
    c2.broadcast('chat', { message: ipt2.value });
    ipt2.value = '';
  });
}
