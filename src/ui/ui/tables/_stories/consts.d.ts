import { ColumnsType } from '../models';
import { DataType, DataTypeWithDescription, DataTypeWithTag, GroupedDataType, MultipleSorterDataType, SpanDataType } from './models';
export declare const DEFAULT_COLUMNS: ColumnsType<DataTypeWithTag>;
export declare const DEFAULT_DATA_WITH_TAGS: DataTypeWithTag[];
export declare const SELECTIONS_OPERATION_COLUMNS: ColumnsType<DataType>;
export declare const FILTER_SORTER_COLUMNSS: ColumnsType<DataType>;
export declare const DEFAULT_DATA: {
    key: string;
    name: string;
    age: number;
    address: string;
}[];
export declare const FILTER_IN_TREE_COLUMNS: ColumnsType<DataType>;
export declare const FILTER_SEARCH_COLUMNS: ColumnsType<DataType>;
export declare const MULTIPLE_SORTER_COLUMNS: ColumnsType<MultipleSorterDataType>;
export declare const MULTIPLE_SORTER_DATA: MultipleSorterDataType[];
export declare const EXPANDABLE_COLUMNS: ColumnsType<DataTypeWithDescription>;
export declare const EXPANDABLE_DATA: DataTypeWithDescription[];
export declare const SPAN_COLUMNS: ColumnsType<SpanDataType>;
export declare const SPAN_DATA: SpanDataType[];
export declare const FIXED_HEADER_COLUMNS: ColumnsType<DataType>;
export declare const FIXED_COLUMNS: ColumnsType<DataType>;
export declare const TREE_COLUMNS: ({
    title: string;
    dataIndex: string;
    key: string;
    width?: undefined;
} | {
    title: string;
    dataIndex: string;
    key: string;
    width: string;
})[];
export declare const TREE_DATA: SpanDataType[];
export declare const HIDDEN_COLUMNS: {
    title: string;
    dataIndex: string;
    key: string;
}[];
export declare const GROUPED_COLUMNS: ColumnsType<GroupedDataType>;
export declare const ELLIPSES_COLUMNS: ColumnsType<DataType>;
export declare const ELLIPSES_WITH_TOOLTIPS_COLUMNS: ColumnsType<DataType>;
export declare const RESPONSIVE_COLUMNS: ColumnsType<DataType>;
export declare const SELECTION_COLUMNS: ColumnsType<DataType>;
export declare const SELECTION_DATA: DataType[];
export declare const DEFAULT_BIG_DATA: {
    key: number;
    name: string;
    age: number;
    address: string;
}[];
