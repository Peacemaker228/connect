export declare namespace NPagination {
    type TSize = 'default' | 'small';
    export type TRenderer = 'page' | 'prev' | 'next' | 'jump-prev' | 'jump-next';
    export type TProps = {
        /**
         * Текущий номер страницы
         */
        current?: number;
        /**
         * Номер начальной страницы по умолчанию
         */
        defaultCurrent?: number;
        /**
         * Количество элементов данных по умолчанию на странице
         */
        defaultPageSize?: number;
        /**
         * Количество элементов на странице
         */
        pageSize?: number;
        /**
         * Состояние нумерации страниц
         */
        isDisabled?: boolean;
        /**
         * Определите, показывать ли pageSize выбор, это будет верно, когда total > 50
         */
        shouldShowSizeChanger?: boolean;
        /**
         * Размер компонента
         */
        size?: TSize;
        /**
         * Вид пагинации с единичным полем для ввода страницы
         */
        isSimple?: boolean;
        /**
         * Показывает селект с выбором pageSize
         */
        isPageSizeChanger?: boolean;
        /**
         * Общее количество элементов
         */
        total?: number;
        /**
         * Параметры изменения размера пагинации
         */
        pageSizeOptions?: string[] | number[];
        /**
         * Настройка элементов пагинации
         */
        itemRender?: (page: number, type: TRenderer, element: React.ReactNode) => React.ReactNode;
        /**
         * Отобразить общее количество и диапазон
         */
        showTotal?: (total: number, range: [number, number]) => React.ReactNode;
        /**
         * Обработчик изменения страницы
         */
        onChange?: (page: number, pageSize: number) => void;
    };
    export type TCustomItem<T extends string> = {
        [K in T]: React.ReactNode;
    };
    export {};
}
