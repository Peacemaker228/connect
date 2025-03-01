import { CSSProperties, ReactNode } from 'react';
import { Dayjs } from 'dayjs';
import { TSize, TVariant } from '../../../models/ui';
type TGeneric = string;
type TGenericFn = (value: Dayjs) => string;
export type TFormat = TGeneric | TGenericFn | Array<TGeneric | TGenericFn> | {
    format: string;
    type?: 'mask';
};
export type TPanelMode = 'time' | 'date' | 'week' | 'month' | 'quarter' | 'year' | 'decade';
export type TMode = 'time' | 'date' | 'month' | 'year' | 'decade';
export declare enum EPicker {
    Date = "date",
    Week = "week",
    Month = "month",
    Quarter = "quarter",
    Year = "year"
}
export type TPlacement = 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';
export type TStatus = 'error' | 'warning';
export type TTimePickerProps = {
    className?: string;
    /**
     * Формат времени HH:mm:ss
     */
    format?: string;
    /**
     * Значок очистки
     */
    isAllowClear?: boolean;
    /**
     * Изменение значения при прокрутке столбца
     */
    isChangeOnScroll?: boolean;
    isDisabled?: boolean;
    isNeedConfirm?: boolean;
    onChange?: (date: Dayjs, dateString: string | string[]) => void;
    placeholder?: string;
    placement?: TPlacement;
    shouldUse12Hours?: boolean;
    size?: TSize;
    status?: TStatus;
    value?: Dayjs;
    variant?: TVariant;
    suffixIcon?: ReactNode;
};
/**
 * Общие пропсы для компонентов datetime
 */
export type TCommonProps = {
    /**
     * Определяет, позволяется ли очистка значения выбора.
     */
    allowClear?: boolean | {
        clearIcon?: ReactNode;
    };
    /**
     * Определяет, должен ли компонент получить фокус автоматически при монтировании.
     */
    autoFocus?: boolean;
    className?: string;
    /**
     * Формат отображения даты/времени
     */
    format?: TFormat;
    isDisabled?: boolean;
    /**
     * Функция для определения отключенных дат.
     */
    isDisabledDate?: (currentDate: Dayjs, info: {
        from?: Dayjs;
    }) => boolean;
    isOpen?: boolean;
    isReadonly?: boolean;
    mask?: (string | RegExp)[];
    maxDate?: Dayjs;
    minDate?: Dayjs;
    /**
     * Определяет, требуется ли подтверждение выбора.
     */
    needConfirm?: boolean;
    /**
     * Иконка для перехода к следующему периоду
     */
    nextIcon?: ReactNode;
    onOpenChange?: (open: any) => void;
    onPanelChange?: (value: Dayjs, mode: any) => void;
    /**
     *
     * Функция для рендеринга панели компонента
     */
    panelRender?: (panelNode: any) => ReactNode;
    /**
     * Тип выбора (например, "date", "week", "month", "quarter", "year").
     */
    picker?: EPicker;
    /**
     * Расположение выпадающего окна
     */
    placement?: TPlacement;
    /**
     * Класс CSS для выпадающего окна компонента.
     */
    popupClassName?: string;
    /**
     * Стили CSS для выпадающего окна
     */
    popupStyle?: CSSProperties;
    /**
     * Определяет, следует ли сохранять недопустимое значение при потере фокуса
     */
    preserveInvalidOnBlur?: boolean;
    /**
     * Иконка для перехода к предыдущему периоду
     */
    prevIcon?: ReactNode;
    showTime?: boolean | TTimePickerProps;
    showWeek?: boolean;
    size?: TSize;
    status?: TStatus;
    style?: CSSProperties;
    /**
     * Дополнительная иконка для компонента
     */
    suffixIcon?: ReactNode;
    /**
     * Иконка для перехода к следующему году/месяцу/неделе
     */
    superNextIcon?: ReactNode;
    /**
     * Иконка для перехода к предыдущему году/месяцу/неделе
     */
    superPrevIcon?: ReactNode;
    variant?: TVariant;
    onBlur?: (e: React.FocusEvent<HTMLElement>) => void;
};
export {};
