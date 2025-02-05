import { ReactNode } from 'react';
import { Meta } from '@storybook/react';
import { Divider } from '../Divider';
import { NDivider } from '../models';
declare const _default: Meta<typeof Divider>;
export default _default;
export declare const DefaultDivider: {
    (argTypes: NDivider.TProps): ReactNode;
    args: {
        type: string;
        isPlain: boolean;
    };
};
export declare const DividerOrientation: {
    (argTypes: NDivider.TProps): ReactNode;
    args: {
        children: string;
        type: string;
        isPlain: boolean;
    };
};
export declare const VerticalDivider: {
    (argTypes: NDivider.TProps): ReactNode;
    args: {
        type: string;
        isPlain: boolean;
        children: string;
    };
};
export declare const DashedDivider: {
    (argTypes: NDivider.TProps): ReactNode;
    args: {
        isDashed: boolean;
        children: string;
        type: string;
        isPlain: boolean;
    };
};
