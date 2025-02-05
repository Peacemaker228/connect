import { ReactNode } from 'react';
import { Meta } from '@storybook/react';
import { NTag } from '../models';
declare const meta: Meta<NTag.TProps>;
export default meta;
export declare const DefaultTag: {
    (args: NTag.TProps): import("react/jsx-runtime").JSX.Element;
    storyName: string;
    args: {
        color: undefined;
    };
};
export declare const BorderTag: () => ReactNode;
export declare const ColorfulTag: () => ReactNode;
export declare const CheckableTag: () => ReactNode;
export declare const StatusTag: () => ReactNode;
