import { ReactNode } from 'react';
import { TCommonProps } from '../_common/models';
export declare namespace NNodeSkeleton {
    type TProps = Omit<TCommonProps, 'size' | 'shape'> & {
        children?: ReactNode;
        isFullSize?: boolean;
    };
}
