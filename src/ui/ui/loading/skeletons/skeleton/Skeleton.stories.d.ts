import { ReactNode } from 'react';
import { Meta } from '@storybook/react';
import { NSkeleton } from './models';
import { Skeleton } from './Skeleton';
declare const _default: Meta<typeof Skeleton>;
export default _default;
export declare const DefaultSkeleton: {
    (argTypes: NSkeleton.TProps): ReactNode;
    args: {
        isActive: boolean;
        isLoading: boolean;
    };
};
