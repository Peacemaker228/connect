import { CSSProperties, ReactNode } from 'react';
import { ItemType } from 'antd/lib/menu/interface';
/**
 * Модель пропсов компонента меню
 * @property {string []} [defaultOpenKeys] - Массив с ключами по умолчанию открытых пунктов подменю.
 * @property {string []} [defaultSelectedKeys] - Массив с ключами выбранных по умолчанию пунктов меню.
 * @property {RenderIconType} [expandIcon] - Пользовательская иконка открытого пункта подменю.
 * @property {boolean} [isForceSubMenuRender] - Отобразить подменю в DOM до того, как оно станет видимым.
 * @property {boolean} [isInlineCollapsed] - Указывает свернутое состояние, когда меню находится в строчном режиме.
 * @property {number} [inlineIndent] - Отступ (в пикселях) элементов встроенного меню на каждом уровне.
 * @property {ItemType[]} [items] - Содержание пункта меню.
 * @property {'vertical' | 'horizontal' | 'inline'} [mode] - Тип меню.
 * @property {boolean} [isMultiple] - Позволяет выбрать несколько элементов.
 * @property {string []} [openKeys] - Массив с ключами открытых в данный момент пунктов подменю.
 * @property {ReactNode} [overflowedIndicator] -  Кастомизация значок многоточия, когда меню свернуто горизонтально.
 * @property {boolean} [isSelectable] - Позволяет выбирать пункты меню.
 * @property {string []} [selectedKeys] - Массив с ключами текущих выбранных пунктов меню.
 * @property {CSSProperties} [style] - Стиль корневого узла.
 * @property {number} [subMenuCloseDelay] - Время задержки скрытия подменю при уходе мыши (в секундах).
 * @property {number} [subMenuOpenDelay] - Время задержки отображения подменю при вводе мыши (в секундах).
 * @property {'light' | 'dark'} [theme] - Цветовая тема меню.
 * @property {'hover' | 'click'} [triggerSubMenuAction] - Какое действие может вызвать открытие/закрытие подменю.
 * @property {(info: MenuInfo) => void} [onClick] - Обработчик события клика по пункту меню.
 * @property {SelectEventHandler} [onDeselect] - Вызывается при отмене выбора пункта меню (только в режиме множественного выбора).
 * @property {(openKeys: string[]) => void} [onOpenChange] - Вызывается при открытии или закрытии подменю.
 * @property {SelectEventHandler} [onSelect] - Вызывается при выборе пункта меню.
 */
export declare namespace NMenu {
    /** типы из antd */
    /** onClick */
    type MenuInfo = {
        key: string;
        keyPath: string[];
        item: React.ReactInstance;
        domEvent: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>;
    };
    type MenuClickEventHandler = (info: MenuInfo) => void;
    /** expandIcon */
    type RenderIconInfo = {
        isSelected?: boolean;
        isOpen?: boolean;
        isSubMenu?: boolean;
        disabled?: boolean;
    };
    type RenderIconType = React.ReactNode | ((props: RenderIconInfo) => React.ReactNode);
    /** onSelect */
    interface SelectInfo extends MenuInfo {
        selectedKeys: string[];
    }
    type SelectEventHandler = (info: SelectInfo) => void;
    type TProps = {
        defaultOpenKeys?: string[];
        defaultSelectedKeys?: string[];
        expandIcon?: RenderIconType;
        isForceSubMenuRender?: boolean;
        isInlineCollapsed?: boolean;
        inlineIndent?: number;
        items?: ItemType[];
        mode?: 'vertical' | 'horizontal' | 'inline';
        isMultiple?: boolean;
        openKeys?: string[];
        overflowedIndicator?: ReactNode;
        isSelectable?: boolean;
        selectedKeys?: string[];
        style?: CSSProperties;
        subMenuCloseDelay?: number;
        subMenuOpenDelay?: number;
        theme?: 'light' | 'dark';
        triggerSubMenuAction?: 'hover' | 'click';
        onClick?: (info: MenuInfo) => void;
        onDeselect?: SelectEventHandler;
        onOpenChange?: (openKeys: string[]) => void;
        onSelect?: SelectEventHandler;
    };
    type LevelKeysProps = {
        key?: string;
        children?: LevelKeysProps[];
    };
}
