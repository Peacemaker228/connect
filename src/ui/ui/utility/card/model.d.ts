import { TabsProps } from 'antd';
import { Tab } from 'rc-tabs/lib/interface';
/**
 * Неймспейс с типизацией Card
 */
export declare namespace NCard {
    type TSize = 'default' | 'small';
    type TTabList = Omit<Tab, 'label'> & {
        key: string;
        label?: React.ReactNode;
    };
    type TClassNames = {
        header?: string;
        body?: string;
        extra?: string;
        title?: string;
        actions?: string;
        cover?: string;
    };
    type TStyles = {
        header?: React.CSSProperties;
        body?: React.CSSProperties;
        extra?: React.CSSProperties;
        title?: React.CSSProperties;
        actions?: React.CSSProperties;
        cover?: React.CSSProperties;
    };
    export type TProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> & {
        /**
         * Список экшенов, отображающихся в нижней части карточки
         */
        actions?: React.ReactNode[];
        /**
         * Ключ текущего активного таба
         */
        activeTabKey?: string;
        /**
         * Граница карточки
         */
        isBordered?: boolean;
        /**
         * Обложка карточки
         */
        cover?: React.ReactNode;
        /**
         * Начальный активный таб, если activeTabKey не установлен
         */
        defaultActiveTabKey?: string;
        /**
         * Дополнительный контент в правом верхнем углу
         */
        extra?: React.ReactNode;
        /**
         * Наведение на карточку
         */
        isHoverable?: boolean;
        /**
         * Загрузка
         */
        isLoading?: boolean;
        /**
         * Размер карточки
         */
        size?: TSize;
        /**
         * Дополнительный контент в правом верхнем углу
         */
        tabBarExtraContent?: React.ReactNode;
        /**
         * Список табов
         */
        tabList?: TTabList[];
        /**
         * Параметры табов
         */
        tabProps?: TabsProps;
        /**
         * Заголовок карточки
         */
        title?: React.ReactNode;
        /**
         * Внутренняя карточка
         */
        isInner?: boolean;
        /**
         * Классы
         */
        classNames?: TClassNames;
        /**
         * Стили
         */
        styles?: TStyles;
        /**
         * Обработчик изменения активного таба
         */
        onTabChange?: (key: string) => void;
        /**
         * Дочерние эл-ты компонента
         */
        children?: React.ReactNode;
        /**
         * Опция отображения карточки со стилями как у isInner
         */
        isInnerStyle?: boolean;
    };
    export {};
}
