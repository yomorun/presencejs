import { IChannel } from '@yomo/presence';
import Avvvatars from 'avvvatars-react';
import React, {
  createContext,
  memo,
  useContext,
  useEffect,
  useState,
} from 'react';
import { GroupHugProps, User } from './types.d';

const colors = [
  '#FF38D1',
  '#8263FF',
  '#0095FF',
  '#00B874',
  '#FF3168',
  '#FFAB03',
  '#AABBCC'
];

const GroupHugCtx = createContext<{
  users: User[];
  self: User;
  size: number;
  darkMode: boolean;
  avatarTextColor: string;
  /* avatarBorderWidth: number; */
  avatarBackgroundColor: string;
  overlapping: boolean;
  transparency: number;
  maximum: number;
  MPOP: boolean;
  popover: ((id: string, name: string) => React.ReactNode) | undefined | null;
  placeholder: 'shape' | 'character';
  onMouseEnter: (user: User) => void;
  onMouseLeave: (user: User) => void;
} | null>(null);

const GroupHug = memo(
  ({
    presence,
    id,
    avatar = '',
    darkMode = false,
    avatarTextColor = '#000',
    avatarBorderColor = '',
    /* avatarBorderWidth = 2, */
    avatarBackgroundColor = '',
    name,
    size = 24,
    overlapping = true,
    transparency = 0.5,
    maximum = 5,
    MPOP = true,
    popover,
    placeholder = 'shape',
    onMouseEnter = () => { },
    onMouseLeave = () => { },
  }: GroupHugProps) => {
    // #region validate props
    if (size < 8) {
      console.warn('GroupHug: size must be greater than 8');
      size = 8;
    }
    // if (avatarBorderWidth < 0) {
    //   console.warn(
    //     'GroupHug: avatarBorderWidth must be greater than or equal to 0'
    //   );
    //   avatarBorderWidth = 0;
    // }
    if (transparency < 0 || transparency > 1) {
      console.warn('GroupHug: transparency must be between 0 and 1');
      transparency = Math.max(0, Math.min(1, transparency));
    }
    // #endregion

    // #region define the grouphug state
    if (!avatarBorderColor) {
      let idx = Math.floor(Math.random() * colors.length);
      avatarBorderColor = colors[idx];
    }
    if (!avatarBackgroundColor) {
      avatarBackgroundColor = avatarBorderColor;
    }
    const [myState, setMyState] = useState<User>({
      id,
      avatar,
      state: 'online',
      name,
      avatarBackgroundColor,
      avatarBorderColor,
      avatarTextColor,
    });
    const [users, setUsers] = useState<User[]>([myState]);
    const [connected, setConnected] = useState(false);
    const [channel, setChannel] = useState<IChannel | null>(null);
    // #endregion

    // #region initialize the presence connection
    useEffect(() => {
      (async () => {
        try {
          const yomo = await presence;
          const channel = await yomo.joinChannel('group-hug', myState);
          setConnected(true);
          setChannel(channel);
        } catch (e) {
          console.log(e);
        }
      })();

      return () => {
        channel?.leave();
      };
    }, []);
    // #endregion

    // #region subscribe to other peers joining the channel
    useEffect(() => {
      if (!channel) {
        return;
      }

      // listen to other peers joining the channel
      const unsubscribePeers = channel.subscribePeers(peers => {
        const users: User[] = [myState];
        (peers as User[]).forEach(peer => {
          if (MPOP) {
            // MPOP: this is a hack to avoid duplicate users
            if (!users.find(user => user.id === peer.id)) {
              users.push(peer);
            }
          } else if (!MPOP) {
            users.push(peer);
          }
        });
        setUsers([
          myState,
          ...(peers as User[]).filter(peer => 'avatar' in peer),
        ]);
      });

      return () => {
        unsubscribePeers?.();
      };
    }, [channel]);
    // #endregion

    // #region
    useEffect(() => {
      if (!channel) return;
      const unsubscribe = channel.subscribe(
        'change-state',
        ({ payload, state: { id } }: any) => {
          // find user
          const user = users.find(user => user.id === id);
          if (user) {
            setUsers(
              users.map(user => {
                if (user.id === id) {
                  console.log(payload, 'payload');
                  return payload;
                }
                return user;
              })
            );
          }
        }
      );
      return () => {
        unsubscribe();
      };
    }, [channel, users]);
    // #endregion

    // #region add event listeners to update the user state
    useEffect(() => {
      if (!channel) return;

      const state = document.hidden ? 'away' : 'online';
      const newState: User = {
        ...myState,
        state,
        name,
        avatar,
        avatarTextColor,
        avatarBorderColor,
        avatarBackgroundColor,
      };
      setMyState(newState);
      setUsers(users => {
        const idx = users.findIndex(user => user.id === id);
        if (idx > -1) {
          users[idx] = newState;
        }
        return users;
      });
      channel.broadcast('change-state', newState);
    }, [
      channel,
      name,
      avatar,
      avatarTextColor,
      avatarBorderColor,
      avatarBackgroundColor,
    ]);

    useEffect(() => {
      if (!channel) return;

      const visibilitychangeCb = () => {
        const state = document.hidden ? 'away' : 'online';
        const newState: User = {
          ...myState,
          state,
        };
        setMyState(newState);
        channel.broadcast('change-state', newState);
      };
      document.addEventListener('visibilitychange', visibilitychangeCb);

      return () => {
        document.removeEventListener('visibilitychange', visibilitychangeCb);
      };
    }, [channel, myState]);
    // #endregion

    if (!connected) {
      return <div></div>;
    }

    return (
      <GroupHugCtx.Provider
        value={{
          size,
          users,
          self: myState,
          darkMode,
          avatarTextColor,
          /* avatarBorderWidth, */
          avatarBackgroundColor,
          overlapping,
          transparency,
          maximum,
          MPOP,
          onMouseEnter,
          onMouseLeave,
          popover,
          placeholder,
        }}
      >
        <div
          className={`group-hug-relative group-hug-flex ${darkMode ? 'group-hug-dark' : ''
            }`}
          style={{
            marginRight: `${14 - Math.min(users.length, 6) * 2}px`,
          }}
        >
          {users.slice(0, maximum + 1).map((user, i) => {
            if (i < maximum) {
              return (
                <Avatar
                  style={{
                    transform: `translateX(${i * -(overlapping ? 8 : 0)}px)`,
                    zIndex: `${i}`,
                  }}
                  user={user}
                />
              );
            }
          })}
          {users.length > maximum && <Others />}
        </div>
      </GroupHugCtx.Provider>
    );
  }
);

