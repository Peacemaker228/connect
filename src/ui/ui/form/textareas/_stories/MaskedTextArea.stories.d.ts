import { ReactNode } from 'react';
import { Meta } from '@storybook/react';
import { NTextArea } from '../models.js';
import { default as MaskedTextArea } from '../MaskedTextArea.js';
declare const _default: Meta<typeof MaskedTextArea>;
export default _default;
export declare const DefaultTextArea: {
    (argTypes: NTextArea.TMaskedProps): ReactNode;
    args: {
        autoSize: boolean;
        height: string;
        onChange: import('@vitest/spy').Mock<(...args: any[]) => any>;
        mask: RegExp[];
        placeholder: string;
    };
};
export declare const AutoSizeTextArea: {
    (argTypes: NTextArea.TMaskedProps): ReactNode;
    args: {
        autoSize: {
            minRows: number;
            maxRows: number;
        };
        onChange: import('@vitest/spy').Mock<(...args: any[]) => any>;
        mask: RegExp[];
        placeholder: string;
        allowClear: boolean;
    };
};
export declare const NoStretchTextArea: {
    (argTypes: NTextArea.TMaskedProps): ReactNode;
    args: {
        autoSize: {
            maxRows: number;
        };
        isTopContent: boolean;
        mask: (string | RegExp)[];
        placeholder: string;
    };
};
