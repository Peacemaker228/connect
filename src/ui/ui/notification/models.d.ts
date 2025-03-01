import { ArgsProps } from 'antd/es/notification/interface';
import type * as React from 'react';
export declare namespace NNotification {
    type TStaticFn = (args: TProps) => void;
    export type TNotificationInstance = {
        success: TStaticFn;
        error: TStaticFn;
        info: TStaticFn;
        warning: TStaticFn;
        open: TStaticFn;
        destroy(key?: React.Key): void;
    };
    export type TProps = ArgsProps & {
        /**
         * Отображение на одной линии заголовка и кнопки
         */
        showBtnTitleOnTheSameLine?: boolean;
    };
    export {};
}
