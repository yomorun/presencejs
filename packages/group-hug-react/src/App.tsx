import { IChannel } from '@yomo/presence';
import { useEffect, useState } from 'react';
import { GroupHug } from './components/GroupHug';
import { GroupHugProps, User } from './vite-env';

const colors = ['#FF38D1', '#8263FF', '#0095FF', '#00B874', '#FF3168', '#FFAB03', '#AABBCC'];
const idx = Math.floor(Math.random() * colors.length);

function App({
    avatar = '',
    avatarBackgroundColor = colors[idx],
    avatarBorderColor = colors[idx],
    avatarBorderWidth = 2,
    avatarTextColor = '#000',
    channel,
    darkMode = false,
    id,
    maximum = 5,
    name,
    onMouseEnter = () => {},
    onMouseLeave = () => {},
    // overlapping = true,
    placeholder = 'shape',
    popover,
    presence,
    size = 36,
    transparency = 0.5,
}: GroupHugProps) {
    const [ch, setCh] = useState<IChannel | null>(null);
    const [peers, setPeers] = useState<User[]>([]);
    const [myState, setMyState] = useState<User>({
        avatar,
        avatarBackgroundColor,
        avatarBorderColor,
        avatarTextColor,
        id,
        name,
        state: 'online',
    });

    useEffect(() => {
        if (presence === null) {
            console.warn('GroupHug: presence is required');
            return;
        }
        if (!channel) {
            console.warn('GroupHug: channel is required');
            return;
        }

        (async () => {
            try {
                const yomo = await presence;
                const tempChannel = await yomo.joinChannel(channel, myState);
                setCh(tempChannel);
            } catch (error) {
                console.log(error);
            }
        })();

        const selfVisibilityChange = () =>
            setMyState((prevState) => {
                return { ...prevState, state: document.hidden ? 'away' : 'online' };
            });
        document.addEventListener('visibilitychange', selfVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', selfVisibilityChange);
            ch?.leave();
        };
    }, []);

    useEffect(() => {
        if (!ch) return;

        ch?.subscribePeers((peers) => setPeers(peers as User[]));

        ch?.subscribe('change-state', (p: User) => {
            setPeers((prevPeers) => {
                const tempPeers = prevPeers.filter((u) => u.id !== p.id);
                return [...tempPeers, p];
            });
        });
    }, [ch]);

    useEffect(() => {
        if (!ch) return;
        ch?.broadcast('change-state', myState);
    }, [myState]);

    if (size < 8) {
        console.warn('GroupHug: size must be greater than 8');
        return;
    }
    if (avatarBorderWidth < 0) {
        console.warn('GroupHug: avatarBorderWidth must be greater than or equal to 0');
        return;
    }
    if (transparency < 0 || transparency > 1) {
        console.warn('GroupHug: transparency must be between 0 and 1');
        return;
    }

    return (
        <GroupHug
            darkMode={darkMode}
            maximum={maximum}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            peers={peers}
            placeholder={placeholder}
            popover={popover}
            size={size}
            transparency={transparency}
        />
    );
}

export default App;
