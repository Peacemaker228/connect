import { CSSProperties, ReactNode } from 'react';
import { SpaceProps } from 'antd';
/**
 * @property {ReactNode} children - Компоненты.
 * @property {boolean} [wrap] - Включение переносов.
 * @property {string} [className] - Классы стилей.
 * @property {CSSProperties} [style] - CSS стили.
 * @property {'horizontal' | 'vertical'} [direction] - Направление.
 * @property {SpaceProps['size']} [size] - Размер.
 * @property {'center' | 'start' | 'end' | 'baseline'} [align] - Выравнивание.
 * @property {ReactNode} [split] - Разделитель.
 * */
interface Props extends SpaceProps {
    children: ReactNode;
    wrap?: boolean;
    className?: string;
    style?: CSSProperties;
    direction?: 'horizontal' | 'vertical';
    size?: SpaceProps['size'];
    align?: 'center' | 'start' | 'end' | 'baseline';
    split?: ReactNode;
}
/**
 * Контейнер для установки отступов детям
 * */
export declare function Space(props: Props): import("react/jsx-runtime").JSX.Element;
export declare namespace Space {
    var Compact: import("react").FC<import("antd/es/space/Compact").SpaceCompactProps>;
}
export {};
