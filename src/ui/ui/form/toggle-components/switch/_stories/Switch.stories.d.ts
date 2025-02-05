import { ReactNode } from 'react';
import { Meta } from '@storybook/react';
import { NSwitch } from '../models';
import { Switch } from '../Switch';
declare const _default: Meta<typeof Switch>;
export default _default;
export declare const Default: (argTypes: NSwitch.TProps) => ReactNode;
export declare const Disabled: {
    (argTypes: NSwitch.TProps): ReactNode;
    args: {
        isDisabled: boolean;
    };
};
export declare const WithLabel: (argTypes: NSwitch.TProps) => ReactNode;
