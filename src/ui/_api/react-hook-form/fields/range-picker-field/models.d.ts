import { ReactNode } from 'react';
import { FieldValues, UseControllerProps } from 'react-hook-form';
import { LabelTooltipType } from 'antd/es/form/FormItemLabel';
import { NRangePicker } from '../../../../ui/datetime';
/**
 * Неймспейс с типизацией RangePickerField
 */
export declare namespace NRangePickerField {
    type TProps<ControlType extends FieldValues> = Omit<NRangePicker.TProps, 'defaultValue' | 'onChange'> & Omit<UseControllerProps<ControlType>, 'name'> & {
        fieldName: UseControllerProps<ControlType>['name'];
        isHorizontal?: boolean;
        label?: ReactNode;
        onChange?: (value: string | string[]) => void;
        placeholder?: [start: string, end: string];
        id?: {
            start?: string;
            end?: string;
        };
        tooltip?: LabelTooltipType;
        isRequiredRight?: boolean;
    };
}
