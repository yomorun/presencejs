import { IPresence } from '@yomo/presence';

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

export interface CursorChatProps {
  presence: Promise<IPresence>;
  id: string;
  avatar?: string;
  name?: string;
  state?: 'online' | 'away';
  color?: string;
  region?: string;
  latency?: number;
}

export interface Cursor {
  id: string;
  avatar?: string;
  name?: string;
  message?: string;
  state?: 'online' | 'away';
  color: string;
  region?: string;
  latency?: number;
  x: number;
  y: number;
}

declare const CursorChat: (props: CursorChatProps) => JSX.Element;
export default CursorChat;
