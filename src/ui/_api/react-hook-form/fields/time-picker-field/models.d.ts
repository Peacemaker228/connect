import { ReactNode } from 'react';
import { FieldValues, UseControllerProps } from 'react-hook-form';
import { LabelTooltipType } from 'antd/es/form/FormItemLabel';
import { NTimePicker } from '../../../../ui/datetime';
/**
 * Неймспейс с типизацией TimePickerField
 */
export declare namespace NTimePickerField {
    type TProps<ControlType extends FieldValues> = Omit<NTimePicker.TProps, 'defaultValue' | 'onChange'> & Omit<UseControllerProps<ControlType>, 'name'> & {
        fieldName: UseControllerProps<ControlType>['name'];
        isHorizontal?: boolean;
        label?: ReactNode;
        onChange?: (value: string | string[]) => void;
        tooltip?: LabelTooltipType;
        isRequiredRight?: boolean;
    };
}
