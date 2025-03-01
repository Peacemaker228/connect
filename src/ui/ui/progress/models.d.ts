export declare namespace NProgress {
    export type TType = 'line' | 'circle' | 'dashboard';
    export type TStatus = 'normal' | 'exception' | 'active' | 'success';
    export type TSize = 'default' | 'small';
    export type TStrokeLinecap = 'butt' | 'square' | 'round';
    export type TGapPosition = 'top' | 'bottom' | 'left' | 'right';
    export type StringGradients = Record<string, string>;
    type TFromToGradients = {
        from: string;
        to: string;
    };
    export type TGradient = {
        direction?: string;
    } & (StringGradients | TFromToGradients);
    export interface IPercentPositionType {
        align?: 'start' | 'center' | 'end';
        type?: 'inner' | 'outer';
    }
    export interface ISuccessProps {
        percent?: number;
        strokeColor?: string;
    }
    export type TAriaProps = Pick<React.AriaAttributes, 'aria-label' | 'aria-labelledby'>;
    export type TProps = {
        children?: React.ReactNode;
        className?: string;
        /**
         * Тип прогресса
         */
        type?: TType;
        /**
         * Процент выполнения
         */
        percent?: number;
        status?: TStatus;
        /**
         * Отображение прогресса и значка состояниы
         */
        isShowInfo?: boolean;
        /**
         * Ширина прогресса
         */
        strokeWidth?: number;
        /**
         * Стиль строки прогресса
         */
        strokeLinecap?: TStrokeLinecap;
        strokeColor?: string | string[] | TGradient;
        /**
         * Цвет незаполненной части
         */
        trailColor?: string;
        /**
         * Конфигурация прогресса при успешном заполнении
         */
        success?: ISuccessProps;
        gapDegree?: number;
        gapPosition?: TGapPosition;
        percentPosition?: IPercentPositionType;
        /**
         * Размер прогресса
         */
        size?: number | [number | string, number] | TSize | {
            width?: number;
            height?: number;
        };
        /**
         * Конфигурация количества шагов и расстояния между ними
         */
        steps?: number | {
            count: number;
            gap: number;
        };
        /**
         * Префикс для CSS классов
         */
        prefixCls?: string;
        rootClassName?: string;
        style?: React.CSSProperties;
        format?: (percent?: number, successPercent?: number) => React.ReactNode;
    };
    export {};
}
