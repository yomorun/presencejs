import { createPresence } from '@yomo/presence';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import GroupHug from '../index';
import './entry.css';

const domContainer = document.querySelector('#app');
const root = createRoot(domContainer);

const id = '1';
const avatar = Math.random() > 0.5 ? `https://robohash.org/${id}` : void 0;
const randomName = 'visitor';
const presence = createPresence({
  url: 'https://lo.yomo.dev:8443/v1',
  publicKey: 'TOKEN',
  id,
  appId: 'yomo',
});

const App = () => {
  const [darkMode, setDarkMode] = useState(true);
  return (
    <div
      style={{
        padding: '200px',
        background: darkMode ? 'black' : 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'start',
        gap: '20px',
      }}
    >
      <button
        style={{ color: darkMode ? 'white' : 'black' }}
        onClick={() => setDarkMode(!darkMode)}
      >
        {darkMode ? 'close dark mode' : 'open dark mode'}
      </button>
      <GroupHug
        presence={presence}
        id={id}
        avatar={avatar}
        name={randomName}
        darkMode={darkMode}
      />
    </div>
  );
};

root.render(<App />);
