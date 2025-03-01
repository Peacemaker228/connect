import { ReactNode } from 'react';
import { Meta } from '@storybook/react';
import { NPagination } from '../model';
import { Pagination } from '../Pagination';
declare const _default: Meta<typeof Pagination>;
export default _default;
export declare const DefaultPagination: {
    (argTypes: NPagination.TProps): ReactNode;
    args: {
        defaultCurrent: number;
        total: number;
        size: string;
    };
};
export declare const DisabledPagination: {
    (argTypes: NPagination.TProps): ReactNode;
    args: {
        defaultCurrent: number;
        total: number;
        isDisabled: boolean;
    };
};
export declare const SimplePagination: {
    (argTypes: NPagination.TProps): import("react/jsx-runtime").JSX.Element;
    args: {
        defaultCurrent: number;
        total: number;
        isSimple: boolean;
    };
};
export declare const SmallPagination: {
    (argTypes: NPagination.TProps): ReactNode;
    args: {
        defaultCurrent: number;
        total: number;
        size: string;
    };
};
export declare const MorePagesPagination: {
    (argTypes: NPagination.TProps): ReactNode;
    args: {
        defaultCurrent: number;
        total: number;
        shouldShowSizeChanger: boolean;
    };
};
export declare const DisplayTotalNumberPagination: {
    (argTypes: NPagination.TProps): ReactNode;
    args: {
        defaultCurrent: number;
        total: number;
        showTotal: (total: number, range: [number, number]) => string;
        shouldShowSizeChanger: boolean;
    };
};
export declare const PageSizeChangerPagination: {
    (argTypes: NPagination.TProps): ReactNode;
    args: {
        defaultCurrent: number;
        isPageSizeChanger: boolean;
        defaultPageSize: number;
    };
};
