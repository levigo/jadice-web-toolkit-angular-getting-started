import {
    DefaultActions,
    DefaultTextActions,
    Viewer
} from "@levigo/webtoolkit-ng-client";
import {
    PillboxConfig,
    PillboxStyle,
    ToolbarUtils
} from "@levigo/jadice-common-components";


/**
 * This config will render a component at the bottom of the screen.
 * When you move the mouse over it, it will be renered in a more brighter way
 * and you can click on the 5 buttons defined below.
 */
export const PILLBOX_CONFIG: PillboxConfig<Viewer> = {
    pillboxStyle: PillboxStyle.FADING_ON_MOUSEOUT,
    actions: [
        ToolbarUtils.makeButton(DefaultActions.PAGE_FIRST),
        ToolbarUtils.makeButton(DefaultActions.PAGE_PREV),
        ToolbarUtils.makeText(DefaultTextActions.PAGE_NUMBER),
        ToolbarUtils.makeButton(DefaultActions.PAGE_NEXT),
        ToolbarUtils.makeButton(DefaultActions.PAGE_LAST)
    ]
};
