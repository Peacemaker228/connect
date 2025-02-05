import { ReactNode } from 'react';
import { Meta } from '@storybook/react';
import { Link } from './Link';
import { NTypography } from '../models';
declare const _default: Meta<typeof Link>;
export default _default;
export declare const DefaultLink: (argTypes: NTypography.TLinkProps) => ReactNode;
export declare const DisabledLink: {
    (argTypes: NTypography.TLinkProps): ReactNode;
    args: {
        isDisabled: boolean;
    };
};
export declare const DeleteLink: {
    (argTypes: NTypography.TLinkProps): ReactNode;
    args: {
        isDelete: boolean;
    };
};
