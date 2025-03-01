import { ReactNode } from 'react';
import { TSize } from '../../../../models';
import { TAbstractCheckbox, TAbstractCheckboxGroup, TCheckboxOption } from '../_common/models';
import type * as React from 'react';
/**
 * Неймспейс с типизацией Radio
 */
export declare namespace NRadio {
    type TDisabled = boolean | undefined;
    type TRadioGroupOption = 'default' | 'button';
    type TRadioGroupButtonStyle = 'outline' | 'solid';
    export type TProps = Omit<TAbstractCheckbox<TRadioChangeEvent>, 'checked' | 'disabled' | 'autoFocus' | 'required' | 'defaultChecked'> & {
        /**
         * Значение для сравнения, используемое для определения выбранного значения
         */
        value?: unknown;
        /**
         * Дочерние элементы
         */
        children?: ReactNode;
        /**
         * Состояние активности флажка
         */
        isChecked?: boolean;
        /**
         * Состояние активности компонента
         */
        isDisabled?: boolean;
        /**
         * Изначально активный флажок
         */
        shouldDefaultChecked?: boolean;
        /**
         * Обязательное поле
         */
        isRequired?: boolean;
    };
    export type TRadioGroupProps = Omit<TAbstractCheckboxGroup, 'disabled'> & {
        defaultValue?: unknown;
        isDisabled?: TDisabled;
        /**
         * Имя группы
         */
        name?: string;
        /**
         * Опции группы
         */
        options?: string[] | number[] | Array<TCheckboxOption>;
        size?: TSize;
        value?: unknown;
        onChange?: (event: TRadioChangeEvent) => void;
        onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
        onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
        children?: React.ReactNode;
        id?: string;
        /**
         * Тип группы
         */
        optionType?: TRadioGroupOption;
        /**
         * Стиль кнопки
         */
        buttonStyle?: TRadioGroupButtonStyle;
        onFocus?: React.FocusEventHandler<HTMLDivElement>;
        onBlur?: React.FocusEventHandler<HTMLDivElement>;
    };
    export type TRadioButtonProps = TProps;
    export type TRadioChangeEventTarget = TProps & {
        checked: boolean;
    };
    export type TRadioChangeEvent = {
        target: TRadioChangeEventTarget;
        stopPropagation: () => void;
        preventDefault: () => void;
        nativeEvent: MouseEvent;
    };
    export {};
}
