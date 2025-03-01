import { default as React, CSSProperties, ReactNode } from 'react';
import { TreeProps } from 'antd/lib/tree';
import { AntTreeNodeProps } from 'antd/lib/tree/Tree';
import { BaseSelectPropsWithoutPrivate } from 'rc-select';
import { ChangeEventExtra, DataNode, LegacyDataNode, SimpleModeConfig } from 'rc-tree-select/lib/interface';
import { TPlacement, TSize, TVariant } from '../../../models';
/**
 * Неймспейс с типизацией NTreeSelect
 */
export declare namespace NTreeSelect {
    type TExpandAction = false | 'click' | 'doubleClick';
    export type TTreeData = DataNode & {
        label?: ReactNode;
        subLabel?: ReactNode;
        iconLabel?: ReactNode;
        titlePopup?: ReactNode;
    };
    export type TOptionsPage = {
        pageNumber: number;
        numberOfPages: number;
    };
    export type TProps<ValueType = any, OptionType extends DataNode = TTreeData> = Omit<BaseSelectPropsWithoutPrivate, 'mode'> & {
        autoFocus?: boolean;
        /**
         * Очистка значени
         */
        isAllowClear?: boolean | {
            clearIcon?: React.ReactNode;
        };
        /**
         * Следует ли автоматически очищать значение поика
         */
        isAutoClearSearchValue?: boolean;
        /**
         * Значение по умолчанию
         */
        defaultValue?: string | string[];
        /**
         * Состояние активности
         */
        isDisabled?: boolean;
        /**
         * Признак загрузки данных
         */
        isLoading?: boolean;
        /**
         * Ограничивыет высоту выбранных элементов
         */
        isLimitInputHeight?: boolean;
        /**
         * Класснейм для дропдауна
         */
        popupClassName?: string;
        /**
         * Должны ли дропдаун и селект иметь одинаковую ширину
         */
        isPopupMatchSelectWidth?: boolean | number;
        /**
         * Настройка содержимого выпадающего списка
         */
        dropdownRender?: (originNode: React.ReactNode) => React.ReactNode;
        /**
         * Стили для выпадающего меню
         */
        dropdownStyle?: CSSProperties;
        /**
         * Настройка имен полей для узлов в компоненте
         */
        fieldNames?: object;
        /**
         * Функция для фильтрации узлов
         */
        filterTreeNode?: boolean | ((inputValue: string, treeNode: DataNode) => boolean);
        /**
         * Функция для получения контейнера для отображения выпадающего списка
         */
        getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
        /**
         * Включает label в возвращаемом объекте value
         */
        isLabelInValue?: boolean;
        /**
         * Управление открытием выпадающего спсиска
         */
        isOpen?: boolean;
        /**
         * Настройка высоты всплывающего окна
         */
        listHeight?: number;
        /**
         * Асинхронно загружает данные
         */
        loadData?: (dataNode: LegacyDataNode) => Promise<unknown>;
        /**
         * Максимальное количество тегов. responsive - по заполнению контейнера
         */
        maxTagCount?: number | 'responsive';
        /**
         * Плесхолдер для не отображаемых тегов
         */
        maxTagPlaceholder?: React.ReactNode | ((omittedValues: ValueType[]) => React.ReactNode);
        /**
         * Максимальное число символов в теге
         */
        maxTagTextLength?: number;
        /**
         * Поддерживает ли компонент множественный выбор
         */
        isMultiple?: boolean;
        /**
         * Контент, отображаемый при отсутствии результатов поиска
         */
        notFoundContent?: React.ReactNode;
        /**
         * Текстовая подсказка
         */
        placeholder?: string;
        /**
         * Позиция выпадающего списка
         */
        placement?: TPlacement;
        /**
         * Префикс
         */
        prefix?: React.ReactNode;
        /**
         * Значение поиска
         */
        searchValue?: string;
        /**
         * Выбор узлов, которые будут показаны в поле ввода после выбора
         */
        showCheckedStrategy?: 'SHOW_ALL' | 'SHOW_CHILD' | 'SHOW_PARENT';
        /**
         * Функциональность поиска
         */
        isShowSearch?: boolean;
        /**
         * Размер select
         */
        size?: TSize;
        /**
         * Статус валидации поля
         */
        status?: 'error' | 'warning';
        /**
         * Дополнительная иконка для компонента
         */
        suffixIcon?: React.ReactNode;
        /**
         * Настройка иконки для узлов дерева
         */
        switcherIcon?: React.ReactNode | ((props: AntTreeNodeProps) => React.ReactNode);
        /**
         * Настройка отображения тегов, только при multiple
         */
        tagRender?: (props: ValueType) => React.ReactNode;
        /**
         * Должны ли узлы дерева отображать флажки выбора
         */
        isTreeCheckable?: boolean;
        /**
         * Позволяет управлять выбором узлов дерева, отключает взаимосвязь между род и доч эл-тами
         */
        isTreeCheckStrictly?: boolean;
        /**
         * Данные дерева
         */
        treeData?: OptionType[];
        /**
         * Преобразует данные дерева в простую структуру
         */
        treeDataSimpleMode?: boolean | SimpleModeConfig;
        /**
         * Настройка отображения заголовков узлов
         */
        treeTitleRender?: (node: ValueType) => React.ReactNode;
        /**
         * Расширять ли узлы дерева по умолчанию
         */
        isTreeDefaultExpandAll?: boolean;
        /**
         * Развернутые узлы дерева по умолчанию
         */
        treeDefaultExpandedKeys?: string[];
        /**
         * Логика открытия узлов при клике
         */
        treeExpandAction?: TExpandAction | undefined;
        /**
         * Развернутые ключи дерева
         */
        treeExpandedKeys?: string[];
        /**
         * Отображать ли иконку перед заголовком узла
         */
        isTreeIcon?: boolean;
        /**
         * Устанавливает загруженные узлы
         */
        treeLoadedKeys?: string[];
        /**
         * Показывает линию
         */
        treeLine?: TreeProps['showLine'];
        /**
         * Строка, используемая для фильтрации узлов дерева
         */
        treeNodeFilterProp?: string;
        /**
         * Строка, отображаемая в качестве содержимого выбора
         */
        treeNodeLabelProp?: string;
        /**
         * Текущее выбранные узлы дерева
         */
        value?: string | string[];
        /**
         * Вариант селектора
         */
        variant?: TVariant;
        /**
         * Отключает виртуальную прокрутку
         */
        isVirtual?: boolean;
        /**
         * Максимальная длина строки поиска
         */
        maxLengthSearch?: number;
        /**
         * Показывать сабтайтл в опциях
         */
        isSubTitle?: boolean;
        /**
         * Позволяет наложить селект поверх родительского комопнента
         */
        isTopContent?: boolean;
        /**
         * Растянуть на всю ширину
         */
        isFullContent?: boolean;
        /**
         * Пагинация опций. Информация о коллчиестве загруженных опций
         */
        optionsPage?: TOptionsPage;
        /**
         * Форматирование строки ввода поиска
         */
        onSearchFormat?: (value: string) => string;
        /**
         * Поиск по вводу с задержкой
         */
        isDebounceSearch?: boolean;
        /**
         * Элемент для отображения справа от поля
         */
        compactAddonAfter?: ReactNode;
        /**
         * Функция обратного вызова при изменении выбранных узлов или значения ввода
         */
        onChange?: (value: ValueType, labelList: React.ReactNode[], extra: ChangeEventExtra) => void;
        /**
         * Вызывается при открытии выпадающего списка
         */
        onDropdownVisibleChange?: (open: boolean) => void;
        /**
         * Функция обратного вызова, вызываемая при изменении значения поиска
         */
        onSearch?: (value: string, pageNumber?: number, segmentedValue?: string | number) => void;
        /**
         * Функция обратного вызова, вызываемая при выборе узла дерева
         */
        onSelect?: (value: ValueType, option: OptionType) => void;
        /**
         * Функция обратного вызова, вызываемая при уадлении выбранного узла дерева
         */
        onDeselect?: (value: ValueType, option: OptionType) => void;
        /**
         * Функция обратного вызова, вызываемая при развертывании узла дерева
         */
        onTreeExpand?: (expandedKeys: React.Key[]) => void;
        /**
         * Вызывается при прокрутке выпадающего списка
         */
        onPopupScroll?: () => void;
    };
    export {};
}
