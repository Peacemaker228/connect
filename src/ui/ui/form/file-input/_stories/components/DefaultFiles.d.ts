import { NFileInput } from '../../models';
export declare const DefaultFiles: {
    (argTypes: NFileInput.TProps): import("react/jsx-runtime").JSX.Element;
    args: {
        action: string;
        onChange({ file, fileList }: NFileInput.TUploadChangeParam<NFileInput.TUploadFile>): void;
        defaultFileList: ({
            uid: string;
            name: string;
            status: string;
            url: string;
            percent: number;
            response?: undefined;
        } | {
            uid: string;
            name: string;
            status: string;
            url: string;
            percent?: undefined;
            response?: undefined;
        } | {
            uid: string;
            name: string;
            status: string;
            response: string;
            url: string;
            percent?: undefined;
        })[];
    };
};
