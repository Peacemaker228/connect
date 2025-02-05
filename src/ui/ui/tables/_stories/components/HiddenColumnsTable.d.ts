import { ReactNode } from 'react';
import { TableProps } from '../../Table';
import { THiddenDataType } from '../models';
export declare const HiddenColumnsTable: {
    (argTypes: TableProps<THiddenDataType>): ReactNode;
    storyName: string;
    args: {
        data: {
            key: string;
            name: string;
            age: number;
            address: string;
        }[];
    };
};
