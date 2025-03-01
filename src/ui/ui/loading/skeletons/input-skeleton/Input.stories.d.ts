import { ReactNode } from 'react';
import { Meta } from '@storybook/react';
import { InputSkeleton } from './InputSkeleton';
import { NInputSkeleton } from './models';
declare const _default: Meta<typeof InputSkeleton>;
export default _default;
export declare const DefaultInput: {
    (argTypes: NInputSkeleton.TProps): ReactNode;
    args: {
        isActive: boolean;
        isBlock: boolean;
    };
};
