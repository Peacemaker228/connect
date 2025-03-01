import { ReactNode } from 'react';
import { FieldValues, UseControllerProps } from 'react-hook-form';
import { LabelTooltipType } from 'antd/es/form/FormItemLabel';
import { NInput } from '../../../../ui/form/inputs';
/**
 * Неймспейс с типизацией InputField
 */
export declare namespace NMaskedInputField {
    /**
     * @property {FieldPath<ControlType>} [fieldName] - Имя поля
     * @property {boolean} [isHorizontal] - Флаг отображения лейбла и поля в одну строку
     * @property {string} [label] - Лейбл формы
     * @property {(value: string): void} [onChange] - Внешний хэндлдер изменения значения инпута
     *
     * @see {@link NInput.TMaskedProps}
     * @see {@link UseControllerProps}
     * */
    type TProps<ControlType extends FieldValues> = Omit<NInput.TMaskedProps, 'defaultValue' | 'onChange'> & Omit<UseControllerProps<ControlType>, 'name'> & {
        fieldName: UseControllerProps<ControlType>['name'];
        isHorizontal?: boolean;
        label?: ReactNode;
        tooltip?: LabelTooltipType;
        onChange?: (value: string) => void;
        isRequiredRight?: boolean;
    };
}
