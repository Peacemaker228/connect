import { ReactNode } from 'react';
import { FieldValues, UseControllerProps } from 'react-hook-form';
import { LabelTooltipType } from 'antd/es/form/FormItemLabel';
import { NSelect } from '../../../../ui/form/selects';
/**
 * Неймспейс с типизацией SelectField
 */
export declare namespace NSelectField {
    /**
     * @property {FieldPath<ControlType>} [fieldName] - Имя поля
     * @property {boolean} [isDisabled] - Флаг недоступности
     * @property {boolean} [isHorizontal] - Флаг отображения лейбла и поля в одну строку
     * @property {string} [label] - Лейбл
     * @property {(e): void} onChange - Свойства выпадающего списка
     *
     * @see {@link NSelect.TProps}
     * @see {@link UseControllerProps}
     * */
    type TProps<ControlType extends FieldValues> = Omit<NSelect.TProps, 'defaultValue'> & Omit<UseControllerProps<ControlType>, 'disabled' | 'name'> & {
        fieldName: UseControllerProps<ControlType>['name'];
        isDisabled?: boolean;
        isHorizontal?: boolean;
        label?: ReactNode;
        tooltip?: LabelTooltipType;
        isRequiredRight?: boolean;
        onChange?: (value: string, option: NSelect.TOption) => void;
    };
}
