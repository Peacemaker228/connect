import { ReactNode } from 'react';
import { Meta } from '@storybook/react';
import { ImageSkeleton } from './ImageSkeleton';
import { NImageSkeleton } from './models';
declare const _default: Meta<typeof ImageSkeleton>;
export default _default;
export declare const DefaultImage: {
    (argTypes: NImageSkeleton.TProps): ReactNode;
    storyName: string;
    args: {
        isActive: boolean;
    };
};
