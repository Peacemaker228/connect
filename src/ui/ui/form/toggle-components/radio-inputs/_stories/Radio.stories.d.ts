import { ReactNode } from 'react';
import { Meta } from '@storybook/react';
import { NRadio } from '../models';
import { Radio } from '../Radio';
declare const _default: Meta<typeof Radio>;
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
        isChecked: boolean;
        isDisabled: boolean;
    };
};
