import { ReactNode } from 'react';
import { Dayjs } from 'dayjs';
import { TProcedure } from '../../../models';
import { NTextArea } from '../../form/textareas';
import { TCommonProps, TFormat as TFormatC, TMode as TModeC, TPanelMode } from '../_common/models';
/**
 * Неймспейс с типизацией DatePicker
 */
export declare namespace NDatePicker {
    type TOnChange = (date: Dayjs, dateString: string | string[]) => void;
    type TRenderExtraFooter = (mode: TPanelMode) => ReactNode;
    export type TFormat = TFormatC;
    export type TMode = TModeC;
    export type TProps = TCommonProps & {
        /**
         * Инпут даты, расширяется и распологается поверх контейнера
         */
        isTopContent?: boolean;
        /**
         * Колличество строчек, которое можно отобразить, если используется isTopContent
         */
        autoSize?: boolean | NTextArea.TAutoSize;
        /**
         * Значение по умолчанию для выбора даты
         */
        defaultPickerValue?: Dayjs;
        /**
         * Значение по умолчанию
         */
        defaultValue?: Dayjs;
        /**
         * Режим компонента (например, "date", "time", "datetime")
         */
        mode?: TMode;
        multiple?: boolean;
        pickerValue?: Dayjs;
        placeholder?: string;
        /**
         * Функция для отображения дополнительного содержимого подвала
         */
        renderExtraFooter?: TRenderExtraFooter;
        /**
         * Определяет, видна ли кнопка "Сейчас"
         */
        showNow?: boolean;
        /**
         * Определяет, виден ли номер недели.
         */
        showWeek?: boolean;
        value?: Dayjs;
        onChange?: TOnChange;
        /**
         * Функция обратного вызова при нажатии кнопки "ОК"
         */
        onOk?: TProcedure;
    };
    export {};
}
