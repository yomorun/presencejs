import React, {
  createContext,
  Fragment,
  useContext,
  useEffect,
  useState,
} from 'react';
import { IChannel } from '@yomo/presence';
import { LiveCursorProps, Cursor } from './types';

const colors = [
  '#FF38D1',
  '#8263FF',
  '#0095FF',
  '#00B874',
  '#FF3168',
  '#FFAB03',
];

function getRandomColor() {
  const idx = Math.floor(Math.random() * colors.length);
  const color = colors[idx];
  return color;
}

const LiveCursorCtx = createContext<{
  others: Cursor[];
  self: Cursor;
} | null>(null);

export default function LiveCursor(
  props: LiveCursorProps & typeof LiveCursorDefaultProps
) {
  const { id, color } = props;

  // initialize the cursor state
  const [myState, setMyState] = useState<Cursor>({
    id,
    state: 'online',
    color,
    x: 0,
    y: 0,
  });

  // initialize other cursors state
  const [otherCursors, setOtherCursors] = useState<Cursor[]>([]);
  // initialize the connection state
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let channel: IChannel | null = null;
    props.presence.then((yomo) => {
      channel = yomo.joinChannel('live-cursor', myState);

      channel.subscribePeers((peers) => {
        setOtherCursors([myState, ...(peers as Cursor[])]);
      });

      setConnected(true);
    });

    // update the cursor position
    const mousemoveHandler = (e: MouseEvent) => {
      // if the cursor is not connected, do nothing
      if (!channel) {
        return;
      }
      const newState: Cursor = {
        ...myState,
        x: e.clientX,
        y: e.clientY,
      };
      channel.updateMetadata(newState);
      setMyState(newState);
    };
    document.addEventListener('mousemove', mousemoveHandler);

    // update the cursor state
    const visibilitychangeHandler = () => {
      if (document.hidden) {
        const newState: Cursor = { ...myState, state: 'away' };
        channel?.updateMetadata(newState);
        setMyState(newState);
      } else {
        const newState: Cursor = { ...myState, state: 'online' };
        channel?.updateMetadata(newState);
        setMyState(newState);
      }
    };
    document.addEventListener('visibilitychange', visibilitychangeHandler);

    // hidden user cursor
    document.body.style.cursor = 'none';
    return () => {
      // unsubscribe from the channel
      channel?.leave();
      // remove listeners
      document.removeEventListener('visibilitychange', visibilitychangeHandler);
      document.removeEventListener('mousemove', mousemoveHandler);
    };
  }, []);

  if (!connected) {
    return <div></div>;
  }

  return (
    <LiveCursorCtx.Provider
      value={{
        others: otherCursors,
        self: myState,
      }}
    >
      <Cursor x={myState.x} y={myState.y} color={myState.color} />
      <OtherCursors />
    </LiveCursorCtx.Provider>
  );
}

function OtherCursors() {
  const ctx = useContext(LiveCursorCtx);
  if (!ctx) {
    return null;
  }
  const { others: cursors } = ctx;
  return (
    <Fragment>
      {cursors.map((c) => (
        <Cursor x={c.x} y={c.y} color={c.color} key={c.id} />
      ))}
    </Fragment>
  );
}

export const LiveCursorDefaultProps = {
  color: getRandomColor(),
};

LiveCursor.defaultProps = LiveCursorDefaultProps;

function Cursor({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <svg
      width="23"
      height="23"
      viewBox="0 0 23 23"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: 'absolute',
        left: x,
        top: y,
        zIndex: 999999,
        pointerEvents: 'none',
      }}
    >
      <g filter="url(#filter0_d_142_54)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M2.71004 1.98812C2.42625 1.1935 3.1935 0.426251 3.98812 0.710044L19.6524 6.30442C20.5016 6.60771 20.5472 7.7916 19.7238 8.15927L13.4448 10.9631C13.2194 11.0637 13.0393 11.2441 12.9389 11.4696L10.1582 17.7183C9.79136 18.5427 8.60637 18.4978 8.30287 17.648L2.71004 1.98812Z"
          fill={color}
        />
        <path
          d="M3.18091 1.81995C3.03902 1.42264 3.42264 1.03902 3.81995 1.18091L19.4842 6.77529C19.9088 6.92694 19.9316 7.51888 19.5199 7.70272L13.2409 10.5065C12.9029 10.6574 12.6326 10.9281 12.4821 11.2663L9.70142 17.515C9.51799 17.9272 8.92549 17.9048 8.77374 17.4799L3.18091 1.81995Z"
          stroke="white"
        />
      </g>
      <defs>
        <filter
          id="filter0_d_142_54"
          x="0.64978"
          y="0.649767"
          width="21.6663"
          height="21.662"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="2" />
          <feGaussianBlur stdDeviation="1" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_142_54"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_142_54"
            result="shape"
          />
        </filter>
      </defs>
    </svg>
  );
}