export default GroupHug;

function ImageAvatar({ user }) {
  const ctx = useContext(GroupHugCtx);
  const { size, /* avatarBorderWidth */ } = ctx!;
  return (
    <>
      <img
        style={{
          minWidth: `${size}px`,
          width: `${size}px`,
          height: `${size}px`,
          objectFit: 'contain',
          // opacity: `${user.state === 'away' ? '0.5' : '1'}`,
          /* border: `${avatarBorderWidth}px solid ${user.avatarBorderColor}`, */
          background: `${user.avatarBackgroundColor}`,
        }}
        src={user.avatar}
        alt={user.id}
        className="group-hug-relative group-hug-rounded-full group-hug-box-content"
      />

      {user.state === 'away' && <Mask />}
    </>
  );
}

function TextAvatar({ user }) {
  const ctx = useContext(GroupHugCtx);
  const { size, /* avatarBorderWidth, */ placeholder } = ctx!;
  if (!!!user.name) return null;

  return (
    <>
      <div
        style={{
          minWidth: `${size}px`,
          minHeight: `${size}px`,
          width: `${size}px`,
          height: `${size}px`,
          lineHeight: `${size}px`,
          background: `${user.avatarBackgroundColor}`,
          /* border: `${avatarBorderWidth}px solid ${user.avatarBorderColor}`, */
          fontSize: '14px',
          color: user.avatarTextColor,
        }}
        className="group-hug-box-content group-hug-text-center group-hug-rounded-full"
      >
        <Avvvatars value={user.name} style={placeholder} size={size} />
      </div>

      {user.state === 'away' && <Mask />}
    </>
  );
}

