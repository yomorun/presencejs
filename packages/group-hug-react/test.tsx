import { createPresence } from '@yomo/presence';
import ReactDOM from "react-dom/client";
import GroupHug from './index.js';

// create an instance.
const id = "gh-" + (new Date).valueOf().toString()
const p = createPresence('https://lo.yomo.dev:8443/v1', {
  publicKey: "GroupHug-Preview",
  id,
  debug: true,
});

const channelName = 'gh-test-channel';

const App = () => {
  return <GroupHug presence={p} channel={channelName} id={id} name={id} />
}

const container = document.getElementById("app");
const root = ReactDOM.createRoot(container);

root.render(<App />);