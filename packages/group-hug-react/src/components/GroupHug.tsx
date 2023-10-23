import { User } from '@/vite-env';
import { GroupHugAvatar } from './GroupHugAvatar';

export const GroupHug = ({
    darkMode,
    maximum,
    onMouseEnter,
    onMouseLeave,
    peers,
    placeholder,
    popover,
    size,
    transparency,
}: {
    darkMode: boolean;
    maximum: number;
    onMouseEnter: (user: User) => void;
    onMouseLeave: (user: User) => void;
    peers: User[];
    placeholder: 'shape' | 'character';
    popover: ((id: string, name: string) => React.ReactNode) | undefined | null;
    size: number;
    transparency: number;
}) => {
    return (
        <div className={`relative flex ${darkMode ? 'dark' : ''}`}>
            {peers.slice(0, maximum).map((peer) => (
                <GroupHugAvatar
                    key={peer.id}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                    placeholder={placeholder}
                    popover={popover}
                    size={size}
                    transparency={transparency}
                    user={peer}
                />
            ))}
        </div>
    );
};
