import { TableProps } from '../Table';
export type OnChange = NonNullable<TableProps<DataType>['onChange']>;
export type Filters = Parameters<OnChange>[1];
export type GetSingle<T> = T extends (infer U)[] ? U : never;
export type Sorts = GetSingle<Parameters<OnChange>[2]>;
export type DataTypeIndex = keyof DataType;
export interface DataType {
    key: React.Key;
    name: string;
    age: number;
    address: string;
}
export interface DataTypeWithTag extends DataType {
    tags: string[];
}
export interface DataTypeWithDescription extends DataType {
    description: string;
}
export interface SpanDataType extends DataType {
    tel: string;
    phone: number;
}
export interface GroupedDataType {
    key: React.Key;
    name: string;
    age: number;
    street: string;
    building: string;
    number: number;
    companyAddress: string;
    companyName: string;
    gender: string;
}
export type THiddenDataType = {
    title: string;
    dataIndex: string;
    key: string;
};
export interface MultipleSorterDataType {
    key: React.Key;
    name: string;
    chinese: number;
    math: number;
    english: number;
}
export interface NestedColumnsDataType {
    key: React.Key;
    name: string;
    platform: string;
    version: string;
    upgradeNum: number;
    creator: string;
    createdAt: string;
}
export interface ExpandedNestedTableDataType {
    key: React.Key;
    date: string;
    name: string;
    upgradeNum: string;
}
