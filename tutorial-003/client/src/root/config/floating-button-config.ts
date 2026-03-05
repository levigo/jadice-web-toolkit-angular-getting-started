import {DefaultActionGroups, Viewer} from "@levigo/webtoolkit-ng-client";
import {
    ActionGroupExpansionDirection,
    ButtonConfig,
    ButtonType,
    TooltipPosition
} from "@levigo/jadice-common-components";


// This configures the button on the bottom right of the screen, that can e.g. switch betweedn the three layouts SINGLE_PAGE, CONTINUOUS and GRID
export const FLOATING_BUTTON_CONFIG: ButtonConfig<Viewer> = {
    type: ButtonType.ACTIVE_SELECTION,
    direction: ActionGroupExpansionDirection.LEFT   ,
    actionGroup: DefaultActionGroups.PAGE_LAYOUT,
    tooltipOverrides: {
        position: TooltipPosition.BOTTOM
    }
};
