import { TCommonProps } from '../_common/models';
export declare namespace NButtonSkeleton {
    type TProps = Omit<TCommonProps, 'size'> & {
        size?: 'large' | 'small' | 'default';
        /**
         * Состояние ширины кнопки относительно ее родителя
         */
        isBlock?: boolean;
    };
}
