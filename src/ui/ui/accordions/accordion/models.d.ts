import { TSize as TSizeC } from '../../../models';
import { TBaseProps, TCollapseExpandIconPosition as TCollapseExpandIconPositionC, TCollapseItem as TCollapseItemC, TCollapsible as TCollapsibleC } from '../_common/models';
export declare namespace NAccordion {
    type TCollapseExpandIconPosition = TCollapseExpandIconPositionC;
    type TCollapseItem = TCollapseItemC;
    type TCollapsible = TCollapsibleC;
    type TSize = TSizeC;
    type TProps = TBaseProps & {
        /**
         * Ключи активных панелей
         */
        activeKey?: string | number;
    };
}
