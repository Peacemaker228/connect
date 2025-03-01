import { default as React, ReactNode } from 'react';
import { ProgressAriaProps } from 'antd/es/progress';
import { RcFile as OriRcFile, UploadRequestOption as RcCustomRequestOptions } from 'rc-upload/lib/interface';
/**
 * Неймспейс с типизацией FileInput
 */
export declare namespace NFileInput {
    type TBeforeUploadValue = void | boolean | string | Blob | File;
    export type TUploadFileStatus = 'error' | 'done' | 'uploading' | 'removed';
    type TFileUploadMethods = 'POST' | 'PUT' | 'PATCH' | 'post' | 'put' | 'patch';
    type TPreviewFileHandler = (file: File | Blob) => PromiseLike<string>;
    type TUploadListProgressProps = Omit<ProgressAriaProps, 'percent' | 'type'>;
    type TUploadList = 'text' | 'picture' | 'picture-card' | 'picture-circle';
    export type TRcFile = OriRcFile & {
        readonly lastModifiedDate: Date;
    };
    export type TUploadFile<T = unknown> = Pick<React.AriaAttributes, 'aria-label' | 'aria-labelledby'> & {
        uid: string;
        size?: number;
        name: string;
        fileName?: string;
        lastModified?: number;
        lastModifiedDate?: Date;
        url?: string;
        status?: TUploadFileStatus;
        percent?: number;
        thumbUrl?: string;
        crossOrigin?: React.ImgHTMLAttributes<HTMLImageElement>['crossOrigin'];
        originFileObj?: TRcFile;
        response?: T;
        error?: unknown;
        linkProps?: unknown;
        type?: string;
        xhr?: T;
        preview?: string;
    };
    type THttpRequestHeader = {
        [key: string]: string;
    };
    type TItemRender<T = unknown> = (originNode: React.ReactElement, file: TUploadFile<T>, fileList: Array<TUploadFile<T>>, actions: {
        download: () => void;
        preview: () => void;
        remove: () => void;
    }) => React.ReactNode;
    type TShowUploadList<T = unknown> = {
        showRemoveIcon?: boolean;
        showPreviewIcon?: boolean;
        showDownloadIcon?: boolean;
        removeIcon?: React.ReactNode | ((file: TUploadFile<T>) => React.ReactNode);
        downloadIcon?: React.ReactNode | ((file: TUploadFile<T>) => React.ReactNode);
        previewIcon?: React.ReactNode | ((file: TUploadFile<T>) => React.ReactNode);
    };
    export type TUploadChangeParam<T = TUploadFile> = {
        file: T;
        fileList: T[];
        event?: {
            percent: number;
        };
    };
    type TBeforeUpload = (file: TRcFile, FileList: TRcFile[]) => TBeforeUploadValue | Promise<TBeforeUploadValue>;
    type TUploadData<T> = Record<string, unknown> | ((file: TUploadFile<T>) => Record<string, unknown> | Promise<Record<string, unknown>>);
    export type TProps<T = unknown> = {
        /**
         * Тип принимаемых файлов
         */
        accept?: string;
        /**
         * URL для загрузки файлов
         */
        action?: string | ((file: TRcFile) => string) | ((file: TRcFile) => PromiseLike<string>);
        /**
         * Функция, вызываемая до загрузки
         */
        beforeUpload?: TBeforeUpload;
        /**
         * Кастомный запрос
         */
        customRequest?: (options: RcCustomRequestOptions) => void;
        /**
         * Загрузка дополнительных параметров или функции, которая может возвращать загрузку дополнительных параметров
         */
        data?: TUploadData<T>;
        /**
         * Список загруженных файлов по умолчанию
         */
        defaultFileList?: Array<TUploadFile<T>>;
        /**
         * Загружать ли файлы в директорию
         */
        isDirectory?: boolean;
        /**
         * Заблокировать поле
         */
        isDisabled?: boolean;
        /**
         * Список загруженных файлов
         */
        fileList?: Array<TUploadFile<T>>;
        /**
         * Заголовки запроса
         */
        headers?: THttpRequestHeader;
        /**
         * Отрисовка иконки загрузки
         */
        iconRender?: (file: TUploadFile<T>, listType?: TUploadList) => React.ReactNode;
        /**
         * Настройте отображение <img />
         */
        isImageUrl?: (file: TUploadFile<T>) => boolean;
        /**
         * Отрисовка элемента списка загрузки
         */
        itemRender?: TItemRender<T>;
        /**
         * Тип списка загрузки
         */
        listType?: TUploadList;
        /**
         * Максимальное количество загружаемых файлов
         */
        maxCount?: number;
        /**
         * HTTP-метод запроса на загрузку
         */
        method?: TFileUploadMethods;
        /**
         * Загружать ли несколько файлов
         */
        isMultiple?: boolean;
        className?: string;
        /**
         * Имя загружаемого файла
         */
        name?: string;
        /**
         * Открывать ли окно выбора файла
         */
        shouldOpenFileDialogOnClick?: boolean;
        /**
         * Обработчик превью
         */
        previewFile?: TPreviewFileHandler;
        /**
         * Прогресс загрузки
         */
        progress?: TUploadListProgressProps;
        /**
         * Отображать ли список загрузки
         */
        shouldShowUploadList?: boolean | TShowUploadList;
        /**
         * Передает параметр credentials в http-запросе
         */
        withCredentials?: boolean;
        /**
         * Обработчик изменения списка загруженных файлов
         */
        onChange?: (info: TUploadChangeParam<TUploadFile<T>>) => void;
        /**
         * Обработчик перетаскивания файлов
         */
        onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
        /**
         * Обработчик загрузки после клика
         */
        onDownload?: (file: TUploadFile<T>) => void;
        /**
         * Функция обратного вызова будет выполнена при нажатии ссылки на файл или значка предварительного просмотра
         */
        onPreview?: (file: TUploadFile<T>) => void;
        /**
         * Обработчик удаления загруженного файла
         */
        onRemove?: (file: TUploadFile<T>) => void | boolean | Promise<void | boolean>;
        children?: ReactNode;
    };
    export {};
}
