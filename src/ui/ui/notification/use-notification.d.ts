import { ReactElement } from 'react';
import { NNotification } from './models';
/**
 * Хук для показа уведомлений
 */
export declare function useNotification(baseConfig?: Partial<NNotification.TProps> | undefined): readonly [NNotification.TNotificationInstance, ReactElement<unknown, string | import('react').JSXElementConstructor<any>>];
