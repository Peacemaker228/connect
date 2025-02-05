import { FixedType, GetComponentProps, RenderedCell, SortOrder } from './сommon';
import { Key, ReactNode } from 'react';
import { DropdownProps, TooltipProps } from 'antd';
import { ColumnTitle as AntColumnTitle } from 'antd/es/table/interface';
export type AlignType = 'start' | 'end' | 'left' | 'right' | 'center' | 'justify' | 'match-parent';
export type RowScopeType = 'row' | 'rowgroup';
export type SorterTooltipTarget = 'full-header' | 'sorter-icon';
export type AnyObject = Record<PropertyKey, any>;
export type SpecialString<T> = T | (string & {});
export type ColumnsType<RecordType = unknown> = (ColumnGroupType<RecordType> | ColumnType<RecordType>)[];
export interface ColumnGroupType<RecordType> extends Omit<ColumnType<RecordType>, 'dataIndex'> {
    children: ColumnsType<RecordType>;
}
interface CoverableDropdownProps extends Omit<DropdownProps, 'onOpenChange' | 'overlay' | 'visible' | 'onVisibleChange'> {
    onOpenChange?: (open: boolean) => void;
}
export interface ColumnType<RecordType> {
    title?: React.ReactNode;
    sorter?: boolean | CompareFn<RecordType> | {
        compare?: CompareFn<RecordType>;
        /** Config multiple sorter order priority */
        multiple?: number;
    };
    sortOrder?: SortOrder;
    defaultSortOrder?: SortOrder;
    sortDirections?: SortOrder[];
    sortIcon?: (props: {
        sortOrder: SortOrder;
    }) => React.ReactNode;
    showSorterTooltip?: boolean | SorterTooltipProps;
    filtered?: boolean;
    filters?: ColumnFilterItem[];
    filterDropdown?: React.ReactNode | ((props: FilterDropdownProps) => React.ReactNode);
    filterOnClose?: boolean;
    filterMultiple?: boolean;
    filteredValue?: FilterValue | null;
    defaultFilteredValue?: FilterValue | null;
    filterIcon?: React.ReactNode | ((filtered: boolean) => React.ReactNode);
    filterMode?: 'menu' | 'tree';
    filterSearch?: FilterSearchType<ColumnFilterItem>;
    onFilter?: (value: React.Key | boolean, record: RecordType) => boolean;
    filterDropdownOpen?: boolean;
    /**
     * @deprecated Please use `filterDropdownProps.onOpenChange` instead.
     * @since 4.23.0
     */
    onFilterDropdownOpenChange?: (visible: boolean) => void;
    filterDropdownProps?: CoverableDropdownProps;
    filterResetToDefaultFilteredValue?: boolean;
    responsive?: Breakpoint[];
    colSpan?: number;
    dataIndex?: DataIndex<RecordType>;
    render?: (value: any, record: RecordType, index: number) => React.ReactNode | RenderedCell<RecordType>;
    shouldCellUpdate?: (record: RecordType, prevRecord: RecordType) => boolean;
    rowSpan?: number;
    width?: number | string;
    onCell?: GetComponentProps<RecordType>;
    key?: Key;
    className?: string;
    hidden?: boolean;
    fixed?: FixedType;
    onHeaderCell?: GetComponentProps<ColumnsType<RecordType>[number]>;
    ellipsis?: CellEllipsisType;
    align?: AlignType;
    rowScope?: RowScopeType;
}
export type ColumnTitle<RecordType> = AntColumnTitle<RecordType>;
export interface ColumnTitleProps<RecordType> {
    sortColumns?: {
        column: ColumnType<RecordType>;
        order: SortOrder;
    }[];
    filters?: Record<string, FilterValue>;
}
export type CompareFn<T> = (a: T, b: T, sortOrder?: SortOrder) => number;
export type SorterTooltipProps = TooltipProps & {
    target?: SorterTooltipTarget;
};
export interface ColumnFilterItem {
    text: React.ReactNode;
    value: React.Key | boolean;
    children?: ColumnFilterItem[];
}
export interface FilterDropdownProps {
    prefixCls: string;
    setSelectedKeys: (selectedKeys: React.Key[]) => void;
    selectedKeys: React.Key[];
    confirm: (param?: FilterConfirmProps) => void;
    clearFilters?: () => void;
    filters?: ColumnFilterItem[];
    close: () => void;
    visible: boolean;
}
export type FilterValue = (Key | boolean)[];
export type FilterSearchType<RecordType = AnyObject> = boolean | ((input: string, record: RecordType) => boolean);
export type Breakpoint = 'xxl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs';
export type DataIndex<T = any> = DeepNamePath<T> | SpecialString<T> | number | (SpecialString<T> | number)[];
export type DeepNamePath<Store = any, ParentNamePath extends any[] = []> = ParentNamePath['length'] extends 10 ? never : true extends (Store extends BaseNamePath ? true : false) ? ParentNamePath['length'] extends 0 ? Store | BaseNamePath : Store extends any[] ? [...ParentNamePath, number] : never : Store extends any[] ? [...ParentNamePath, number] | DeepNamePath<Store[number], [...ParentNamePath, number]> : keyof Store extends never ? Store : {
    [FieldKey in keyof Store]: Store[FieldKey] extends Function ? never : (ParentNamePath['length'] extends 0 ? FieldKey : never) | [...ParentNamePath, FieldKey] | DeepNamePath<Required<Store>[FieldKey], [...ParentNamePath, FieldKey]>;
}[keyof Store];
type BaseNamePath = string | number | boolean | (string | number | boolean)[];
export type CellEllipsisType = {
    showTitle?: boolean;
} | boolean;
export interface FilterConfirmProps {
    closeDropdown: boolean;
}
export interface IColumnsSettingsCellOption {
    label: ReactNode;
    value: Key;
}
export {};
