import {Component, OnInit, ViewChild} from "@angular/core";
import {
    AnnotationProfile,
    DefaultActions,
    DefaultToolbar,
    DocumentAnnotations,
    DocumentSource,
    GWTDocumentWrapper,
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
import {BehaviorSubject, filter, interval, map, of, startWith, switchMap, take, tap} from "rxjs";
import {MenuItemType, ToolbarConfig, ToolbarUtils} from "@levigo/jadice-common-components";
import {Nullable} from "@levigo/utility-types";
import {I18NService} from "@levigo/ngx-translate-support";
import {FLOATING_BUTTON_CONFIG} from "./config/floating-button-config";
import {DEMO_DOCUMENTS} from "./config/demo-documents";
import {PILLBOX_CONFIG} from "./config/pillbox-config";
import {SWITCH_MODE_ACTION} from "./config/switch-mode-action";
import {I18N} from "@levigo/jadice-i18n-support";
import {JadiceIcon} from "@levigo/jadice-web-icons";

// @ts-ignore
@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false // for a proper fix, see https://v17.angular.io/guide/standalone-components
})
export class AppComponent implements OnInit{
    readonly DEFAULT_PROFILE = "JWT-Demo-Profile";
    private static SAVE_ANNOS_MSG_NAME: string = "SAVE_ANNOS";

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

    source: Nullable<DocumentSource|any> = {
        uris: ["http://localhost:3000/PDFUA.pdf"],
        annotationUrisList: [["http://localhost:3000/test101.xml"]],
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
                            action: {
                                icon: JadiceIcon.DEFAULT_SAVE_ANNO_A,
                                label: {
                                    translate: false,
                                    content: "speichern"
                                },
                                /**
                                 * Determines if the save button should be enabled
                                 * @returns {Observable<boolean>} Observable that emits true if a document is loaded
                                 */
                                isEnabled$: () => {
                                    // Use interval to periodically check if viewer is available
                                    return interval(150).pipe(
                                        startWith(0), // Emit immediately on subscription
                                        map(() => this.viewerComponent?.getViewer()), // Get the viewer
                                        filter(viewer => !!viewer), // Only continue if the viewer exists
                                        take(1), // Take the first occurrence when viewer becomes available, then complete
                                        switchMap(viewer => {
                                            if (viewer) {
                                                // Check if a document is loaded
                                                return viewer.document$().pipe(
                                                    map((doc: Nullable<GWTDocumentWrapper>) => {
                                                        return doc !== null;
                                                    })
                                                );
                                            } else {
                                                return of(false);
                                            }
                                        })
                                    );
                                },
                                // Handler for save action
                                handle: () => this.saveAnnotations()
                            }
                        },
                        ...DefaultToolbar.CONFIG.menu.menuConfiguration.menuItems.slice(1)
                    ]
                }
            },
            auxiliaryActions: [
                ...(DefaultToolbar.CONFIG.auxiliaryActions as any),
                ToolbarUtils.makeButton(SWITCH_MODE_ACTION(this.mode$))
            ]
        }
    }

    ngOnInit(): void {
        // This is doing all the wiring for the different events, that can happen when trying to open a file
        this.viewerComponent.getViewer$().pipe().forEach(v => {
            const wrapper = this.uploadDialogsWrapper;

            v?.addErrorObserver({
                complete(): void {
                    v?.clearErrorObservers();
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

    /**
     * Saves the current document annotations to the server.
     *
     * This method retrieves the current viewer instance, extracts document data as a DTO,
     * and initiates a server conversation to save the annotations. It shows an alert
     * when annotations are successfully saved and automatically cleans up the subscription
     * after 3 seconds to prevent memory leaks.
     *
     * @remarks
     * The server conversation uses the following parameters:
     * - doc: The document DTO containing all annotation data
     * - saveStreamId: Identifier for the saved file ("test101.xml")
     * - saveAnnotationsHandlerId: The server-side handler ID ("SaveJadiceAnnotationsHandler")
     * - annoFormat: The format for saving annotations ("JADICE")
     *
     * The subscription is automatically unsubscribed after 3 seconds to prevent
     * long-running subscriptions that could cause memory leaks. Could be improved
     * by using a more sophisticated approach.
     */
    private saveAnnotations() {
        this.viewerComponent.getViewer$().pipe().forEach((v: any) => {
            let dto = v?.getDocument()?.toSnapshot().toDTO();
            const subscription = ServerConnection.get().initConversation(
                AppComponent.SAVE_ANNOS_MSG_NAME,
                {
                    doc: dto,
                    saveStreamId: "test101.xml",
                    saveAnnotationsHandlerId: "SaveJadiceAnnotationsHandler",
                    annoFormat: "JADICE"
                }
            ).pipe(tap(() => {
                window.alert("Annotations saved");
            })).subscribe();
            setTimeout(() => {
                subscription.unsubscribe();
            }, 3000);
        });
    }
}
