import { NFileInput } from '../../models';
export declare const Default: {
    (argTypes: NFileInput.TProps): import("react/jsx-runtime").JSX.Element;
    args: {
        name: string;
        action: string;
        headers: {
            authorization: string;
        };
        onChange: (info: NFileInput.TUploadChangeParam<NFileInput.TUploadFile>) => void;
    };
};
