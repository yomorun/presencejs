import React, {
  createContext,
  Fragment,
  useContext,
  useEffect,
  useState,
} from 'react';
import { IChannel } from '@yomo/presence';
import { CursorChatProps, Cursor } from './types';

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

const CursorChatCtx = createContext<{
  others: Cursor[];
  self: Cursor;
} | null>(null);

export default function CursorChat(
  props: CursorChatProps & typeof CursorChatDefaultProps
) {
  const { id, color } = props;

  // initialize the cursor state
  const [myState, setMyState] = useState<Cursor>({
    id,
    state: 'online',
    color,
    x: 0,
    y: 0,
    message: '',
    name: props.name || 'visitor',
    avatar: props.avatar,
    latency: props.latency,
    region: props.region,
  });

  // initialize other cursors state
  const [otherCursors, setOtherCursors] = useState<Cursor[]>([]);
  // initialize the connection state
  const [connected, setConnected] = useState(false);
  const [channel, setChannel] = useState<IChannel | null>(null);

  useEffect(() => {
    let channel: IChannel | null = null;
    props.presence.then(yomo => {
      channel = yomo.joinChannel('live-cursor', myState);

      channel.subscribePeers(peers => {
        setOtherCursors([myState, ...(peers as Cursor[])]);
      });

      setConnected(true);
      setChannel(channel);
    });

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
    };
  }, []);

  const [typing, setTyping] = useState(false);

  useEffect(() => {
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
    return () => {
      document.removeEventListener('mousemove', mousemoveHandler);
    };
  }, [myState, channel]);

  useEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      if (e.key === '/' || e.key === 'Slash') {
        e.preventDefault();
        setTyping(true);
      }
    };
    const keyupHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Escape') {
        setTyping(false);
      }
    };
    document.addEventListener('keydown', keydownHandler);
    document.addEventListener('keyup', keyupHandler);
    return () => {
      document.removeEventListener('keydown', keydownHandler);
      document.removeEventListener('keyup', keyupHandler);
    };
  }, []);

  const onMessageChange = (message: string) => {
    const newState: Cursor = { ...myState, message };
    channel?.updateMetadata(newState);
    setMyState(newState);
  };

  if (!connected) {
    return <div></div>;
  }

  return (
    <CursorChatCtx.Provider
      value={{
        others: otherCursors,
        self: myState,
      }}
    >
      <Cursor
        x={myState.x}
        y={myState.y}
        color={myState.color}
        message={myState.message}
        typing={typing}
        name={myState.name}
        avatar={myState.avatar}
        latency={myState.latency}
        region={myState.region}
        onMessageChange={onMessageChange}
      />
      <OtherCursors />
    </CursorChatCtx.Provider>
  );
}

function OtherCursors() {
  const ctx = useContext(CursorChatCtx);
  if (!ctx) {
    return null;
  }
  const { others: cursors } = ctx;
  return (
    <Fragment>
      {cursors.map(c => (
        <Cursor
          x={c.x}
          y={c.y}
          color={c.color}
          key={c.id}
          name={c.name}
          avatar={c.avatar}
          latency={c.latency}
          region={c.region}
          message={c.message}
        />
      ))}
    </Fragment>
  );
}

export const CursorChatDefaultProps = {
  color: getRandomColor(),
};

CursorChat.defaultProps = CursorChatDefaultProps;

function Cursor({
  x,
  y,
  color,
  name,
  avatar,
  latency,
  region,
  message,
  typing = false,
  onMessageChange,
}: {
  x: number;
  y: number;
  color: string;
  name?: string;
  avatar?: string;
  latency?: number;
  region?: string;
  message?: string;
  typing?: boolean;
  onMessageChange?: (message: string) => void;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        zIndex: 999999,
        pointerEvents: 'none',
        maxWidth: '424px',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
      }}
      
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 23 23"
        fill={color}
        xmlns="http://www.w3.org/2000/svg"
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
      <div
        style={{
          backgroundColor: color,
          borderRadius: message || typing ? '2px 31px 31px 20px' : '18px',
          padding: message || typing ? '10px 20px' : '6px',
          wordWrap: 'break-word',
        }}
        className="ml-[20px] text-white"
      >
        <div className="text-[12px] flex gap-1">
          {(avatar || name) && (
            <div
              className="rounded-[12px] flex items-center"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              {avatar && (
                <img src={avatar} className="w-6 h-6 rounded-[12px]" />
              )}
              {name && <div className="py-[2px] px-1.5">{name}</div>}
            </div>
          )}

          {(latency || region) && (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
              }}
              className="flex items-center gap-1 rounded-[12px] py-[2px] px-1.5"
            >
              <LatencyIcon />
              {latency && <span>{latency}ms</span>}
              {region && <span>{region}</span>}
            </div>
          )}
        </div>
        {typing ? (
          <input
            autoFocus
            className="bg-transparent border-none outline-none placeholder:text-[rgba(255,255,255,0.6)]"
            value={message}
            onInput={e => onMessageChange?.((e.target as any).value)}
            placeholder="Say something"
          />
        ) : (
          <span className="text-[14px]">{message}</span>
        )}
      </div>
    </div>
  );
}

function LatencyIcon() {
  return (
    <svg
      width="10"
      height="11"
      viewBox="0 0 10 11"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="5" cy="5.5" r="4.5" stroke="white" />
      <path
        d="M4.5 4C4.5 3.72386 4.72386 3.5 5 3.5V3.5C5.27614 3.5 5.5 3.72386 5.5 4V6.5V6.5C4.94772 6.5 4.5 6.05228 4.5 5.5V4Z"
        fill="white"
      />
      <path
        d="M5 6.5C4.72386 6.5 4.5 6.27614 4.5 6V5.5H7C7.27614 5.5 7.5 5.72386 7.5 6C7.5 6.27614 7.27614 6.5 7 6.5H5Z"
        fill="white"
      />
    </svg>
  );
}
