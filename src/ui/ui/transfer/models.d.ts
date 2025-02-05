import { CSSProperties } from 'react';
/**
 * Неймспейс с типизацией Transfer
 */
export declare namespace NTransfer {
    export interface IRecordType {
        key: string;
        title: string;
        description: string;
    }
    export type TTransferKey = React.Key;
    export type TPaginationType = boolean | {
        pageSize?: number;
        simple?: boolean;
        showSizeChanger?: boolean;
        showLessItems?: boolean;
    };
    type TTransferDirection = 'left' | 'right';
    interface IListStyle {
        direction: TTransferDirection;
    }
    interface IRenderResultObject {
        label: React.ReactElement;
        value: string;
    }
    type TRenderResult = React.ReactElement | IRenderResultObject | string | null;
    type TransferRender<IRecordType> = (item: IRecordType) => TRenderResult;
    interface ITransferLocale {
        titles?: React.ReactNode[];
        notFoundContent?: React.ReactNode | React.ReactNode[];
        searchPlaceholder: string;
        itemUnit: string;
        itemsUnit: string;
        remove?: string;
        selectAll?: string;
        deselectAll?: string;
        selectCurrent?: string;
        selectInvert?: string;
        removeAll?: string;
        removeCurrent?: string;
    }
    type TSelectAllLabel = React.ReactNode | ((info: {
        selectedCount: number;
        totalCount: number;
    }) => React.ReactNode);
    export interface IRenderedItem<IRecordType> {
        renderedText: string;
        renderedEl: React.ReactNode;
        item: IRecordType;
    }
    export const OmitProps: readonly ["handleFilter", "handleClear", "checkedKeys"];
    export type TOmitProp = (typeof OmitProps)[number];
    interface ITransferListProps<IRecordType> extends ITransferLocale {
        prefixCls: string;
        titleText: React.ReactNode;
        dataSource: IRecordType[];
        isFilterOption?: (filterText: string, item: IRecordType, direction: TTransferDirection) => boolean;
        style?: React.CSSProperties;
        checkedKeys: TTransferKey[];
        handleFilter: (e: React.ChangeEvent<HTMLInputElement>) => void;
        onItemSelect: (key: TTransferKey, check: boolean, e?: React.MouseEvent<Element, MouseEvent>) => void;
        onItemSelectAll: (dataSource: TTransferKey[], checkAll: boolean | 'replace') => void;
        onItemRemove?: (keys: TTransferKey[]) => void;
        handleClear: () => void;
        /** Render item */
        render?: (item: IRecordType) => TRenderResult;
        isShowSearch?: boolean;
        searchPlaceholder: string;
        itemUnit: string;
        itemsUnit: string;
        renderList?: TRenderListFunction<IRecordType>;
        footer?: (props: ITransferListProps<IRecordType>, info?: {
            direction: TTransferDirection;
        }) => React.ReactNode;
        onScroll: (e: React.UIEvent<HTMLUListElement, UIEvent>) => void;
        isDisabled?: boolean;
        direction: TTransferDirection;
        isShowSelectAll?: boolean;
        selectAllLabel?: TSelectAllLabel;
        isShowRemove?: boolean;
        pagination?: TPaginationType;
        selectionsIcon?: React.ReactNode;
    }
    type TPartialTransferListProps<IRecordType> = Omit<ITransferListProps<IRecordType>, TOmitProp>;
    export interface ITransferListBodyProps<IRecordType> extends TPartialTransferListProps<IRecordType> {
        filteredItems: IRecordType[];
        filteredRenderItems: IRenderedItem<IRecordType>[];
        selectedKeys: TTransferKey[];
    }
    type TRenderListFunction<T> = (props: ITransferListBodyProps<T>) => React.ReactNode;
    interface ITransferCustomListBodyProps<T> extends ITransferListBodyProps<T> {
    }
    export type TInputStatus = '' | 'warning' | 'error';
    export type TProps = {
        prefixCls?: string;
        className?: string;
        rootClassName?: string;
        /**
         * Указывает, отключен ли компонент
         */
        isDisabled?: boolean;
        /**
         * Используется для настройки исходных данных. Элементы, являющиеся частью этого массива, будут представлены в левом столбце. За исключением элементов, ключи которых включены в свойство targetKeys
         */
        dataSource?: IRecordType[];
        /**
         * Набор ключей элементов, которые указаны в правом столбце
         */
        targetKeys?: TTransferKey[];
        /**
         * Набор ключей элементов, которые указаны в правом столбце
         */
        selectedKeys?: TTransferKey[];
        render?: TransferRender<IRecordType>;
        onChange?: (targetKeys: TTransferKey[], direction: TTransferDirection, moveKeys: TTransferKey[]) => void;
        onSelectChange?: (sourceSelectedKeys: TTransferKey[], targetSelectedKeys: TTransferKey[]) => void;
        /**
         * Стили
         */
        style?: React.CSSProperties;
        /**
         * Пользовательский стиль CSS, используемый для отображения столбцов передачи
         */
        listStyle?: ((style: IListStyle) => CSSProperties) | CSSProperties;
        /**
         * Стили операций
         */
        operationStyle?: CSSProperties;
        /**
         * Набор заголовков, отсортированных слева направо.
         */
        titles?: React.ReactNode[];
        /**
         * Набор операций, отсортированных сверху вниз.
         */
        operations?: string[];
        /**
         * Отображение поле поиска в каждом столбце.
         */
        isShowSearch?: boolean;
        /**
         * Метод для определения, должен ли элемент отображаться в списке результатов поиска, работает только при поиске
         */
        isFilterOption?: (inputValue: string, item: IRecordType, direction: TTransferDirection) => boolean;
        locale?: Partial<ITransferLocale>;
        /**
         * Метод для рендеринга нижнего колонтитула
         */
        footer?: (props: ITransferListProps<IRecordType>, info?: {
            direction: TTransferDirection;
        }) => React.ReactNode;
        rowKey?: (record: IRecordType) => TTransferKey;
        onSearch?: (direction: TTransferDirection, value: string) => void;
        onScroll?: (direction: TTransferDirection, e: React.SyntheticEvent<HTMLUListElement>) => void;
        children?: (props: ITransferCustomListBodyProps<IRecordType>) => React.ReactNode;
        /**
         * Показать флажок «Выбрать все» в заголовке
         */
        isShowSelectAll?: boolean;
        selectAllLabels?: TSelectAllLabel[];
        /**
         * Отображание как однонаправленный компонент
         */
        isOneWay?: boolean;
        /**
         * Используйте нумерацию страниц. Не работает в рендеринге реквизита
         */
        pagination?: TPaginationType;
        /**
         * Установить статус проверки
         */
        status?: TInputStatus;
        /**
         * Пользовательский значок раскрывающегося списка
         */
        selectionsIcon?: React.ReactNode;
    };
    export {};
}
