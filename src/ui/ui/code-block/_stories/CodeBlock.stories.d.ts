import { NCodeBlock } from '../models';
declare const meta: {
    title: string;
    component: import('react').FC<NCodeBlock.TProps>;
    parameters: {
        layout: string;
    };
    argTypes: {
        code: {
            control: "text";
        };
        language: {
            control: "text";
        };
    };
};
export default meta;
export declare const Default: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, NCodeBlock.TProps>;
export declare const WithLanguage: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, NCodeBlock.TProps>;
export declare const WithCode: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, NCodeBlock.TProps>;
