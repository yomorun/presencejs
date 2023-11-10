import { IPresence, createPresence } from "@yomo/presence";
import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import GroupHug from "./src/index";

const App = () => {
  const id = useRef<string>((new Date).valueOf().toString());
  const [p, setP] = useState<IPresence | null>(null);

  useEffect(() => {
    console.debug('test load', p === null)

    const presence = createPresence("https://lo.yomo.dev:8443/v1", {
      publicKey: "DEV_TOKEN",
      id: id.current,
      debug: true,
    });

    console.debug('test: created presence instance - 0', p === null)
    presence.then((yomo) => {
      console.debug('test: created presence instance - 1', p === null)
      setP(yomo);
      console.debug('test: created presence instance - 2', p === null)
    });

    return () => {
      console.debug("test unload", p === null)
    };
  }, []);

  return (
    <div>
      <h1>{id.current}</h1>
      <GroupHug
        presence={p}
        channel="test-channel"
        id={id.current}
        name={id.current}
      />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
  <App />
  // </React.StrictMode>
);