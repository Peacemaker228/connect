import { ReactNode } from 'react';
import { Meta } from '@storybook/react';
import { NTreeSelect } from '../TreeSelect/models.js';
import { TreeSelect } from '../TreeSelect/TreeSelect.js';
declare const _default: Meta<typeof TreeSelect>;
export default _default;
export declare const Default: {
    (argTypes: NTreeSelect.TProps): ReactNode;
    args: {
        treeData: ({
            title: string;
            value: string;
            key: string;
            children: {
                title: string;
                value: string;
                key: string;
                children: {
                    title: string;
                    value: string;
                    key: string;
                }[];
            }[];
        } | {
            title: string;
            value: string;
            key: string;
            children: {
                title: string;
                value: string;
                key: string;
            }[];
        })[];
        allowClear: boolean;
        isShowSearch: boolean;
        isTreeDefaultExpandAll: boolean;
    };
};
export declare const MultipleSelection: {
    (argTypes: NTreeSelect.TProps): ReactNode;
    args: {
        isMultiple: boolean;
        isAllowClear: boolean;
        treeData: ({
            title: string;
            value: string;
            key: string;
            children: {
                title: string;
                value: string;
                key: string;
                children: {
                    title: string;
                    value: string;
                    key: string;
                }[];
            }[];
        } | {
            title: string;
            value: string;
            key: string;
            children: {
                title: string;
                value: string;
                key: string;
            }[];
        })[];
        allowClear: boolean;
        isShowSearch: boolean;
        isTreeDefaultExpandAll: boolean;
    };
};
export declare const WithCustomSwitcherIcon: {
    (argTypes: NTreeSelect.TProps): ReactNode;
    args: {
        switcherIcon: import("react/jsx-runtime").JSX.Element;
        isMultiple: boolean;
        isAllowClear: boolean;
        treeData: ({
            title: string;
            value: string;
            key: string;
            children: {
                title: string;
                value: string;
                key: string;
                children: {
                    title: string;
                    value: string;
                    key: string;
                }[];
            }[];
        } | {
            title: string;
            value: string;
            key: string;
            children: {
                title: string;
                value: string;
                key: string;
            }[];
        })[];
        allowClear: boolean;
        isShowSearch: boolean;
        isTreeDefaultExpandAll: boolean;
    };
};
export declare const Checkable: {
    (argTypes: NTreeSelect.TProps): ReactNode;
    args: {
        isTreeCheckable: boolean;
        treeData: ({
            title: string;
            value: string;
            key: string;
            children: {
                title: string;
                value: string;
                key: string;
                children: {
                    title: string;
                    value: string;
                    key: string;
                }[];
            }[];
        } | {
            title: string;
            value: string;
            key: string;
            children: {
                title: string;
                value: string;
                key: string;
            }[];
        })[];
        allowClear: boolean;
        isShowSearch: boolean;
        isTreeDefaultExpandAll: boolean;
    };
};
export declare const Placement: {
    (argTypes: NTreeSelect.TProps): ReactNode;
    args: {
        dropdownStyle: {
            maxHeight: number;
            overflow: string;
            minWidth: number;
        };
        treeData: ({
            title: string;
            value: string;
            key: string;
            children: {
                title: string;
                value: string;
                key: string;
                children: {
                    title: string;
                    value: string;
                    key: string;
                }[];
            }[];
        } | {
            title: string;
            value: string;
            key: string;
            children: {
                title: string;
                value: string;
                key: string;
            }[];
        })[];
        allowClear: boolean;
        isShowSearch: boolean;
        isTreeDefaultExpandAll: boolean;
    };
};
export declare const Status: {
    (argTypes: NTreeSelect.TProps): ReactNode;
    args: {
        treeData: ({
            title: string;
            value: string;
            key: string;
            children: {
                title: string;
                value: string;
                key: string;
                children: {
                    title: string;
                    value: string;
                    key: string;
                }[];
            }[];
        } | {
            title: string;
            value: string;
            key: string;
            children: {
                title: string;
                value: string;
                key: string;
            }[];
        })[];
        allowClear: boolean;
        isShowSearch: boolean;
        isTreeDefaultExpandAll: boolean;
    };
};
export declare const Subtitle: {
    (argTypes: NTreeSelect.TProps): ReactNode;
    args: {
        isSubTitle: boolean;
        treeData: ({
            label: string;
            subLabel: string;
            value: string;
            key: string;
            children: {
                title: string;
                value: string;
                key: string;
                label: string;
                subLabel: string;
                iconLabel: import("react/jsx-runtime").JSX.Element;
                children: {
                    title: string;
                    value: string;
                    key: string;
                    iconLabel: import("react/jsx-runtime").JSX.Element;
                    label: string;
                    subLabel: string;
                }[];
            }[];
        } | {
            value: string;
            label: string;
            subLabel: string;
            key: string;
            children: {
                title: string;
                value: string;
                key: string;
                iconLabel: import("react/jsx-runtime").JSX.Element;
                label: string;
                subLabel: string;
                titlePopup: string;
            }[];
        })[];
        isMultiple: boolean;
        treeNodeFilterProp: string;
    };
};
export declare const CompactAddonAfter: {
    (argTypes: NTreeSelect.TProps): ReactNode;
    args: {
        treeData: ({
            title: string;
            value: string;
            key: string;
            children: {
                title: string;
                value: string;
                key: string;
                children: {
                    title: string;
                    value: string;
                    key: string;
                }[];
            }[];
        } | {
            title: string;
            value: string;
            key: string;
            children: {
                title: string;
                value: string;
                key: string;
            }[];
        })[];
    };
};
export declare const ScrollTreeSelect: {
    (argTypes: NTreeSelect.TProps): ReactNode;
    args: {
        allowClear: boolean;
    };
};
export declare const SearchTreeSelect: {
    (argTypes: NTreeSelect.TProps): ReactNode;
    args: {
        treeData: ({
            title: string;
            value: string;
            key: string;
            children: {
                title: string;
                value: string;
                key: string;
                children: {
                    title: string;
                    value: string;
                    key: string;
                }[];
            }[];
        } | {
            title: string;
            value: string;
            key: string;
            children: {
                title: string;
                value: string;
                key: string;
            }[];
        })[];
        allowClear: boolean;
        isMultiple: boolean;
        isDebounceSearch: boolean;
        isShowSearch: boolean;
    };
};
