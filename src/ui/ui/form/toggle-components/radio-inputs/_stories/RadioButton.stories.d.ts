import { ReactNode } from 'react';
import { Meta } from '@storybook/react';
import { NRadio } from '../models';
import { RadioButton } from '../RadioButton';
declare const _default: Meta<typeof RadioButton>;
export default _default;
export declare const Default: {
    (argTypes: NRadio.TProps): ReactNode;
    args: {
        children: string;
        isChecked: boolean;
    };
};
export declare const Disabled: {
    (argTypes: NRadio.TProps): import("react/jsx-runtime").JSX.Element;
    args: {
        children: string;
        isDisabled: boolean;
    };
};
