import { default as React, CSSProperties } from 'react';
import { BaseOptionType, DefaultOptionType } from 'antd/es/select';
import { TSize, TVariant } from '../../../models/ui';
import { NSegmented } from '../../segmented/models';
/**
 * Неймспейс с типизацией Select
 */
export declare namespace NSelect {
    type TMultipleMode = 'multiple' | 'tags';
    export type TOption = Omit<BaseOptionType, 'disabled'> & {
        className?: string;
        isDisabled?: boolean;
        label: React.ReactNode;
        title?: string;
        value: string | number;
        /**
         * Кастомизация опций
         */
        customRenderOption?: (option: TOption) => React.ReactNode;
        /**
         * Объект с параметрами, заданными в optionsSegmented в значении value
         */
        optionsSegmentedValue?: {
            [K in NSegmented.TItem['value']]: string;
        };
    };
    type TDisplayValue = {
        key?: React.Key;
        value?: string | number;
        label?: React.ReactNode;
        title?: React.ReactNode;
        disabled?: boolean;
    };
    export type TOptionProps = TOption & {
        segmentedValue?: string | number;
        optionLabelProp?: string;
    };
    export type TOptionsPage = {
        pageNumber: number;
        numberOfPages: number;
    };
    export type TProps = {
        mode?: undefined;
        value?: string;
        defaultValue?: string | number;
        onSelect?: (value: string | number | any, option: React.ReactElement) => void;
        isDisabled?: boolean;
        onChange?: (value: string, option: TOption) => void;
    } & TCommonProps;
    export type TMultipleProps = {
        mode?: TMultipleMode;
        value?: string[];
        defaultValue?: string[];
        onSelect?: (value: string | number | any, option: React.ReactElement) => void;
        maxTagCount?: number | 'responsive';
        maxTagTextLength?: number;
        isDisabled?: boolean;
        isLimitInputHeight?: boolean;
        /**
         * Позволяет наложить селект поверх родительского комопнента
         */
        isTopContent?: boolean;
        onChange?: (value: string[], options: TOption[]) => void;
    } & Omit<TCommonProps, 'disabled'>;
    export type TCommonProps<ValueType = any, OptionTypeProps extends BaseOptionType = DefaultOptionType> = {
        /**
         * Очистка значений. Можно закастомизировать иконку
         */
        allowClear?: boolean | {
            clearIcon?: React.ReactNode;
        };
        /**
         * Автоматически фокусируется на компоненте при загрузке
         */
        autoFocus?: boolean;
        /**
         * Отображает границу компонента
         */
        bordered?: boolean;
        /**
         * Дочерние элементы
         */
        children?: React.ReactNode;
        /**
         * Классы стилей
         */
        className?: string;
        /**
         * Должны ли дропдаун и селект иметь одинаковую ширину
         */
        isPopupMatchSelectWidth?: boolean | number;
        /**
         * Класс стилей для дропдауна
         */
        dropdownClassName?: string;
        /**
         * Соответствие ширины выпадающего меню ширине выбора
         */
        dropdownMatchSelectWidth?: boolean | number;
        /**
         * Функция для фильтрации опций или включение/выключение фильтрации
         */
        filterOption?: boolean | ((inputValue: string, option?: OptionTypeProps) => boolean);
        /**
         * Поиск по вводу с задержкой
         */
        isDebounceSearch?: boolean;
        /**
         * Отключает компонент
         */
        isDisabled?: boolean;
        /**
         * Подогнать ширину под ширину родительского элемента. По умолчанию true
         */
        isFullContent?: boolean;
        /**
         * Ограничивыет высоту выбранных элементов
         */
        isLimitInputHeight?: boolean;
        /**
         * Признак что осуществляется загрузка данных
         */
        isLoading?: boolean;
        /**
         * Управляемое открытое состояние выпадающего списка
         */
        isOpen?: boolean;
        /**
         * Показывает Segmented компонент сверху опций
         */
        isSegmented?: boolean;
        /**
         * Возможность добавить новое значение. Не рабоатет вместе с isSegmented
         */
        isAddOption?: boolean;
        /**
         * Включает label в возвращаемом объекте value
         */
        labelInValue?: boolean;
        /**
         * Отображает индикатор загрузки
         */
        loading?: boolean;
        /**
         * Максимальное количество тегов. responsive - по заполнению контейнера
         */
        maxTagCount?: number | 'responsive';
        /**
         * Максимальная длина строки поиска
         */
        maxLengthSearch?: number;
        /**
         * Плесхолдер для не отображаемых тегов
         */
        maxTagPlaceholder?: React.ReactNode | ((omittedValues: TDisplayValue[]) => React.ReactNode);
        /**
         * Максимальное число символов в теге
         */
        maxTagTextLength?: number;
        /**
         * Режим выбора (не применяется для одиночного выбора)
         */
        mode?: TMultipleMode;
        /**
         * Контент, отображаемый при отсутствии результатов поиска
         */
        notFoundContent?: React.ReactNode;
        /**
         * Элемент для отображения справа от поля
         */
        compactAddonAfter?: React.ReactNode;
        /**
         * Свойство для фильтрации опций
         */
        optionFilterProp?: string;
        /**
         * Массив объектов, каждый из которых соответствует опции и имеет структуру, описанную в `Option`
         */
        options?: TOption[];
        /**
         * Пагинация опций. Информация о коллчиестве загруженных опций
         */
        optionsPage?: TOptionsPage;
        /**
         * Опции для компонента Segmented
         */
        optionsSegmented?: NSegmented.TItem[];
        /**
         * Плейсхолдер для поля ввода
         */
        placeholder?: string | React.ReactNode;
        /**
         * Позволяет искать среди опций
         */
        showSearch?: boolean;
        /**
         * Размер компонента
         */
        size?: TSize;
        /**
         * Статус валидации
         */
        status?: 'error' | 'warning';
        /**
         * Стили селекта
         */
        style?: React.CSSProperties;
        /**
         * Варианты селекта
         */
        variant?: TVariant;
        /**
         * Вызывается при размытии
         */
        onBlur?: React.FocusEventHandler<HTMLElement>;
        /**
         * Вызывается при фокусе
         */
        onFocus?: React.FocusEventHandler<HTMLElement>;
        /**
         * Обработчик поиска
         */
        onSearch?: (value: string, pageNumber?: number, segmentedValue?: string | number) => void;
        /**
         * Функция, вызываемая при изменении видимости выпадающего списка
         */
        onDropdownVisibleChange?: (open: boolean) => void;
        /**
         * Обработчик добавления новго значения в селект
         */
        onAddOption?: (value: string) => void;
        /**
         * Форматирование строки ввода поиска
         */
        onSearchFormat?: (value: string) => string;
        /**
         * Обработчик добавления новго значения в селект
         */
        onChange?: (value: ValueType, option?: OptionTypeProps | OptionTypeProps[]) => void;
        /**
         * Кастомная иконка удаления
         */
        removeIcon?: React.ReactNode;
        /**
         * Кастомная иконка суффикса
         */
        suffixIcon?: React.ReactNode;
        /**
         * Кастомная иконка меню селекта
         */
        menuItemSelectedIcon?: React.ReactNode;
        /**
         * Родительский узел, в котором будет отрисован селектор
         */
        getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
        /**
         * Стили для выпадающего меню
         */
        dropdownStyle?: CSSProperties;
        /**
         * Параметр который будет отображаться в выбранном
         */
        optionLabelProp?: string;
    };
    export {};
}
