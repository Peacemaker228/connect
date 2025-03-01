import { CSSProperties, ReactNode } from 'react';
import { RowProps } from 'antd';
/**
 * @property {ReactNode} children - Колонки
 * @property {boolean} [wrap] - Включение переносов
 * @property {RowProps['gutter']} [gutter] - Расстояние между сетками
 * @property {string} [className] - Классы стилей
 * @property {CSSProperties} [style] - Css стили
 * @property {RowProps['justify']} [justify] - Выравнивание внутренних блоков по горизонтали
 * @property {RowProps['align']} [align] - Выравнивание внутренних блоков по вертикали
 * */
interface Props {
    children: ReactNode;
    wrap?: boolean;
    gutter?: RowProps['gutter'];
    className?: string;
    style?: CSSProperties;
    justify?: RowProps['justify'];
    align?: RowProps['align'];
}
/**
 * Контейнер для колонок
 * */
export declare function Row(props: Props): import("react/jsx-runtime").JSX.Element;
export {};
