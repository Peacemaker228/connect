import { ColumnsType, ColumnTitle, ColumnType, FilterValue } from './сolumn';
import { CheckboxProps } from 'antd';
import { PaginationProps } from 'antd/lib/pagination';
export type PanelRender<RecordType> = (data: readonly RecordType[]) => React.ReactNode;
export type GetPopupContainer = (triggerNode: HTMLElement) => HTMLElement;
export type GetRowKey<RecordType> = (record: RecordType, index?: number) => Key;
export type GetComponentProps<DataType> = (data: DataType, index?: number) => React.HTMLAttributes<any> & React.TdHTMLAttributes<any>;
export type SortOrder = 'descend' | 'ascend' | null;
export type TableLayout = 'auto' | 'fixed';
declare const TableActions: readonly ['paginate', 'sort', 'filter'];
export type TableAction = (typeof TableActions)[number];
type TablePaginationPosition = 'topLeft' | 'topCenter' | 'topRight' | 'bottomLeft' | 'bottomCenter' | 'bottomRight' | 'none';
export interface TableComponents<RecordType> {
    table?: CustomizeComponent;
    header?: {
        table?: CustomizeComponent;
        wrapper?: CustomizeComponent;
        row?: CustomizeComponent;
        cell?: CustomizeComponent;
    };
    body?: CustomizeScrollBody<RecordType> | {
        wrapper?: CustomizeComponent;
        row?: CustomizeComponent;
        cell?: CustomizeComponent;
    };
}
export type CustomizeComponent = Component<any>;
export type CustomizeScrollBody<RecordType> = (data: readonly RecordType[], info: {
    scrollbarSize: number;
    ref: React.Ref<{
        scrollLeft: number;
        scrollTo?: (scrollConfig: ScrollConfig) => void;
    }>;
    onScroll: OnCustomizeScroll;
}) => React.ReactNode;
export type ScrollConfig = {
    index?: number;
    key?: Key;
    top?: number;
};
export type OnCustomizeScroll = (info: {
    currentTarget?: HTMLElement;
    scrollLeft?: number;
}) => void;
export type Key = React.Key;
type Component<P> = React.ComponentType<P> | React.ForwardRefExoticComponent<P> | React.FC<P> | keyof React.ReactHTML;
export interface ExpandableConfig<RecordType> {
    expandedRowKeys?: readonly Key[];
    defaultExpandedRowKeys?: readonly Key[];
    expandedRowRender?: ExpandedRowRender<RecordType>;
    columnTitle?: React.ReactNode;
    expandRowByClick?: boolean;
    expandIcon?: RenderExpandIcon<RecordType>;
    onExpand?: (expanded: boolean, record: RecordType) => void;
    onExpandedRowsChange?: (expandedKeys: readonly Key[]) => void;
    defaultExpandAllRows?: boolean;
    indentSize?: number;
    showExpandColumn?: boolean;
    expandedRowClassName?: RowClassName<RecordType>;
    childrenColumnName?: string;
    rowExpandable?: (record: RecordType) => boolean;
    columnWidth?: number | string;
    fixed?: FixedType;
}
export type ExpandedRowRender<ValueType> = (record: ValueType, index: number, indent: number, expanded: boolean) => React.ReactNode;
export type RenderExpandIcon<RecordType> = (props: RenderExpandIconProps<RecordType>) => React.ReactNode;
export type RowClassName<RecordType> = (record: RecordType, index: number, indent: number) => string;
export type FixedType = 'left' | 'right' | boolean;
export interface RenderExpandIconProps<RecordType> {
    prefixCls: string;
    expanded: boolean;
    record: RecordType;
    expandable: boolean;
    onExpand: TriggerEventHandler<RecordType>;
}
export type TriggerEventHandler<RecordType> = (record: RecordType, event: React.MouseEvent<HTMLElement>) => void;
export interface TableLocale {
    filterTitle?: string;
    filterConfirm?: React.ReactNode;
    filterReset?: React.ReactNode;
    filterEmptyText?: React.ReactNode;
    filterCheckall?: React.ReactNode;
    filterSearchPlaceholder?: string;
    emptyText?: React.ReactNode | (() => React.ReactNode);
    selectAll?: React.ReactNode;
    selectNone?: React.ReactNode;
    selectInvert?: React.ReactNode;
    selectionAll?: React.ReactNode;
    sortTitle?: string;
    expand?: string;
    collapse?: string;
    triggerDesc?: string;
    triggerAsc?: string;
    cancelSort?: string;
}
export interface TablePaginationConfig extends PaginationProps {
    position?: TablePaginationPosition[];
}
export interface TableRowSelection<T> {
    preserveSelectedRowKeys?: boolean;
    type?: RowSelectionType;
    selectedRowKeys?: Key[];
    defaultSelectedRowKeys?: Key[];
    onChange?: (selectedRowKeys: Key[], selectedRows: T[], info: {
        type: RowSelectMethod;
    }) => void;
    getCheckboxProps?: (record: T) => Partial<Omit<CheckboxProps, 'checked' | 'defaultChecked'>>;
    onSelect?: SelectionSelectFn<T>;
    selections?: InternalSelectionItem[] | boolean;
    hideSelectAll?: boolean;
    fixed?: FixedType;
    columnWidth?: string | number;
    columnTitle?: React.ReactNode | ((checkboxNode: React.ReactNode) => React.ReactNode);
    checkStrictly?: boolean;
    renderCell?: (value: boolean, record: T, index: number, originNode: React.ReactNode) => React.ReactNode | RenderedCell<T>;
    onCell?: GetComponentProps<T>;
}
export type RowSelectionType = 'checkbox' | 'radio';
export type RowSelectMethod = 'all' | 'none' | 'invert' | 'single' | 'multiple';
export type SelectionSelectFn<T> = (record: T, selected: boolean, selectedRows: T[], nativeEvent: Event) => void;
export type InternalSelectionItem = SelectionItem | typeof SELECTION_ALL | typeof SELECTION_INVERT | typeof SELECTION_NONE;
export interface SelectionItem {
    key: string;
    text: React.ReactNode;
    onSelect?: SelectionItemSelectFn;
}
export type SelectionItemSelectFn = (currentRowKeys: Key[]) => void;
export declare const SELECTION_ALL: 'SELECT_ALL';
export declare const SELECTION_INVERT: 'SELECT_INVERT';
export declare const SELECTION_NONE: 'SELECT_NONE';
export interface RenderedCell<RecordType> {
    props?: CellType<RecordType>;
    children?: React.ReactNode;
}
export interface CellType<RecordType> {
    key?: Key;
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
    column?: ColumnsType<RecordType>[number];
    colSpan?: number;
    rowSpan?: number;
    hasSubColumns?: boolean;
    colStart?: number;
    colEnd?: number;
}
interface ColumnTypeSorterResult<RecordType> extends Omit<ColumnType<RecordType>, 'title'> {
    title?: ColumnTitle<RecordType>;
}
export interface SorterResult<RecordType> {
    column?: ColumnTypeSorterResult<RecordType>;
    order?: SortOrder;
    field?: Key | readonly Key[];
    columnKey?: Key;
}
export interface TableCurrentDataSource<RecordType> {
    currentDataSource: RecordType[];
    action: TableAction;
}
export interface TableSticky {
    offsetHeader?: number;
    offsetSummary?: number;
    offsetScroll?: number;
    getContainer?: () => Window | HTMLElement;
}
export type OnTableChange<RecordType = unknown> = (pagination: TablePaginationConfig, filters: Record<string, FilterValue | null>, sorter: SorterResult<RecordType> | SorterResult<RecordType>[], extra: TableCurrentDataSource<RecordType>) => void;
export {};
