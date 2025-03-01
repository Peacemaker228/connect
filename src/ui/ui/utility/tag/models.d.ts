import { MouseEvent } from 'react';
import { ExtendedThemeConfig } from '../../../providers';
export declare namespace NTag {
    export type TTagPresetColor = 'blue' | 'purple' | 'cyan' | 'green' | 'magenta' | 'red' | 'orange' | 'volcano' | 'geekblue' | 'lime' | 'gold';
    type AddInverse<T extends string> = `${T}-inverse`;
    export type PresetColorInverseType = AddInverse<TTagPresetColor>;
    export type PresetColorType = TTagPresetColor | PresetColorInverseType;
    export type IsClosable = boolean | ({
        closeIcon?: React.ReactNode;
    } & React.AriaAttributes);
    export type TTagStatus = 'success' | 'processing' | 'error' | 'default' | 'warning';
    type TTagTokens = keyof Exclude<Exclude<ExtendedThemeConfig['components'], undefined>['Tag'], undefined>;
    export type TagStatusColors<T extends TTagPresetColor | TTagStatus> = {
        [status in T]: {
            border: TTagTokens;
            bg: TTagTokens;
            color: TTagTokens;
        };
    };
    export type TProps = React.HTMLAttributes<HTMLSpanElement> & {
        /**
         * Идентификатор фильтра
         */
        filterId?: string;
        /**
         * Префикс для CSS-классов.
         */
        prefixCls?: string;
        /**
         * Классы стилей.
         */
        className?: string;
        /**
         * Классы стилей родителя.
         */
        rootClassName?: string;
        /**
         * Цвет тега.
         */
        color?: TTagPresetColor;
        /**
         * Состояние отображения иконки для закрытия.
         */
        isClosable?: boolean | ({
            closeIcon?: React.ReactNode;
        } & React.AriaAttributes);
        /**
         * Пользовательский значок закрытия.
         */
        closeIcon?: React.ReactNode;
        /**
         * Функция, отвечающая за закрытие тега.
         */
        onClose?: (event: MouseEvent) => void;
        /**
         * Функция клика по лейблу фильтра
         */
        onLabelClick?: (id?: string) => void;
        /**
         * Классы стилей.
         */
        style?: React.CSSProperties;
        /**
         * Отображаемая иконка.
         */
        icon?: React.ReactNode;
        /**
         * Состояние стилей границы.
         */
        isBordered?: boolean;
        /**
         * Дочерние эл-ты компонента.
         */
        children?: React.ReactNode;
        /**
         * Статус тега
         */
        status?: TTagStatus;
        /**
         * Состояние атрибута dashed
         */
        isDashed?: boolean;
    } & ({
        /**
         * @property {boolean} [isCheckable] - Флаг для возможности переключения состояния isChecked.
         */
        isCheckable?: false;
        /**
         * @property {boolean} [isChecked] - Состояние isChecked. Доступно, если isCheckable === true.
         */
        isChecked?: undefined;
        /**
         * @property {Function} [onCheck] - Функция, отвечающая за переключение состояния isChecked. Доступно, если isCheckable === true.
         */
        onCheck?: undefined;
    } | {
        /**
         * @property {boolean} [isCheckable] - Флаг для возможности переключения состояния isChecked.
         */
        isCheckable: true;
        /**
         * @property {boolean} [isChecked] - Состояние isChecked. Доступно, если isCheckable === true.
         */
        isChecked: boolean;
        /**
         * @property {Function} [onCheck] - Функция, отвечающая за переключение состояния isChecked. Доступно, если isCheckable === true.
         */
        onCheck: () => void;
    });
    export {};
}
