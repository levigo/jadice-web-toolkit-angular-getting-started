import {ChangeDetectorRef, Component, DestroyRef, inject, OnInit, ViewChild} from "@angular/core";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {
    AnnotationCustomizers,
    AnnotationInstanceType,
    AnnotationProfile,
    AnnotationProfileCache,
    AnnotationProfileUtils, DefaultActions,
    DefaultToolbar,
    DocumentAnnotations,
    DocumentSource,
    GWTDocumentWrapper,
    GWTImageAnnotationWrapper,
    Hotkeys,
    ServerConnection,
    Viewer,
    ViewerType
} from "@levigo/webtoolkit-ng-client";
import {
    AnnotationHelper,
    MultiModeViewerComponent,
    OpenFileTemplate,
    ThumbnailPanelComponent,
    UploadDialogsWrapperComponent
} from "@levigo/ngx-webtoolkit";
import {BehaviorSubject, distinctUntilChanged, filter, fromEvent, interval, map, of, startWith, switchMap, take, tap} from "rxjs";
import {Alignment, ButtonConfig, ButtonType, MenuItemType, ToolbarConfig, ToolbarUtils} from "@levigo/jadice-common-components";
import {Nullable} from "@levigo/utility-types";
import {I18NService} from "@levigo/ngx-translate-support";
import {FLOATING_BUTTON_CONFIG} from "./config/floating-button-config";
import {DEMO_DOCUMENTS} from "./config/demo-documents";
import {PILLBOX_CONFIG} from "./config/pillbox-config";
import {SWITCH_MODE_ACTION} from "./config/switch-mode-action";
import {I18N} from "@levigo/jadice-i18n-support";
import {JadiceIcon} from "@levigo/jadice-web-icons";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false
})
export class AppComponent implements OnInit{
    readonly DEFAULT_PROFILE = "JWT-Demo-Profile";
    private static SAVE_ANNOS_MSG_NAME: string = "SAVE_ANNOS";
    private readonly destroyRef = inject(DestroyRef);

    // The following variables' values are those classes that are defined in the subfolder "config"
    readonly DEMO_DOCUMENTS = DEMO_DOCUMENTS;
    readonly FLOATING_BUTTON_CONFIG = FLOATING_BUTTON_CONFIG;
    readonly PILLBOX_CONFIG = PILLBOX_CONFIG;

    // viewer mode - default mode or accessible mode for people with visual impairment?
    mode$ = new BehaviorSubject<boolean>(false);
    vieweType$ = this.mode$.pipe(map(mode => (mode ? ViewerType.ACCESSIBLE : ViewerType.RENDERED_GWT)));

    // use the default config and add the button for switching the view mode (normal/accessible)
    TOOLBAR_CONFIG: ToolbarConfig<Viewer>;
    RIGHT_TOOLBAR_CONFIG: ToolbarConfig<Viewer>;

    @ViewChild("viewerComponent", {static: true})
    viewerComponent!: MultiModeViewerComponent;

    @ViewChild("thumbnailPanelComponent")
    thumbnailPanelComponent!: ThumbnailPanelComponent;

    @ViewChild("uploadDialogsWrapper")
    uploadDialogsWrapper!: UploadDialogsWrapperComponent;

    currentDocument: GWTDocumentWrapper | null = null;

    passwordRequiredSource: DocumentSource | null = null;

    source: Nullable<DocumentSource | any> = {
        uris: ["http://localhost:3000/PDFUA.pdf"],
        annotationUrisList: [["http://localhost:3000/test93.xml"]],
        password: null
    };

    displayOpenFile: boolean = true;
    readonly rightSidebarMode$ = new BehaviorSubject<Nullable<string>>("annotations");
    // Controls visibility of the left page-navigator (thumbnail) sidebar.
    readonly thumbnailsVisible$ = new BehaviorSubject<boolean>(true);
    // Bottom-left overlay button that toggles the page-navigator sidebar.
    readonly TOGGLE_THUMBNAILS_BUTTON: ButtonConfig<Viewer> = {
        type: ButtonType.SINGLE_ACTION,
        action: DefaultActions.Factories.makeToggleAction(
            this.thumbnailsVisible$,
            JadiceIcon.PAGE_VIEW_LEFT,
            {translate: false, content: "Page navigator"}
        )
    };
    // Simple Search action, shared by the toolbar button and the Ctrl+F hotkey.
    private readonly simpleSearchAction = DefaultActions.SHOW_SIMPLE_SEARCH_PANEL(Hotkeys.getViewerProvider$());

