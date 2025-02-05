import { ReactNode } from 'react';
import { Meta } from '@storybook/react';
import { NTimePicker, TimePicker } from '../../time-picker/index';
declare const _default: Meta<typeof TimePicker>;
export default _default;
export declare const DefaultTimePicker: {
    (argTypes: NTimePicker.TProps): ReactNode;
    args: {
        isAllowClear: boolean;
    };
};
export declare const DisabledTimePicker: {
    (argTypes: NTimePicker.TProps): ReactNode;
    args: {
        isAllowClear: boolean;
        isDisabled: boolean;
    };
};
export declare const TimePickerSizes: {
    (argTypes: NTimePicker.TProps): ReactNode;
    args: {
        isAllowClear: boolean;
    };
};
export declare const TwelveHoursTimePicker: {
    (argTypes: NTimePicker.TProps): ReactNode;
    args: {
        isAllowClear: boolean;
        shouldUse12Hours: boolean;
    };
};
export declare const TimePickerStatuses: {
    (argTypes: NTimePicker.TProps): ReactNode;
    args: {
        isAllowClear: boolean;
    };
};
export declare const ChangeOnScroll: {
    (argTypes: NTimePicker.TProps): ReactNode;
    args: {
        isAllowClear: boolean;
        isChangeOnScroll: boolean;
        needConfirm: boolean;
    };
};
export declare const VariantsOfTimePicker: {
    (argTypes: NTimePicker.TProps): ReactNode;
    args: {
        isAllowClear: boolean;
    };
};
