import { ReactNode } from 'react';
import { Meta } from '@storybook/react';
import { NSelect } from '../models.js';
import { MultipleSelect } from '../MultiSelect.js';
declare const _default: Meta<typeof MultipleSelect>;
export default _default;
export declare const DefaultMultiSelect: {
    (argTypes: NSelect.TMultipleProps): ReactNode;
    args: {
        options: {
            label: string;
            value: string;
        }[];
        defaultValue: string[];
        mode: string;
        maxTagTextLength: number;
        allowClear: boolean;
    };
};
export declare const DisabledMultiSelect: {
    (argTypes: NSelect.TMultipleProps): ReactNode;
    args: {
        isDisabled: boolean;
        options: {
            label: string;
            value: string;
        }[];
        defaultValue: string[];
        mode: string;
        maxTagTextLength: number;
        allowClear: boolean;
    };
};
export declare const VariantsMultiSelect: {
    (argTypes: NSelect.TMultipleProps): ReactNode;
    args: {
        defaultValue: string[];
        style: {
            margin: number;
        };
        options: {
            value: string;
            label: string;
        }[];
    };
};
export declare const ResponsiveMultiSelect: {
    (argTypes: NSelect.TMultipleProps): ReactNode;
    args: {
        maxTagCount: string;
        options: {
            label: string;
            value: string;
        }[];
    };
};
export declare const NoStretchMultiSelect: {
    (argTypes: NSelect.TMultipleProps): ReactNode;
    args: {
        allowClear: boolean;
        isTopContent: boolean;
        options: {
            label: string;
            value: string;
        }[];
    };
};
export declare const LimitInputHeight: {
    (argTypes: NSelect.TMultipleProps): ReactNode;
    args: {
        allowClear: boolean;
        isLimitInputHeight: boolean;
        options: {
            label: string;
            value: string;
        }[];
    };
};
export declare const TagFormatNumberMode: {
    (argTypes: NSelect.TMultipleProps): ReactNode;
    args: {
        mode: string;
        showSearch: boolean;
        style: {
            width: number;
        };
        onSearchFormat: (value: string) => string;
    };
};
export declare const WithGetPopupContainer: {
    (argTypes: NSelect.TMultipleProps): import("react/jsx-runtime").JSX.Element;
    args: {
        getPopupContainer: () => HTMLElement | null;
        options: {
            label: string;
            value: string;
        }[];
        defaultValue: string[];
        mode: string;
        maxTagTextLength: number;
        allowClear: boolean;
    };
};
