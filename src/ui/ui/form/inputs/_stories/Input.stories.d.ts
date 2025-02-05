import { ReactNode } from 'react';
import { Meta } from '@storybook/react';
import { Input } from '../Input';
import { NInput } from '../models';
declare const _default: Meta<typeof Input>;
export default _default;
export declare const DefaultInput: (argTypes: NInput.TProps) => ReactNode;
export declare const DisabledInput: {
    (argTypes: NInput.TProps): ReactNode;
    args: {
        isDisabled: boolean;
    };
};
export declare const ErrorInput: {
    (argTypes: NInput.TProps): ReactNode;
    args: {
        status: string;
    };
};
export declare const WarningInput: {
    (argTypes: NInput.TProps): ReactNode;
    args: {
        status: string;
    };
};
export declare const SmallInput: {
    (argTypes: NInput.TProps): ReactNode;
    args: {
        size: string;
    };
};
export declare const MiddleInput: {
    (argTypes: NInput.TProps): ReactNode;
    args: {
        size: string;
    };
};
export declare const LargeInput: {
    (argTypes: NInput.TProps): ReactNode;
    args: {
        size: string;
    };
};
export declare const CountingInput: {
    (argTypes: NInput.TProps): ReactNode;
    args: {
        maxLength: number;
        showCount: boolean;
    };
};
export declare const SmallFloatInput: {
    (argTypes: NInput.TProps): ReactNode;
    args: {
        size: string;
        placeholder: string;
        title: string;
    };
};
export declare const MiddleFloatInput: {
    (argTypes: NInput.TProps): ReactNode;
    args: {
        title: string;
    };
};
export declare const LargeFloatInput: {
    (argTypes: NInput.TProps): ReactNode;
    args: {
        size: string;
        placeholder: string;
        title: string;
    };
};
