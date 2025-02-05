import { ReactNode } from 'react';
import { Control, FieldValues, UseControllerProps } from 'react-hook-form';
import { LabelTooltipType } from 'antd/es/form/FormItemLabel';
import { NTextArea } from '../../../../ui/form/textareas';
/**
 * Неймспейс с типизацией TextAreaField
 */
export declare namespace NTextAreaField {
    /**
     * @property {Control<ControlType, unknown>} [control] - МisRequiredетод для регистрации полей в React Hook Form. Если не передан, берется из контекста
     * @property {FieldPath<ControlType>} [fieldName] - Имя поля
     * @property {boolean} [isHorizontal] - Флаг отображения лейбла и поля в одну строку
     * @property {string} [label] - Лейбл
     * @property {(value: string): void} [onChange] - Внешний хэндлдер изменения значения инпута
     *
     * @see {@link NTextArea.TProps}
     * @see {@link UseControllerProps}
     * */
    type TProps<ControlType extends FieldValues> = Omit<NTextArea.TProps, 'defaultValue' | 'name' | 'onChange'> & Omit<UseControllerProps<ControlType>, 'name'> & {
        control?: Control<ControlType, unknown>;
        fieldName: UseControllerProps<ControlType>['name'];
        isHorizontal?: boolean;
        label: ReactNode;
        onChange?: (value: string) => void;
        tooltip?: LabelTooltipType;
        isRequiredRight?: boolean;
    };
}
