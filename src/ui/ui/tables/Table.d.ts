import { Key } from 'react';
import { SpinProps } from 'antd';
import { TSize } from '../../models';
import { AnyObject, ColumnsType, ColumnType, ExpandableConfig, GetComponentProps, GetPopupContainer, GetRowKey, OnTableChange, PanelRender, RowClassName, SorterTooltipProps, SortOrder, TableComponents, TableLayout, TableLocale, TablePaginationConfig, TableRowSelection, TableSticky } from './models';
export interface TableProps<RecordType extends AnyObject> {
    isBordered?: boolean;
    className?: string;
    columns?: ColumnsType<RecordType>;
    components?: TableComponents<RecordType>;
    data?: RecordType[];
    defaultVisibleColumnsList?: Key[];
    expandable?: ExpandableConfig<RecordType>;
    footer?: PanelRender<RecordType>;
    getPopupContainer?: GetPopupContainer;
    isLoading?: boolean | SpinProps;
    locale?: TableLocale;
    pagination?: false | TablePaginationConfig;
    rowClassName?: string | RowClassName<RecordType>;
    rowKey?: string | keyof RecordType | GetRowKey<RecordType>;
    rowSelection?: TableRowSelection<RecordType>;
    rowHoverable?: boolean;
    scroll?: {
        scrollToFirstRowOnChange?: boolean;
        x?: number | true | string;
        y?: number | string;
    };
    shouldShowHeader?: boolean;
    showSorterTooltip?: boolean | SorterTooltipProps;
    size?: TSize;
    sortDirections?: SortOrder[];
    isSticky?: boolean | TableSticky;
    summary?: (data: readonly RecordType[]) => React.ReactNode;
    tableLayout?: TableLayout;
    title?: PanelRender<RecordType>;
    isVirtual?: boolean;
    onChange?: OnTableChange<RecordType>;
    onHeaderRow?: GetComponentProps<readonly ColumnType<RecordType>[]>;
    onRow?: GetComponentProps<RecordType>;
    onScroll?: React.UIEventHandler<HTMLDivElement>;
    style?: React.CSSProperties;
    /**Показывать кнопку настройки колонок таблицы */
    isNeedToShowSettingsCell?: boolean;
    /**Рендер экшн кнопок таблицы */
    renderAction?: (record: RecordType) => React.ReactNode;
    /**Настройки экшн колонки */
    columnActionSettings?: ColumnType<RecordType>;
    /**Иконка настройки колонки таблицы */
    iconSettings?: React.ReactNode;
    /**Иконка выбранной колонки в настройках */
    iconSettingsCheck?: React.ReactNode;
    withHeaderTransparent?: boolean;
}
export declare function Table<RecordType extends AnyObject>(props: TableProps<RecordType>): import("react/jsx-runtime").JSX.Element;
export declare namespace Table {
    var Summary: typeof import("rc-table/lib/Footer/Summary").default;
}
