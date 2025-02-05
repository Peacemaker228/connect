import { ReactNode } from 'react';
import { TableProps } from '../../Table';
import { DataTypeWithDescription } from '../models';
export declare const ExpandableTable: {
    (argTypes: TableProps<DataTypeWithDescription>): ReactNode;
    storyName: string;
    args: {
        columns: import('../..').ColumnsType<DataTypeWithDescription>;
        data: DataTypeWithDescription[];
    };
};
