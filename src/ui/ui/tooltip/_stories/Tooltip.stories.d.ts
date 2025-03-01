import { default as React, ReactNode } from 'react';
import { Meta } from '@storybook/react';
import { NTooltip } from '../models';
import { Tooltip } from '../Tooltip';
declare const _default: Meta<typeof Tooltip>;
export default _default;
export declare const Default: {
    (argTypes: NTooltip.TProps): ReactNode;
    args: {
        title: string;
    };
};
export declare const Placement: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, NTooltip.TProps>;
export declare const Arrow: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, NTooltip.TProps>;
export declare const Colorful: {
    (argTypes: NTooltip.TProps): ReactNode;
    args: {
        title: string;
    };
};
export declare const Disabled: React.FC;
export declare const CombinedTooltipSingleRow: {
    (argTypes: NTooltip.TProps): ReactNode;
    args: {
        width: string;
        combined: {
            type: string;
            rows: {
                label: string;
                value: import("react/jsx-runtime").JSX.Element;
            }[];
        };
        title: string;
    };
};
export declare const CombinedTooltipDoubleRow: {
    (argTypes: NTooltip.TProps): ReactNode;
    args: {
        width: string;
        combined: {
            type: string;
            rows: {
                label: string;
                value: import("react/jsx-runtime").JSX.Element;
            }[];
        };
        title: string;
    };
};
