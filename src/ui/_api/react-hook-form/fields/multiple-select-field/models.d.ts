import { ReactNode } from 'react';
import { FieldValues, UseControllerProps } from 'react-hook-form';
import { LabelTooltipType } from 'antd/es/form/FormItemLabel';
import { NSelect } from '../../../../ui/form/selects';
/**
 * Неймспейс с типизацией MultipleSelectField
 */
export declare namespace NMultipleSelectField {
    /**
     * @property {FieldPath<ControlType>} [fieldName] - Имя поля
     * @property {boolean} [isDisabled] - Флаг недоступности
     * @property {boolean} [isHorizontal] - Флаг отображения лейбла и поля в одну строку
     * @property {string} [label] - Лейбл
     * @property {(e): void} onChange - Свойства выпадающего списка
     *
     * @see {@link NSelect.TMultipleSelectProps}
     * @see {@link UseControllerProps}
     * */
    type TProps<ControlType extends FieldValues> = Omit<NSelect.TMultipleProps, 'defaultValue'> & Omit<UseControllerProps<ControlType>, 'disabled' | 'name'> & {
        fieldName: UseControllerProps<ControlType>['name'];
        isDisabled?: boolean;
        isHorizontal?: boolean;
        label?: ReactNode;
        tooltip?: LabelTooltipType;
        onChange?: (value: string[], options: NSelect.TOption[]) => void;
        isRequiredRight?: boolean;
    };
}
