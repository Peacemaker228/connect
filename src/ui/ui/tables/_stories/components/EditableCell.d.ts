import { TableProps } from '../../..';
interface DataType {
    key: string;
    name: string;
    age: number;
    address: string;
}
export declare const EditableCellTable: {
    (argTypes: TableProps<DataType>): import("react/jsx-runtime").JSX.Element;
    storyName: string;
    args: {
        data: DataType[];
        isNeedToShowSettingsCell: boolean;
    };
};
export {};
