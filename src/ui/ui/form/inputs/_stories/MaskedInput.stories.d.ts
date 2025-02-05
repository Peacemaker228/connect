import { ReactNode } from 'react';
import { Meta } from '@storybook/react';
import { default as MaskedInput } from '../MaskedInput';
import { NInput } from '../models';
declare const meta: Meta<typeof MaskedInput>;
export default meta;
export declare const DefaultInput: (argTypes: NInput.TMaskedProps) => ReactNode;
export declare const CustomMaskInput: {
    (argTypes: NInput.TMaskedProps): ReactNode;
    args: {
        mask: (string | RegExp)[];
        placeholder: string;
    };
};
export declare const DynamicMaskInput: {
    (argTypes: NInput.TMaskedProps): ReactNode;
    args: {
        mask: (value: string) => (string | RegExp)[];
        placeholder: string;
    };
};
export declare const DateMaskInput: {
    (argTypes: NInput.TMaskedProps): ReactNode;
    args: {
        mask: (string | RegExp)[];
        placeholder: string;
    };
};