    annotations$ = new BehaviorSubject<DocumentAnnotations>([]);
    annotationProfile$ = new BehaviorSubject<Nullable<AnnotationProfile>>(null);

    constructor(private i18n: I18NService, private changeDetectorRef: ChangeDetectorRef) {
        i18n.init();
        this.setupAnnotations();
        // configures the toolbar, esp. for a correct file opening and a correct switch between normal / accessible mode
        this.TOOLBAR_CONFIG =
            {
            ...DefaultToolbar.CONFIG,
            menu: {
                ...DefaultToolbar.CONFIG.menu,
                menuConfiguration: {
                    menuItems: [
                        {
                            type: MenuItemType.ACTION,
                            action: {
                                ...DefaultActions.OPEN_FILE,
                                handle: () => this.showOpenFileModal()
                            }
                        },
                        {
                            type: MenuItemType.ACTION,
                            action: this.buildSaveAnnotationsAction()
                        },
                        ...DefaultToolbar.CONFIG.menu.menuConfiguration.menuItems.slice(1)
                    ]
                }
            },
            auxiliaryActions: [
                ...(DefaultToolbar.CONFIG.auxiliaryActions as any),
                // Simple Search: built-in action that opens the SimpleSearchPanel as a floating popup
                // (closes on Escape / click-away). The viewer provider is the one set on Hotkeys in ngOnInit.
                ToolbarUtils.makeButton({
                    ...this.simpleSearchAction,
                    label: {translate: false, content: "Simple search"}
                }),
                ToolbarUtils.makeButton(this.buildSaveAnnotationsAction()),
                ToolbarUtils.makeButton(SWITCH_MODE_ACTION(this.mode$))
            ]
        };
        this.RIGHT_TOOLBAR_CONFIG = {
            alignment: Alignment.VERTICAL,
            actions: [
                ToolbarUtils.makeButton(
                    DefaultActions.Factories.makeEnumAction(
                        this.rightSidebarMode$,
                        JadiceIcon.DEFAULT_TEXTSEARCH,
                        {translate: false, content: "Search"},
                        "advancedSearch"
                    )
                ),
                ToolbarUtils.makeButton(
                    DefaultActions.Factories.makeEnumAction(
                        this.rightSidebarMode$,
                        JadiceIcon.ANNO_FALLBACK_ICON,
                        {translate: false, content: "Annotations"},
                        "annotations"
                    )
                )
            ],
            auxiliaryActions: [],
            menu: {
                display: false,
                menuConfiguration: {
                    menuItems: []
                }
            }
        };
    }

