import { GetProp, UploadProps } from 'antd';
import { NFileInput } from '../../models';
type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];
export declare const Avatar: {
    (argTypes: NFileInput.TProps): import("react/jsx-runtime").JSX.Element;
    args: {
        name: string;
        className: string;
        shouldShowUploadList: boolean;
        action: string;
        beforeUpload: (file: FileType) => boolean;
    };
};
export {};
