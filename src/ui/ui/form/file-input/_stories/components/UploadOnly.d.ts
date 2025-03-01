import { NFileInput as N } from '../../models';
export declare const UploadOnly: {
    (argTypes: N.TProps): import("react/jsx-runtime").JSX.Element;
    args: {
        beforeUpload: (file: N.TRcFile) => string | true;
        onChange: (info: N.TUploadChangeParam<N.TUploadFile>) => void;
    };
};
