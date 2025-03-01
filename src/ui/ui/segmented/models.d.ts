import { CSSProperties, ReactNode } from 'react';
import { TSize } from '../../models';
/**
 * Неймспейс с типизпцией Segmented
 */
export declare namespace NSegmented {
    type TItem = {
        label: ReactNode;
        value: string | number;
        icon?: ReactNode;
        disabled?: boolean;
        className?: string;
    };
    type TProps = {
        /**
         * Возможность подогнать ширину под ширину родительского элемента
         */
        block?: boolean;
        /**
         * Изначально выбранное значение
         */
        defaultValue?: string | number;
        /**
         * Состояние активности
         */
        isDisabled?: boolean;
        /**
         * Опции меню
         */
        options: string[] | number[] | TItem[];
        /**
         * Размер компонента
         */
        size?: TSize;
        style?: CSSProperties;
        /**
         * Текущее выбранное значение
         */
        value?: string | number;
        /**
         * Функция нажатия на меню
         */
        onChange?: (value: string | number) => void;
    };
}
