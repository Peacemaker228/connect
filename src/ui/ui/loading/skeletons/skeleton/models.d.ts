import { NAvatarSkeleton } from '../avatar-skeleton';
import * as React from 'react';
export type WidthUnit = number | string;
export declare namespace NSkeleton {
    type TTitleConfig = {
        width?: number | string;
    };
    type TParagraphConfig = {
        className?: string;
        prefixCls?: string;
        rows?: number;
        style?: React.CSSProperties;
        width?: number | string | (number | string)[];
    };
    type TProps = {
        isActive?: boolean;
        isAvatar?: boolean | NAvatarSkeleton.TProps;
        isLoading?: boolean;
        isParagraph?: boolean | TParagraphConfig;
        isRound?: boolean;
        isTitle?: boolean | TTitleConfig;
        /**
         * Префикс для CSS-классов
         */
        prefixCls?: string;
        className?: string;
        rootClassName?: string;
        style?: React.CSSProperties;
        children?: React.ReactNode;
    };
}
