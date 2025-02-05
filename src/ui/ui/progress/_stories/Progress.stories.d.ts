import { ReactNode } from 'react';
import { Meta } from '@storybook/react';
import { NProgress } from '../models';
import { Progress } from '../Progress';
declare const _default: Meta<typeof Progress>;
export default _default;
export declare const Default: {
    (argTypes: NProgress.TProps): ReactNode;
    args: {
        type: string;
        size: number[];
    };
};
export declare const Circle: {
    (argTypes: NProgress.TProps): ReactNode;
    args: {
        type: string;
    };
};
export declare const Dashboard: {
    (argTypes: NProgress.TProps): ReactNode;
    args: {
        type: string;
    };
};
export declare const Size: (argTypes: NProgress.TProps) => ReactNode;
export declare const ValuePosition: {
    (argTypes: NProgress.TProps): ReactNode;
    args: {
        type: string;
    };
};
export declare const CustomTextFormat: {
    (argTypes: NProgress.TProps): ReactNode;
    args: {
        type: string;
    };
};
export declare const WithSteps: {
    (argTypes: NProgress.TProps): ReactNode;
    args: {
        type: string;
    };
};
export declare const WithSuccessSegment: {
    (argTypes: NProgress.TProps): ReactNode;
    args: {
        percent: number;
        success: {
            percent: number;
        };
        type: string;
    };
};
export declare const StrokeLinecap: {
    (argTypes: NProgress.TProps): ReactNode;
    args: {
        strokeLinecap: string;
        percent: number;
    };
};
export declare const CustomLineGradient: (argTypes: NProgress.TProps) => ReactNode;
export declare const CircularWithStepsAndGaps: {
    (argTypes: NProgress.TProps): ReactNode;
    args: {
        strokeWidth: number;
    };
};
export declare const ResponsiveCircularWithTooltip: {
    (argTypes: NProgress.TProps): ReactNode;
    args: {
        type: string;
        percent: number;
        strokeWidth: number;
        size: number;
        format: () => string;
    };
};
