import { Key } from 'react';
import { IColumnsSettingsCellOption } from '../..';
interface IColumnsSettingsCellProps<T extends IColumnsSettingsCellOption> {
    columns: T[];
    checkedColumns: Key[];
    setCheckedColumns: (value: Key[]) => void;
    iconSettings?: React.ReactNode;
    iconSettingsCheck?: React.ReactNode;
}
export declare const ColumnsSettingsCell: <T extends IColumnsSettingsCellOption>(props: IColumnsSettingsCellProps<T>) => import("react/jsx-runtime").JSX.Element;
export {};
