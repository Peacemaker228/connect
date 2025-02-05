import { TCommonProps } from '../_common/models';
export declare namespace NInputSkeleton {
    type TProps = Omit<TCommonProps, 'size' | 'shape'> & {
        isBlock?: boolean;
        size?: 'large' | 'small' | 'default';
    };
}
