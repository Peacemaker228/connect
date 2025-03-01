import { ReactNode } from 'react';
import { Dayjs } from 'dayjs';
import { TCommonProps, TFormat as TFormatC, TPanelMode as TPanelModeC } from '../_common/models';
export declare namespace NRangePicker {
    type TRangeValueType<T> = [start: T, end: T];
    type TNoUndefinedRangeValueType<T> = [start: T | null, end: T | null] | null;
    type TPreset = {
        label: ReactNode;
        value: TRangeValueType<Dayjs> | (() => TRangeValueType<Dayjs>);
    };
    export type TPanelMode = TPanelModeC;
    export type TFormat = TFormatC;
    export type TProps = TCommonProps & {
        allowEmpty?: [start: boolean, end: boolean];
        defaultPickerValue?: Dayjs;
        defaultValue?: TRangeValueType<Dayjs>;
        /**
         * Идентификаторы компонентов начала и конца диапазона
         */
        id?: {
            start?: string;
            end?: string;
        };
        mode?: [start: TPanelMode, end: TPanelMode];
        onBlur?: (event: any, range: {
            range?: 'start' | 'end';
        }) => void;
        /**
         * FIXME: ???
         */
        onCalendarChange?: (dates: TNoUndefinedRangeValueType<Dayjs>, dateStrings: [string, string], info: {
            range?: 'start' | 'end';
        }) => void;
        /**
         * Функция обратного вызова при изменении выбранных дат
         */
        onChange?: (dates: TNoUndefinedRangeValueType<Dayjs>, dateStrings: [string, string]) => void;
        onFocus?: (event: any, range: {
            range?: 'start' | 'end';
        }) => void;
        onPanelChange?: (value: TNoUndefinedRangeValueType<Dayjs>, mode: any) => void;
        pickerValue?: Dayjs;
        placeholder?: [start: string, end: string];
        /**
         * Предустановленные значения диапазона дат
         */
        presets?: TPreset[];
        /**
         * Функция для отображения дополнительного содержимого подвала
         */
        renderExtraFooter?: () => ReactNode;
        separator?: ReactNode;
        value?: TNoUndefinedRangeValueType<Dayjs>;
    };
    export {};
}
