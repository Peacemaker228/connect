import { ReactNode } from 'react';
import { Meta } from '@storybook/react';
import { ButtonSkeleton } from './ButtonSkeleton';
import { NButtonSkeleton } from './models';
declare const _default: Meta<typeof ButtonSkeleton>;
export default _default;
export declare const DefaultButton: {
    (argTypes: NButtonSkeleton.TProps): ReactNode;
    args: {
        isActive: boolean;
    };
};
