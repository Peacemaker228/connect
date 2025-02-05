import { TreeDataNode, TreeNodeProps } from 'antd';
export declare namespace NTree {
    type TProps = {
        isCheckable?: boolean;
        isCheckStrictly?: boolean;
        defaultCheckedKeys?: React.Key[];
        defaultExpandedKeys?: React.Key[];
        defaultSelectedKeys?: React.Key[];
        isDisabled?: boolean;
        checkedKeys?: React.Key[] | {
            checked: React.Key[];
            halfChecked: React.Key[];
        };
        expandedKeys?: React.Key[];
        selectedKeys?: React.Key[];
        onCheck?: (checkedKeys: React.Key[] | {
            checked: React.Key[];
            halfChecked: React.Key[];
        }, info: any) => void;
        onExpand?: (expandedKeys: React.Key[], info: any) => void;
        onSelect?: (selectedKeys: React.Key[], info: any) => void;
        treeData?: TreeDataNode[];
        isDraggable?: boolean;
        shouldAllowDrop: ({ dropNode, dropPosition }: any) => boolean;
        isAutoExpandedParent: boolean;
        isBlockNode: boolean;
        isDefaultExpandAll?: boolean;
        isDefaultExpandParent?: boolean;
        fieldNames?: TFieldNames;
        isFilterTreeNode?: (node: any) => boolean;
        height?: number;
        icon?: React.ReactNode;
        loadData?: (node: any) => Promise<any> | any;
        loadedKeys: string[];
        isMultiple?: boolean;
        rootStyle: React.CSSProperties;
        isSelectable?: boolean;
        isShowIcon: boolean;
        isShowLine: boolean;
        switcherIcon: React.ReactNode | (({ expanded }: {
            expanded?: boolean;
        }) => React.ReactNode);
        switcherLoadingIcon: React.ReactNode;
        titleRender: (node: any) => React.ReactNode;
        isVirtual: boolean;
        onDragEnd: ({ event, node }: {
            event: any;
            node: any;
        }) => void;
        onDragEnter: ({ event, node }: {
            event: any;
            node: any;
        }) => void;
        onDragLeave: ({ event, node }: {
            event: any;
            node: any;
        }) => void;
        onDrop: ({ event, node, dragNode, dragNodesKeys, }: {
            event: any;
            node: any;
            dragNode: any;
            dragNodesKeys: any;
        }) => void;
        onLoad: (loadedKeys: any, { event, node }: {
            event: any;
            node: any;
        }) => void;
        onRightClick: ({ event, node }: {
            event: any;
            node: any;
        }) => void;
    };
    type TFieldNames = {
        title?: string;
        /** @private Для внутреннего использования с `rc-tree-select`, можно удалить, если не используется */
        _title?: string[];
        key?: string;
        children?: string;
    };
    type DataNode = TFieldDataNode<{
        key: TKey;
        title?: React.ReactNode | ((data: DataNode) => React.ReactNode);
    }>;
    /** Предоставляет обертку для типов, когда требуется обернуть в кастомизированный тип fieldNames */
    type TFieldDataNode<T, ChildFieldName extends string = 'children'> = TBasicDataNode & T & Partial<Record<ChildFieldName, TFieldDataNode<T, ChildFieldName>[]>>;
    /** Для fieldNames предоставляется абстрактный интерфейс */
    type TBasicDataNode = {
        isCheckable?: boolean;
        isDisabled?: boolean;
        isDisableCheckbox?: boolean;
        icon?: TIcon;
        isLeaf?: boolean;
        isSelectable?: boolean;
        switcherIcon?: TIcon;
        /** Установить стили для TreeNode. Это не рекомендуется делать, если только нет жесткого требования к стилям */
        className?: string;
        style?: React.CSSProperties;
    };
    type TIcon = React.ReactNode | ((props: TreeNodeProps) => React.ReactNode);
    type TKey = React.Key;
}
