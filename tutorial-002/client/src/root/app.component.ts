import {Component, DestroyRef, inject, OnInit, ViewChild} from "@angular/core";
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
import {BehaviorSubject, distinctUntilChanged, filter, interval, map, of, startWith, switchMap, take, tap} from "rxjs";
import {MenuItemType, ToolbarConfig, ToolbarUtils} from "@levigo/jadice-common-components";
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

    annotations$ = new BehaviorSubject<DocumentAnnotations>([]);
    annotationProfile$ = new BehaviorSubject<Nullable<AnnotationProfile>>(null);

    constructor(private i18n: I18NService) {
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
                                handle: () => {
                                    this.displayOpenFile = true;
                                }
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
                ToolbarUtils.makeButton(this.buildSaveAnnotationsAction()),
                ToolbarUtils.makeButton(SWITCH_MODE_ACTION(this.mode$))
            ]
        }
    }

    ngOnInit(): void {
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


    async openFile(file: File) {
        this.displayOpenFile = false;

        this.uploadDialogsWrapper.openFile(file).then(s => {
            if (s != null) {
                this.source = s;
            }
        });
    }

    pickTemplateDoc(template: OpenFileTemplate) {
        this.displayOpenFile = false;
        this.source = {uri: template.data, password: null};
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
            const dto = viewer?.getDocument()?.toSnapshot().toDTO();
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
