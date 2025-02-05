import { CSSProperties, ReactNode } from 'react';
import { Mask } from 'react-text-mask';
import { TVariant } from '../../../models';
/**
 * Неймспейс с типизацией AutoComplete
 */
export declare namespace NAutoComplete {
    type TStatus = 'error' | 'warning' | '';
    type TOptions = {
        label?: ReactNode;
        value?: string | number | null;
    }[];
    type TProps = {
        /**
         * Позволяет очистить значение
         */
        allowClear?: boolean | {
            clearIcon?: ReactNode;
        };
        /**
         * Стили компонента
         */
        style?: CSSProperties;
        /**
         * Список сформированных подсказок
         */
        options?: TOptions;
        /**
         * Дочерние элементы
         */
        children?: ReactNode;
        /**
         * Открытое состояние по умолчанию
         */
        isDefaultOpen?: boolean;
        /**
         * Значение по умолчанию
         */
        defaultValue?: string;
        /**
         * Состояние активности компонента
         */
        isDisabled?: boolean;
        /**
         * CSS-класс для поповера
         */
        popupClassName?: string;
        /**
         * Настройка соотношения раскрывающегося меню и поле выбора
         */
        dropdownMatchSelectWidth?: boolean | number;
        /**
         * Контент, отображаемый при отсутствии результатов поиска
         */
        notFoundContent?: ReactNode;
        /**
         * Флаг состояния открытия окна
         */
        isOpen?: boolean;
        /**
         * Текстовая подсказка
         */
        placeholder?: string;
        /**
         * Статус валидации поля
         */
        status?: TStatus;
        /**
         * Максимальное количество символов
         */
        maxLength?: number;
        /**
         * Тип компонента
         */
        variant?: TVariant;
        /**
         * Значение поля
         */
        value?: string;
        /**
         * Функция обратного вызова при потере фокуса компонента
         */
        onBlur?: () => void;
        /**
         * Функция обратного вызова при фокусе на компоненте
         */
        onFocus?: () => void;
        /**
         * Функция обратного вызова при изменении состояния компонента
         */
        onChange?: (value: string) => void;
        /**
         * Функция обратного вызова при выборе значения компонента
         */
        onSelect?: (value: string) => void;
        /**
         * Обработчик поиска
         */
        onSearch?: (value: string) => void;
        /**
         * Функция обратного вызова раскрывающегося списка
         */
        onDropdownVisibleChange?: (open: boolean) => void;
    };
    type TMaskedProps = Omit<TProps, 'onChange'> & {
        /**
         * Маска ввода
         */
        mask: Mask | ((value: string) => Mask);
        value?: string;
        /**
         * Заполнитель автокомплита
         */
        placeholder?: string;
        onChange?: (value: string, maskedValue: string) => void;
    };
}
