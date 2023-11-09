/// <reference lib="dom" />
import { IPresence } from '@yomo/presence';
import React from 'react';

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

declare const GroupHug: ({ presence, channel, id, avatar, darkMode, avatarTextColor, avatarBorderColor, avatarBorderWidth, avatarBackgroundColor, name, size, overlapping, transparency, maximum, MPOP, popover, placeholder, onMouseEnter, onMouseLeave, }: GroupHugProps) => React.JSX.Element;
export default GroupHug;
