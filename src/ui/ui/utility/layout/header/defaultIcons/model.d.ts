/**
 * Неймспейс с типизацией DefaultHeaderIcons
 */
export declare namespace NDefaultHeaderIcons {
    type TButtonConfig = {
        icon?: React.ReactNode;
        onClick?: () => void;
        isHidden?: boolean;
        isDisabled?: boolean;
        badgeCount?: number;
    };
    type TProps = {
        isNotificationButtonHidden?: boolean;
        isNotificationButtonDisabled?: boolean;
        isUserButtonHidden?: boolean;
        isUserButtonDisabled?: boolean;
        isLogoutButtonHidden?: boolean;
        isLogoutButtonDisabled?: boolean;
        onNotificationButtonClick?: () => void;
        onUserButtonClick?: () => void;
        onLogoutButtonClick?: () => void;
        customButtons?: React.ReactNode;
        badgeCount?: number;
    };
}
