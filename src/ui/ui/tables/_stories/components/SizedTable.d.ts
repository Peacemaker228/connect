import { ReactNode } from 'react';
import { TableProps } from '../../Table';
import { DataTypeWithTag } from '../models';
export declare const SizedTable: {
    (argTypes: TableProps<DataTypeWithTag>): ReactNode;
    storyName: string;
    args: {
        column: import('../..').ColumnsType<DataTypeWithTag>;
        data: {
            key: string;
            name: string;
            age: number;
            address: string;
        }[];
    };
};
