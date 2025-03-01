import { HTMLAttributes, PropsWithChildren } from 'react';
export declare namespace NScrollArea {
    type TProps = PropsWithChildren & HTMLAttributes<HTMLElement> & {
        className?: string;
        orientation?: 'vertical' | 'horizontal' | 'both';
    };
}
