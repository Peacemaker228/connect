import { CSSProperties, MouseEvent, ReactNode } from 'react';
import { InputRef } from 'antd';
import { TSize, TVariant } from '../../../models';
/**
 *  Неймспейс с типизацией Input
 */
export declare namespace NInput {
    type TStatus = 'error' | 'warning' | '';
    type THTMLProps = React.InputHTMLAttributes<HTMLInputElement>;
    export type TFocusOptions = FocusOptions & {
        cursor?: 'start' | 'end' | 'all';
    };
    export type TCommonProps = React.RefAttributes<InputRef> & {
        /**
         * label метки, отображаемый после (справа) комопнента
         */
        addonAfter?: ReactNode;
        /**
         * label метки, отображаемый перед (слева) компонентом
         */
        addonBefore?: ReactNode;
        /**
         * Очистка поля, можно передать контент значка очистки
         */
        allowClear?: boolean | {
            clearIcon: ReactNode;
        };
        /**
         * Классы стилей
         */
        className?: string;
        /**
         * Состояние активности
         */
        isDisabled?: boolean;
        /**
         * Максимальное количество символов
         */
        maxLength?: number;
        /**
         * Показывать ли количество символов
         */
        showCount?: boolean;
        /**
         * Размер инпута
         */
        size?: TSize;
        /**
         * Статус компонента
         */
        status?: TStatus;
        /**
         * Стили компонента
         */
        style?: CSSProperties;
        /**
         * Значок суффикса для инпута
         */
        suffix?: ReactNode;
        /**
         * Тип инпута
         */
        type?: string;
        /**
         * Значение
         */
        value?: string | number | bigint | readonly string[];
        /**
         * Варант инпута
         */
        variant?: TVariant;
        /**
         * Обратный вызов при нажатии кнопки «Очистить»
         */
        onClear?: () => void;
    };
    export type TProps = Omit<THTMLProps, 'size' | 'value' | 'type'> & TCommonProps & {
        /**
         * Флаг только для чтения
         */
        isReadOnly?: boolean;
        /**
         * Обработчик нажатия
         */
        onClick?: (event: MouseEvent) => void;
    };
    export type TMaskedProps = Omit<TProps, 'onChange'> & {
        /**
         * Маска ввода
         */
        mask: (string | RegExp)[];
        value?: string;
        placeholder?: string;
        onChange?: (e: React.ChangeEvent<HTMLInputElement>, maskedValue: string) => void;
    };
    export {};
}
