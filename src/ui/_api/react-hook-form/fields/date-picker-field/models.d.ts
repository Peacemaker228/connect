import { ReactNode } from 'react';
import { FieldValues, UseControllerProps } from 'react-hook-form';
import { LabelTooltipType } from 'antd/es/form/FormItemLabel';
import { Dayjs } from 'dayjs';
import { NDatePicker } from '../../../../ui/datetime';
/**
 * Неймспейс с типизацией DatePickerField
 */
export declare namespace NDatePickerField {
    type TProps<ControlType extends FieldValues> = Omit<NDatePicker.TProps, 'defaultValue' | 'onChange'> & Omit<UseControllerProps<ControlType>, 'name'> & {
        fieldName: UseControllerProps<ControlType>['name'];
        isHorizontal?: boolean;
        isReadOnly?: boolean;
        label?: ReactNode;
        tooltip?: LabelTooltipType;
        onChange?: (dateString: string | string[], date?: Dayjs) => void;
        isRequiredRight?: boolean;
    };
}
