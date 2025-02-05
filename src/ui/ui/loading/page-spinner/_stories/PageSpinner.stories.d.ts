import { ReactNode } from 'react';
import { Meta } from '@storybook/react';
import { NPageSpinner } from '../models';
import { PageSpinner } from '../PageSpinner';
declare const _default: Meta<typeof PageSpinner>;
export default _default;
export declare const DefaultSpinner: {
    (argTypes: NPageSpinner.TProps): ReactNode;
    storyName: string;
};
export declare const SmallSpinner: {
    (argTypes: NPageSpinner.TProps): ReactNode;
    storyName: string;
    args: {
        size: string;
    };
};
export declare const LargeSpinner: {
    (argTypes: NPageSpinner.TProps): ReactNode;
    storyName: string;
    args: {
        size: string;
    };
};
export declare const DelaySpinner: {
    (argTypes: NPageSpinner.TProps): ReactNode;
    storyName: string;
    args: {
        delay: number;
    };
};
