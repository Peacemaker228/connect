import { CSSProperties } from 'react';
export declare namespace NImage {
    type TTransformAction = 'flipY' | 'flipX' | 'rotateLeft' | 'rotateRight' | 'zoomIn' | 'zoomOut' | 'close' | 'prev' | 'next' | 'wheel' | 'doubleClick' | 'move' | 'dragRebound' | 'touchZoom' | 'reset';
    type TTransform = {
        x: number;
        y: number;
        rotate: number;
        scale: number;
        flipX: boolean;
        flipY: boolean;
    };
    type TToolbarRenderInfo = {
        icons: {
            prevIcon?: React.ReactNode;
            nextIcon?: React.ReactNode;
            flipYIcon: React.ReactNode;
            flipXIcon: React.ReactNode;
            rotateLeftIcon: React.ReactNode;
            rotateRightIcon: React.ReactNode;
            zoomOutIcon: React.ReactNode;
            zoomInIcon: React.ReactNode;
        };
        actions: {
            onActive?: (offset: number) => void;
            onFlipY: () => void;
            onFlipX: () => void;
            onRotateLeft: () => void;
            onRotateRight: () => void;
            onZoomOut: () => void;
            onZoomIn: () => void;
            onClose: () => void;
            onReset: () => void;
        };
        transform: TTransform;
        current: number;
        total: number;
        image: TImgInfo;
    };
    type TImgInfo = {
        url: string;
        alt: string;
        width: string | number;
        height: string | number;
    };
    type TModalClassNames = {
        header?: string;
        body?: string;
        footer?: string;
        mask?: string;
        content?: string;
        wrapper?: string;
    };
    type TModalStyles = {
        header?: CSSProperties;
        body?: CSSProperties;
        footer?: CSSProperties;
        mask?: CSSProperties;
        wrapper?: CSSProperties;
        content?: CSSProperties;
    };
    type TDialogProps = {
        className?: string;
        keyboard?: boolean;
        style?: CSSProperties;
        children?: React.ReactNode;
        afterOpenChange?: (open: boolean) => void;
        maskClosable?: boolean;
        destroyOnClose?: boolean;
        mousePosition?: {
            x: number;
            y: number;
        } | null;
        title?: React.ReactNode;
        footer?: React.ReactNode;
        transitionName?: string;
        maskTransitionName?: string;
        animation?: any;
        maskAnimation?: any;
        wrapStyle?: Record<string, any>;
        bodyStyle?: Record<string, any>;
        maskStyle?: Record<string, any>;
        prefixCls?: string;
        width?: string | number;
        height?: string | number;
        zIndex?: number;
        bodyProps?: any;
        maskProps?: any;
        rootClassName?: string;
        classNames?: TModalClassNames;
        styles?: TModalStyles;
        wrapProps?: any;
        getContainer?: string | HTMLElement | (() => HTMLElement) | false;
        closeIcon?: React.ReactNode;
        modalRender?: (node: React.ReactNode) => React.ReactNode;
        forceRender?: boolean;
        focusTriggerAfterClose?: boolean;
        panelRef?: React.Ref<HTMLDivElement>;
    };
    type TPreview = TDialogProps & {
        imgCommonProps?: React.ImgHTMLAttributes<HTMLImageElement>;
        src?: string;
        alt?: string;
        imageInfo?: {
            width: number | string;
            height: number | string;
        };
        fallback?: string;
        movable?: boolean;
        rootClassName?: string;
        icons?: {
            rotateLeft?: React.ReactNode;
            rotateRight?: React.ReactNode;
            zoomIn?: React.ReactNode;
            zoomOut?: React.ReactNode;
            close?: React.ReactNode;
            left?: React.ReactNode;
            right?: React.ReactNode;
            flipX?: React.ReactNode;
            flipY?: React.ReactNode;
        };
        current?: number;
        count?: number;
        closeIcon?: React.ReactNode;
        countRender?: (current: number, total: number) => React.ReactNode;
        scaleStep?: number;
        minScale?: number;
        maxScale?: number;
        imageRender?: (originalNode: React.ReactElement, info: {
            transform: TTransform;
            current?: number;
            image?: TImgInfo;
        }) => React.ReactNode;
        onClose?: () => void;
        onTransform?: (info: {
            transform: TTransform;
            action: TTransformAction;
        }) => void;
        toolbarRender?: (originalNode: React.ReactElement, info: TToolbarRenderInfo) => React.ReactNode;
        onChange?: (current: any, prev: any) => void;
    };
    type TImagePreview = TDialogProps & {
        src?: string;
        visible?: boolean;
        minScale?: number;
        maxScale?: number;
        onVisibleChange?: (value: boolean, prevValue: boolean) => void;
        getContainer?: string | HTMLElement | (() => HTMLElement) | false;
        mask?: React.ReactNode;
        maskClassName?: string;
        icons?: TPreview['icons'];
        scaleStep?: number;
        movable?: boolean;
        imageRender?: (originalNode: React.ReactElement, info: {
            transform: TTransform;
            image: TImgInfo;
        }) => React.ReactNode;
        onTransform?: TPreview['onTransform'];
        toolbarRender?: (originalNode: React.ReactElement, info: Omit<TToolbarRenderInfo, 'current' | 'total'>) => React.ReactNode;
    };
    type TPreviewGroupPreview = Omit<TImagePreview, 'mask' | 'maskClassName' | 'onVisibleChange' | 'toolbarRender' | 'imageRender'> & {
        current?: number;
        countRender?: (current: number, total: number) => React.ReactNode;
        toolbarRender?: (originalNode: React.ReactElement, info: TToolbarRenderInfo) => React.ReactNode;
        imageRender?: (originalNode: React.ReactElement, info: {
            transform: TTransform;
            current: number;
            image: TImgInfo;
        }) => React.ReactNode;
        onVisibleChange?: (value: boolean, prevValue: boolean, current: number) => void;
        onChange?: (current: number, prevCurrent: number) => void;
    };
    type TPreviewGroupProps = {
        previewPrefixCls?: string;
        icons?: TPreview['icons'];
        items?: (string | TImagePreview)[];
        fallback?: string;
        preview?: boolean | TPreviewGroupPreview;
        children?: React.ReactNode;
    };
    type TImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'placeholder' | 'onClick'> & {
        src?: string;
        wrapperClassName?: string;
        wrapperStyle?: React.CSSProperties;
        prefixCls?: string;
        previewPrefixCls?: string;
        placeholder?: React.ReactNode;
        fallback?: string;
        rootClassName?: string;
        preview?: boolean | TImagePreview;
        onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
    };
}
