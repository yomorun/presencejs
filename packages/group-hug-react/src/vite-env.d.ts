/// <reference types="vite/client" />
import { IPresence } from '@yomo/presence';
import React from 'react';

export type GroupHugProps = {
    MPOP?: boolean;
    avatar?: string;
    avatarBackgroundColor?: string;
    avatarBorderColor?: string;
    avatarBorderWidth?: number;
    avatarTextColor?: string;
    channel: string;
    darkMode?: boolean;
    id: string;
    maximum?: number;
    name: string;
    onMouseEnter?: (user: User) => void;
    onMouseLeave?: (user: User) => void;
    overlapping?: boolean;
    placeholder?: 'shape' | 'character';
    popover?: ((id: string, name: string) => React.ReactNode) | undefined | null;
    presence: Promise<IPresence>;
    size?: number;
    transparency?: number;
};

export type User = {
    avatar: string;
    avatarBackgroundColor: string;
    avatarBorderColor: string;
    avatarTextColor: string;
    id: string;
    name: string;
    state: 'online' | 'away';
};

declare const GroupHug: ({
    MPOP,
    avatar,
    avatarBackgroundColor,
    avatarBorderColor,
    avatarBorderWidth,
    avatarTextColor,
    channel,
    darkMode,
    id,
    maximum,
    name,
    onMouseEnter,
    onMouseLeave,
    overlapping,
    placeholder,
    popover,
    presence,
    size,
    transparency,
}: GroupHugProps) => React.JSX.Element;
export default GroupHug;
