import { NFormItem } from './models';
declare const meta: {
    title: string;
    component: import('react').FC<import('antd').FormItemProps<any> & {
        isRequiredRight?: boolean;
    }>;
    parameters: {
        layout: string;
    };
};
export default meta;
export declare const Default: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, NFormItem.TProps>;
export declare const WithIcon: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, NFormItem.TProps>;
