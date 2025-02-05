import { CSSProperties } from 'react';
export declare namespace NDivider {
    type TType = 'horizontal' | 'vertical';
    type TOrientation = 'left' | 'right' | 'center';
    type TProps = {
        children?: React.ReactNode;
        className?: string;
        /**
         * Определяет является ли линия разделителя пунктирной
         */
        isDashed?: boolean;
        /**
         * Классическое отображение разделителя
         */
        isPlain?: boolean;
        /**
         * Положение заголовка внутри разделителя
         */
        orientation?: TOrientation;
        /**
         * Отступ от ближайшей границы
         */
        orientationMargin?: string | number;
        /**
         * Классы стилей родителя
         */
        rootClassName?: string;
        style?: CSSProperties;
        /**
         * Направление делителя
         */
        type?: TType;
    };
}
