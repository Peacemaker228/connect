import { OnTableChange } from '../models';
import { DataType, MultipleSorterDataType, SpanDataType } from './models';
export declare const sharedOnCell: (_: SpanDataType, index?: number) => {
    colSpan: number;
} | {
    colSpan?: undefined;
};
export declare const getDataForGroupedTable: () => {
    key: number;
    name: string;
    age: number;
    street: string;
    building: string;
    number: number;
    companyAddress: string;
    companyName: string;
    gender: string;
}[];
export declare const getDefaultData: (count: number) => {
    key: number;
    name: string;
    age: number;
    address: string;
}[];
export declare const onTableChange: OnTableChange<DataType>;
export declare const onTableChangeMultiple: OnTableChange<MultipleSorterDataType>;
