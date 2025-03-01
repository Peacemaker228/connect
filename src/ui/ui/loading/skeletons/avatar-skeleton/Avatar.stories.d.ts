import { ReactNode } from 'react';
import { Meta } from '@storybook/react';
import { AvatarSkeleton } from './AvatarSkeleton';
import { NAvatarSkeleton } from './models';
declare const _default: Meta<typeof AvatarSkeleton>;
export default _default;
export declare const DefaultAvatar: {
    (argTypes: NAvatarSkeleton.TProps): ReactNode;
    args: {
        isActive: boolean;
    };
};
