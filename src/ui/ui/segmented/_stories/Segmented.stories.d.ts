import { ReactNode } from 'react';
import { Meta } from '@storybook/react';
import { NSegmented } from '../models';
import { Segmented } from '../Segmented';
declare const _default: Meta<typeof Segmented>;
export default _default;
export declare const Default: {
    (argTypes: NSegmented.TProps): ReactNode;
    args: {
        options: string[];
    };
};
export declare const Block: {
    (argTypes: NSegmented.TProps): ReactNode;
    args: {
        block: boolean;
        options: string[];
    };
};
export declare const Disabled: {
    (argTypes: NSegmented.TProps): ReactNode;
    args: {
        options: (string | {
            label: string;
            value: string;
            disabled: boolean;
        })[];
    };
};
export declare const WithIcon: {
    (argTypes: NSegmented.TProps): ReactNode;
    args: {
        options: {
            label: string;
            value: string;
            icon: import("react/jsx-runtime").JSX.Element;
        }[];
    };
};
export declare const Sizes: {
    (argTypes: NSegmented.TProps): ReactNode;
    args: {
        options: string[];
    };
};
