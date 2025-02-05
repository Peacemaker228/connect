import { ReactNode } from 'react';
import { Meta } from '@storybook/react';
import { NNodeSkeleton } from './models';
import { NodeSkeleton } from './NodeSkeleton';
declare const _default: Meta<typeof NodeSkeleton>;
export default _default;
export declare const DefaultNode: {
    (argTypes: NNodeSkeleton.TProps): ReactNode;
    args: {
        isActive: boolean;
        isFullSize: boolean;
        children: string;
    };
};
