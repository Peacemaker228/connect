import { ReactNode } from 'react';
import { Meta } from '@storybook/react';
import { TFloatSelectProps } from '../floatSelect/models.js';
import { NSelect } from '../models.js';
import { Select } from '../Select.js';
declare const _default: Meta<typeof Select>;
export default _default;
export declare const DefaultSelect: {
    (argTypes: NSelect.TProps): ReactNode;
    args: {
        options: {
            label: string;
            value: string;
        }[];
        defaultValue: string;
        allowClear: boolean;
    };
};
export declare const DisabledSelect: {
    (argTypes: NSelect.TProps): ReactNode;
    args: {
        isDisabled: boolean;
        options: {
            label: string;
            value: string;
        }[];
        defaultValue: string;
        allowClear: boolean;
    };
};
export declare const SelectWithSearch: {
    (argTypes: NSelect.TProps): ReactNode;
    args: {
        onSearch: import('@vitest/spy').Mock<(...args: any[]) => any>;
        defaultValue: string;
        optionFilterProp: string;
        showSearch: boolean;
        value: string;
        options: {
            label: string;
            value: string;
        }[];
        allowClear: boolean;
    };
};
export declare const SelectSizes: {
    (argTypes: NSelect.TProps): ReactNode;
    args: {
        options: {
            label: string;
            value: string;
        }[];
        defaultValue: string;
        allowClear: boolean;
    };
};
export declare const SegmentSelect: {
    (argTypes: NSelect.TProps): ReactNode;
    args: {
        options: {
            label: string;
            value: string;
            optionsSegmentedValue: {
                name: string;
                code: string;
            };
        }[];
        isSegmented: boolean;
        showSearch: boolean;
        optionsSegmented: {
            label: string;
            value: string;
        }[];
    };
};
export declare const SmallFloatSelect: {
    (argTypes: TFloatSelectProps): ReactNode;
    args: {
        options: {
            label: string;
            value: string;
        }[];
        size: string;
        title: string;
    };
};
export declare const MiddleFloatSelect: {
    (argTypes: TFloatSelectProps): ReactNode;
    args: {
        options: {
            label: string;
            value: string;
        }[];
        title: string;
    };
};
export declare const LargeFloatSelectSM: {
    (argTypes: TFloatSelectProps): ReactNode;
    args: {
        options: {
            label: string;
            value: string;
        }[];
        size: string;
        title: string;
    };
};
export declare const SearchSelect: {
    (argTypes: NSelect.TProps): ReactNode;
    args: {
        isDebounceSearch: boolean;
        showSearch: boolean;
        options: never[];
    };
};
export declare const ScrollSelect: {
    (argTypes: NSelect.TProps): ReactNode;
    args: {
        options: never[];
    };
};
export declare const AddItmSelect: {
    (argTypes: NSelect.TProps): ReactNode;
    args: {
        showSearch: boolean;
        isAddOption: boolean;
        options: {
            label: string;
            value: string;
        }[];
    };
};
export declare const AddNumberItmSelect: {
    (argTypes: NSelect.TProps): ReactNode;
    args: {
        showSearch: boolean;
        isAddOption: boolean;
        options: never[];
    };
};
