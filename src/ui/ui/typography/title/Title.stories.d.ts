import { ReactNode } from 'react';
import { Meta } from '@storybook/react';
import { Title } from './Title';
import { NTypography } from '../models';
declare const _default: Meta<typeof Title>;
export default _default;
export declare const DefaultTitle: {
    (argTypes: NTypography.TTitleProps): ReactNode;
    args: {
        level: number;
        style: {
            display: string;
            alignItems: string;
            justifyContent: string;
        };
    };
};
export declare const ColorfulTitle: {
    (argTypes: NTypography.TTitleProps): ReactNode;
    args: {
        level: number;
        style: {
            display: string;
            alignItems: string;
            justifyContent: string;
        };
    };
};
export declare const SizeVariationsTitle: {
    (argTypes: NTypography.TTitleProps): ReactNode;
    args: {
        level: number;
        style: {
            display: string;
            alignItems: string;
            justifyContent: string;
        };
    };
};
export declare const TitleWithoutMargins: {
    (argTypes: NTypography.TTitleProps): ReactNode;
    args: {
        isRemoveAllMargins: boolean;
        level: number;
        style: {
            display: string;
            alignItems: string;
            justifyContent: string;
        };
    };
};
