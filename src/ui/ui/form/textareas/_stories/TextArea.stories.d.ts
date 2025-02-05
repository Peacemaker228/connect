import { ReactNode } from 'react';
import { Meta } from '@storybook/react';
import { NTextArea } from '../models.js';
import { TextArea } from '../TextArea.js';
declare const _default: Meta<typeof TextArea>;
export default _default;
export declare const DefaultTextArea: {
    (argTypes: NTextArea.TProps): ReactNode;
    args: {
        autoSize: boolean;
        onChange: import('@vitest/spy').Mock<(...args: any[]) => any>;
        height: string;
    };
};
export declare const AutoSizeTextArea: {
    (argTypes: NTextArea.TProps): ReactNode;
    args: {
        autoSize: {
            minRows: number;
            maxRows: number;
        };
        onChange: import('@vitest/spy').Mock<(...args: any[]) => any>;
        allowClear: boolean;
    };
};
export declare const CountingTextArea: {
    (argTypes: NTextArea.TProps): ReactNode;
    args: {
        maxLength: number;
        onChange: import('@vitest/spy').Mock<(...args: any[]) => any>;
        showCount: boolean;
    };
};
export declare const NoStretchTextArea: {
    (argTypes: NTextArea.TProps): ReactNode;
    args: {
        autoSize: {
            maxRows: number;
        };
        isTopContent: boolean;
    };
};
