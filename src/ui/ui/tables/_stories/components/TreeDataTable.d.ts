import { ReactNode } from 'react';
import { TableProps } from '../../Table';
import { TREE_COLUMNS } from '../consts';
export declare const TreeDataTable: {
    (argTypes: TableProps<typeof TREE_COLUMNS>): ReactNode;
    storyName: string;
    args: {
        columns: ({
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
        data: import('../models').SpanDataType[];
        isBordered: boolean;
    };
};