    ngOnInit(): void {
        Hotkeys.setViewerProvider(this.viewerComponent);

        // Hide the "clear input" (x) button in the Simple Search popup. Unlike the "advanced search"
        // button it is not exposed as a CSS shadow part, so a global ::part rule cannot reach it. The
        // popup is created on demand and appended to document.body, so inject a style into its shadow
        // root whenever it appears.
        const simpleSearchStyleObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => mutation.addedNodes.forEach(node => {
                if (node instanceof HTMLElement
                    && node.tagName.toLowerCase() === "jadice-simple-search-panel"
                    && node.shadowRoot) {
                    const style = document.createElement("style");
                    style.textContent = ".button.clear { display: none; }";
                    node.shadowRoot.appendChild(style);
                }
            }));
        });
        simpleSearchStyleObserver.observe(document.body, {childList: true});
        this.destroyRef.onDestroy(() => simpleSearchStyleObserver.disconnect());

        // Ctrl+F (Cmd+F) opens the Simple Search popup instead of the browser's native find.
        fromEvent<KeyboardEvent>(document, "keydown").pipe(
            filter(event => (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f"),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(event => {
            const viewer = this.viewerComponent.getViewer();
            // Only act when a document is loaded (mirrors the toolbar button's enabled state).
            if (!viewer || !viewer.getDocument()) {
                return;
            }
            event.preventDefault();
            // Don't stack popups: if one is already open, focus it instead of opening another.
            const existingPopup = document.body.querySelector("jadice-simple-search-panel");
            if (existingPopup instanceof HTMLElement) {
                existingPopup.focus();
                return;
            }
            this.simpleSearchAction.handle?.(viewer);
        });

        // Re-fit the viewer whenever a side panel opens or closes (see relayoutViewer).
        this.rightSidebarMode$.pipe(
            distinctUntilChanged(),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(() => this.relayoutViewer());

        this.thumbnailsVisible$.pipe(
            distinctUntilChanged(),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(() => this.relayoutViewer());

        fromEvent<CustomEvent<string>>(document, "rightSidebarChange").pipe(
            map(event => event.detail),
            filter(detail => detail === "advancedSearch"),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(() => {
            this.rightSidebarMode$.next("advancedSearch");
        });

        // This is doing all the wiring for the different events, that can happen when trying to open a file
        this.viewerComponent.getViewer$().pipe(
            filter((viewer): viewer is Viewer => viewer != null),
            distinctUntilChanged(),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(v => {
            const wrapper = this.uploadDialogsWrapper;

            v.addErrorObserver({
                complete(): void {
                    v.clearErrorObservers();
                }, error(err: any): void {
                    console.log("while trying to report an error, another error came on top: " + err);
                }, next(error: any): void {
                    let completeText = I18N.get().translateOnce("webtoolkitClient.document.documentLoadingError");
                    if (error && error.className && error.className.toLowerCase().includes("exception")) {
                        const message = error.message;
                        if (message && (typeof message === "string")) {
                            completeText += "\r\n" + message;
                        }
                    }
                    wrapper.errorMessage = completeText;
                    wrapper.displayErrorDialog = true;
                }
            });
        });
    }



    private setupAnnotations() {
        AnnotationHelper.setupAnnotations(this.annotationProfile$, this.annotations$, this.DEFAULT_PROFILE);
    }

    setUrl(url: string) {
        this.source = {
            uri: url,
            password: null
        };
    }

    pageSelected(pageIndex: number) {
        this.viewerComponent.setCurrentPageIndex(pageIndex);
    }

    loadDocWithPassword(password: string) {
        const source = {...this.passwordRequiredSource, password} as DocumentSource;
        this.passwordRequiredSource = null;
        this.source = source;
    }

    showOpenFileModal() {
        this.displayOpenFile = true;
        this.changeDetectorRef.detectChanges();
    }

    hideOpenFileModal() {
        this.displayOpenFile = false;
        this.changeDetectorRef.detectChanges();
    }

    async openFile(file: File) {
        this.hideOpenFileModal();

        this.uploadDialogsWrapper.openFile(file).then(s => {
            if (s != null) {
                this.source = s;
            }
        });
    }

    pickTemplateDoc(template: OpenFileTemplate) {
        this.hideOpenFileModal();
        this.source = {uri: template.data, password: null};
    }

    // The viewer does not observe its container; after a side panel toggles, tell it to recalculate
    // its size once the DOM has updated so the page fit and scrollbar realign.
    private relayoutViewer() {
        setTimeout(() => this.viewerComponent?.recalculateSize());
    }

    private buildSaveAnnotationsAction() {
        return {
            icon: JadiceIcon.DEFAULT_SAVE_ANNO_A,
            label: {
                translate: false,
                content: "Save annotations"
            },
            isEnabled$: () => {
                return interval(150).pipe(
                    startWith(0),
                    map(() => this.viewerComponent?.getViewer()),
                    filter(viewer => !!viewer),
                    take(1),
                    switchMap(viewer => {
                        if (viewer) {
                            return viewer.document$().pipe(
                                map((doc: Nullable<GWTDocumentWrapper>) => doc !== null)
                            );
                        }
                        return of(false);
                    })
                );
            },
            handle: () => this.saveAnnotations()
        };
    }

    private saveAnnotations() {
        this.viewerComponent.getViewer$().pipe(take(1)).subscribe((viewer: any) => {
            // getTransferableDocument() (unlike getDocument()) attaches the current render controls
            // as the "serializedRenderControls" document property for the handler to persist.
            // Only the rendered (GWT) viewer attaches them, not accessible mode.
            const dto = viewer?.getTransferableDocument()?.toSnapshot().toDTO();
            if (!dto) {
                return;
            }

            ServerConnection.get().initConversation(
                AppComponent.SAVE_ANNOS_MSG_NAME,
                {
                    doc: dto,
                    saveStreamId: "test93.xml",
                    saveAnnotationsHandlerId: "SaveJadiceAnnotationsHandler",
                    annoFormat: "JADICE"
                }
            ).pipe(
                take(1),
                tap(() => {
                    window.alert("Annotations saved");
                })
            ).subscribe();
        });
    }
}
