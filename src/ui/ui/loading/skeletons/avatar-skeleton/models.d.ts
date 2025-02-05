import { TCommonProps } from '../_common/models';
export declare namespace NAvatarSkeleton {
    type TProps = Omit<TCommonProps, 'shape'> & {
        shape?: 'circle' | 'square';
    };
}