function Others() {
  const [display, setDisplay] = useState(false);
  const ctx = useContext(GroupHugCtx);
  const { users, size, maximum, overlapping, /* avatarBorderWidth */ } = ctx!;

  return (
    <div
      className="group-hug-rounded-full group-hug-border-[2px] group-hug-border-white group-hug-z-10 group-hug-cursor-pointer dark:group-hug-border-black"
      style={{
        transform: `translateX(${overlapping ? maximum * -8 : 0}px)`,
      }}
    >
      <div
        style={{
          minWidth: `${size}px`,
          width: `${size}px`,
          height: `${size}px`,
          /* borderWidth: `${avatarBorderWidth}px`, */
        }}
        className={`group-hug-box-content group-hug-relative group-hug-text-[#666666] group-hug-text-[12px] group-hug-font-[500]
    group-hug-border-[#999999]
  dark:group-hug-border-[#666666]
    dark:group-hug-text-[#DDDDDD]
    group-hug-rounded-full
    hover:group-hug-border-[#000000]
    hover:group-hug-text-[#000000]
    dark:hover:group-hug-border-[#ffffff]
    dark:hover:group-hug-text-[#ffffff]
    ${display
            ? 'group-hug-bg-[#EAEAEA] dark:group-hug-bg-[#333333]'
            : 'group-hug-bg-white dark:group-hug-bg-black'
          }`}
      >
        <span
          className="group-hug-absolute group-hug-inline-flex group-hug-items-center group-hug-justify-center group-hug-w-full group-hug-h-full group-hug-rounded-full "
          onClick={() => setDisplay(!display)}
        >
          +{users.length - maximum}
        </span>

        <span
          className="group-hug-flex group-hug-flex-col group-hug-items-end
         group-hug-absolute group-hug-text-[14px] group-hug-whitespace-nowrap group-hug-font-[400]"
          style={{
            top: `${size + 8 + 5 / 2}px`,
            display: display ? '' : 'none',
            right: `0`,
          }}
        >
          <div
            className="group-hug-w-[10px] group-hug-h-[10px]
          group-hug-bg-[white] dark:group-hug-bg-[#34323E]
          group-hug-shadow-[0px_0px_2px_0px_rgb(0_0_0_/_0.1)] group-hug-z-10"
            style={{
              transform: `translateX(calc(-${size}px / 2 + 10px / 2)) rotate(135deg)`,
            }}
          ></div>
          <div
            className="group-hug-absolute group-hug-w-[12px] group-hug-h-[12px]
          group-hug-bg-[white] dark:group-hug-bg-[#34323E]
          group-hug-top-[0.5px] group-hug-z-10"
            style={{
              transform: `translateX(calc(-${size}px / 2 + 10px / 2)) rotate(135deg)`,
            }}
          ></div>

          <div className="group-hug-absolute group-hug-bg-white dark:group-hug-bg-[#34323E] group-hug-p-[10px] group-hug-shadow-[0px_1px_4px_0px_rgb(0_0_0_/_0.1)] group-hug-rounded-[6px] group-hug-translate-y-[5px]">
            {users.slice(5, users.length).map(user => (
              <div
                key={user.id}
                className="group-hug-flex group-hug-items-center group-hug-gap-2 group-hug-p-[10px]
            dark:hover:group-hug-bg-[#414251] hover:group-hug-bg-[#F5F5F5] group-hug-rounded-[6px]"
              >
                <Avatar
                  user={user}
                  usePopover={false}
                  style={{
                    border: 'none',
                  }}
                />
                <span className="group-hug-text-black dark:group-hug-text-white">
                  {user.name}
                </span>
              </div>
            ))}
          </div>
        </span>
      </div>
    </div>
  );
}

function Popover({ display, name, id }) {
  const ctx = useContext(GroupHugCtx);
  const { size, self, popover } = ctx!;

  return (
    <div
      className="group-hug-flex group-hug-flex-col group-hug-items-center group-hug-absolute group-hug-text-[14px]
    group-hug-text-black dark:group-hug-text-white
    group-hug-font-[400]"
      style={{
        top: `${size}px`,
        display: display ? '' : 'none',
        transform: `translateX(calc(-50% + ${size / 2}px))`,
        paddingTop: `${8 + 5}px`,
      }}
    >
      {popover ? (
        popover(id, name)
      ) : (
        <>
          <div
            className="group-hug-w-[10px] group-hug-h-[10px]
  group-hug-bg-[white] dark:group-hug-bg-[#34323E]
  group-hug-shadow-[0px_0px_2px_0px_rgb(0_0_0_/_0.1)]
  group-hug-rotate-[135deg] group-hug-z-10"
          ></div>
          <div
            className="group-hug-absolute group-hug-w-[12px] group-hug-h-[12px]
  group-hug-bg-[white] dark:group-hug-bg-[#34323E]
  group-hug-top-[0.5px]
  group-hug-rotate-[135deg] group-hug-z-10"
            style={{
              marginTop: `${8 + 5}px`,
            }}
          ></div>
          <span
            className="group-hug-bg-white dark:group-hug-bg-[#34323E] group-hug-p-2 group-hug-rounded-[6px] group-hug-whitespace-nowrap
    group-hug-shadow-[0px_1px_4px_0px_rgb(0_0_0_/_0.1)] group-hug--translate-y-[5px]"
          >{`${name} ${id === self.id ? '(you)' : ''}`}</span>
        </>
      )}
    </div>
  );
}

function Avatar({
  style = {},
  user,
  usePopover = true,
}: {
  style?: any;
  user: User;
  usePopover?: boolean;
}) {
  const ctx = useContext(GroupHugCtx);
  const { onMouseEnter, onMouseLeave } = ctx!;
  const [display, setDisplay] = useState(false);
  return (
    <div
      style={style}
      className={`group-hug-relative group-hug-rounded-full group-hug-border-[2px] group-hug-border-white dark:group-hug-border-black group-hug-select-none`}
      onMouseEnter={() => {
        setDisplay(true);
        onMouseEnter?.(user);
      }}
      onMouseLeave={() => {
        setDisplay(false);
        onMouseLeave?.(user);
      }}
    >
      {user.avatar ? <ImageAvatar user={user} /> : <TextAvatar user={user} />}
      {usePopover && (
        <Popover display={display} name={user.name} id={user.id} />
      )}
    </div>
  );
}

function Mask() {
  const ctx = useContext(GroupHugCtx);
  const { transparency } = ctx!;

  return (
    <span
      className="group-hug-absolute group-hug-top-[0px] group-hug-left-[0px]
  group-hug-bg-white dark:group-hug-bg-black group-hug-rounded-full"
      style={{
        width: `calc(100%)`,
        height: `calc(100%)`,
        opacity: `${transparency}`,
      }}
    ></span>
  );
}
