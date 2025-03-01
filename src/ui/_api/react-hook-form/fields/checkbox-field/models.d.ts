import { ReactNode } from 'react';
import { FieldValues, UseControllerProps } from 'react-hook-form';
import { LabelTooltipType } from 'antd/es/form/FormItemLabel';
import { NCheckbox } from '../../../../ui/form/toggle-components/checkboxes/models';
/**
 * Неймспейс с типизацией CheckboxField
 */
export declare namespace NCheckboxField {
    /**
     * @property {FieldPath<ControlType>} [fieldName] - Имя поля.
     * @property {string} [label] - Лейбл.
     * @property {(e: boolean): void} onChange - Обработчик изменения значения поля.
     *
     * @see {@link NCheckbox.TProps}
     * @see {@link UseControllerProps}
     * */
    type TProps<ControlType extends FieldValues> = Omit<NCheckbox.TProps, 'name' | 'onChange'> & Omit<UseControllerProps<ControlType>, 'disabled' | 'name'> & {
        fieldName: UseControllerProps<ControlType>['name'];
        label?: ReactNode;
        tooltip?: LabelTooltipType;
        onChange?: (value: boolean) => void;
        isRequiredRight?: boolean;
    };
}
