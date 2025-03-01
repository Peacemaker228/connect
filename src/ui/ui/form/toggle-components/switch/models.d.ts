import { MouseEvent, ReactNode } from 'react';
/**
 * Неймспейс с типизацией Switch
 */
export declare namespace NSwitch {
    type TSize = 'small' | 'default';
    type TChangeEventHandler = (checked: boolean, event: MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>) => void;
    type TClickEventHandler = TChangeEventHandler;
    export type TProps = {
        /**
         * Состояние активности флага
         */
        isChecked?: boolean;
        /**
         * Автофокус при маунте компонента
         */
        autoFocus?: boolean;
        /**
         * Значение по умолчанию
         */
        defaultValue?: boolean;
        /**
         * Значение свитча
         */
        value?: boolean;
        /**
         * Контент, отображаемый при чекнутом состоянии
         */
        checkedChildren?: ReactNode;
        /**
         * Стили компонента
         */
        className?: string;
        /**
         * Состояние активности компонента
         */
        isDisabled?: boolean;
        /**
         * Состояние загрузки
         */
        isLoading?: boolean;
        /**
         * Контент, отображаемый при анчекнутом состоянии
         */
        unCheckedChildren?: ReactNode;
        /**
         * Размер компонента
         */
        size?: TSize;
        /**
         * Заголовок компонента
         */
        title?: string;
        /**
         * Обработчик изменения
         */
        onChange: TChangeEventHandler;
        /**
         * Обработчик нажатия
         */
        onClick: TClickEventHandler;
    };
    export {};
}
