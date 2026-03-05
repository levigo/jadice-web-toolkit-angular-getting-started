import {DefaultActions} from "@levigo/webtoolkit-ng-client";
import {JadiceIcon} from "@levigo/jadice-web-icons";
import {BehaviorSubject} from "rxjs";

// This action makes use of the default toggle action and switches between the "normal" and the "accessible" viewer mode
export const SWITCH_MODE_ACTION  = (mode$ : BehaviorSubject<boolean>) => DefaultActions.Factories.makeToggleAction(
    mode$, JadiceIcon.DEFAULT_READER_MODE, {content: "actions.accessibleMode", translate: true}
);
