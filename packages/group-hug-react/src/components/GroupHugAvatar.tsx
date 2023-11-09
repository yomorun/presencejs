import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Avvvatars from 'avvvatars-react';
import { useState } from 'react';
import { User } from '../../types';

const TextAvatar = ({
  name,
  placeholder,
  size,
}: {
  name: string;
  placeholder: 'shape' | 'character';
  size: number;
}) => {
  return <Avvvatars value={name} style={placeholder} size={size} />;
};

const ImageAvatar = ({ avatar, name, size }: { avatar: string; name: string; size: number }) => {
  return (
    <Avatar style={{ height: size, width: size }}>
      <AvatarImage src={avatar} />
      <AvatarFallback>{name.charAt(0)}</AvatarFallback>
    </Avatar>
  );
};

const Popover = ({
  id,
  name,
  popover,
}: {
  id: string;
  name: string;
  popover: ((id: string, name: string) => React.ReactNode) | undefined | null;
}) => {
  return (
    <div className='absolute items-center text-[14px] text-black dark:bg-[#34323E] dark:text-white'>
      {popover ? (
        popover(id, name)
      ) : (
        <span className='whitespace-nowrap rounded-md p-2 shadow-[0px_1px_4px_0px_rgb(0_0_0_/_0.1)] dark:bg-[#34323E]'>
          {name}
        </span>
      )}
    </div>
  );
};

const Mask = ({ transparency }: { transparency: number }) => {
  return (
    <span
      className='absolute left-0 top-0 h-full w-full rounded-full bg-white dark:bg-black'
      style={{ opacity: transparency }}
    />
  );
};

export const GroupHugAvatar = ({
  placeholder,
  popover,
  size,
  transparency,
  user,
  onMouseEnter,
  onMouseLeave,
}: {
  placeholder: 'shape' | 'character';
  popover: ((id: string, name: string) => React.ReactNode) | undefined | null;
  size: number;
  transparency: number;
  user: User;
  onMouseEnter: (user: User) => void;
  onMouseLeave: (user: User) => void;
}) => {
  const [showPopover, setShowPopover] = useState<boolean>(false);

  return (
    <div
      className='relative rounded-full'
      onMouseEnter={() => {
        setShowPopover(true);
        onMouseEnter(user);
      }}
      onMouseLeave={() => {
        setShowPopover(false);
        onMouseLeave(user);
      }}
    >
      {user.avatar ? (
        <ImageAvatar avatar={user.avatar} name={user.name} size={size} />
      ) : (
        <TextAvatar name={user.name} placeholder={placeholder} size={size} />
      )}
      {user.state === 'away' && <Mask transparency={transparency} />}
      {showPopover && <Popover id={user.id} name={user.name} popover={popover} />}
    </div>
  );
};
