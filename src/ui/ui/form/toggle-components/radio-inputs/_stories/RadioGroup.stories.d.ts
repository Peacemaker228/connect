import { ReactNode } from 'react';
import { Meta } from '@storybook/react';
import { NRadio } from '../models';
import { RadioGroup } from '../RadioGroup';
declare const _default: Meta<typeof RadioGroup>;
export default _default;
export declare const Default: {
    (argTypes: NRadio.TRadioGroupProps): ReactNode;
    args: {
        options: string[];
        isChecked: boolean;
    };
};
export declare const Disabled: {
    (argTypes: NRadio.TRadioGroupProps): import("react/jsx-runtime").JSX.Element;
    args: {
        isDisabled: boolean;
        options: string[];
        isChecked: boolean;
    };
};
export declare const SizeVariants: {
    (argTypes: NRadio.TRadioGroupProps): import("react/jsx-runtime").JSX.Element;
    args: {
        optionType: string;
        isChecked: boolean;
        options: string[];
    };
};
export declare const Solid: {
    (argTypes: NRadio.TRadioGroupProps): import("react/jsx-runtime").JSX.Element;
    args: {
        options: string[];
        optionType: string;
        buttonStyle: string;
        isChecked: boolean;
    };
};
export declare const ChangeColorFromTheSelectedValue: {
    (argTypes: NRadio.TRadioGroupProps): import("react/jsx-runtime").JSX.Element;
    args: {
        options: {
            label: string;
            value: string;
            style: {
                borderColor: string;
                color: string;
            };
        }[];
        optionType: string;
    };
};
