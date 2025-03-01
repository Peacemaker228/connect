import { ReactNode } from 'react';
import { FieldValues, UseControllerProps } from 'react-hook-form';
import { LabelTooltipType } from 'antd/es/form/FormItemLabel';
import { NInput } from '../../../../ui/form/inputs';
/**
 * Неймспейс с типизацией InputField
 */
export declare namespace NInputField {
    /**
     * @property {FieldPath<ControlType>} [fieldName] - Имя поля
     * @property {boolean} [isHorizontal] - Флаг отображения лейбла и поля в одну строку
     * @property {boolean} [isNumberInputClearable] - Отчищаемый ли инпут (только для числовых полей)
     * @property {string} [label] - Лейбл формы
     * @property {(value: string): void} [onChange] - Внешний хэндлдер изменения значения инпута
     *
     * @see {@link InputProps}
     * @see {@link UseControllerProps}
     * */
    type TProps<ControlType extends FieldValues> = Omit<NInput.TProps, 'defaultValue' | 'onChange'> & Omit<UseControllerProps<ControlType>, 'name'> & {
        fieldName: UseControllerProps<ControlType>['name'];
        isHorizontal?: boolean;
        isNumberInputClearable?: boolean;
        label?: ReactNode;
        tooltip?: LabelTooltipType;
        onChange?: (value: string) => void;
        isRequiredRight?: boolean;
    };
}
