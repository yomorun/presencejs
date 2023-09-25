import { IPresence } from '@yomo/presence';
import 'vite/client';

type FilterOptional<T> = Pick<
  T,
  Exclude<
    {
      [K in keyof T]: T extends Record<K, T[K]> ? K : never;
    }[keyof T],
    undefined
  >
>;

type FilterNotOptional<T> = Pick<
  T,
  Exclude<
    {
      [K in keyof T]: T extends Record<K, T[K]> ? never : K;
    }[keyof T],
    undefined
  >
>;

type PartialEither<T, K extends keyof any> = {
  [P in Exclude<keyof FilterOptional<T>, K>]-?: T[P];
} &
  { [P in Exclude<keyof FilterNotOptional<T>, K>]?: T[P] } &
  {
    [P in Extract<keyof T, K>]?: undefined;
  };

type Object = {
  [name: string]: any;
};

export type EitherOr<O extends Object, L extends string, R extends string> = (
  | PartialEither<Pick<O, L | R>, L>
  | PartialEither<Pick<O, L | R>, R>
) &
  Omit<O, L | R>;

export type GroupHugProps = {
  presence: Promise<IPresence>;
  // channel id
  channel: string;
  id: string;
  avatar?: string;
  name: string;
  MPOP?: boolean;
  popover?: ((id: string, name: string) => React.ReactNode) | undefined | null;
  darkMode?: boolean;
  avatarTextColor?: string;
  avatarBackgroundColor?: string;
  avatarBorderColor?: string;
  avatarBorderWidth?: number;
  size?: number;
  overlapping?: boolean;
  transparency?: number;
  maximum?: number;
  placeholder?: 'shape' | 'character';

  onMouseEnter?: (user: User) => void;
  onMouseLeave?: (user: User) => void;
};

export type User = {
  id: string;
  avatar: string;
  state: 'online' | 'away';
  avatarBackgroundColor: string;
  avatarTextColor: string;
  avatarBorderColor: string;
  name: string;
};

declare const GroupHug: (props: GroupHugProps) => JSX.Element;
export default GroupHug;
