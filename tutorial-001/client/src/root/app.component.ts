import {AfterViewInit, Component, OnInit, ViewChild} from "@angular/core";
import {
  AnnotationProfile,
  AsyncUtils,
  DefaultActions,
  DefaultToolbar,
  DocumentAnnotations,
  DocumentSource,
  DownloadPurpose,
  Export,
  ExportConfiguration,
  ExportType,
  GWTDocumentWrapper,
  ServerConnection,
  Viewer,
  ViewerType
} from "@levigo/webtoolkit-ng-client";
import {
  AnnotationHelper,
  AttachmentPanelComponent,
  MultiModeViewerComponent,
  OpenFileTemplate,
  ThumbnailPanelComponent,
  UploadDialogsWrapperComponent
} from "@levigo/ngx-webtoolkit";
import {BehaviorSubject, filter, fromEvent, interval, map, merge, Observable, of, startWith, switchMap, take, tap} from "rxjs";
import {
  Action,
  Alignment,
  ButtonConfig,
  ButtonType,
  Logger,
  MenuItemType,
  ToolbarAction,
  ToolbarConfig,
  ToolbarUtils
} from "@levigo/jadice-common-components";
import {NObservable, Nullable} from "@levigo/utility-types";
import {I18NService} from "@levigo/ngx-translate-support";
import {FLOATING_BUTTON_CONFIG} from "./config/floating-button-config";
import {DEMO_DOCUMENTS} from "./config/demo-documents";
import {PILLBOX_CONFIG} from "./config/pillbox-config";
import {I18N} from "@levigo/jadice-i18n-support";
import {JadiceIcon} from "@levigo/jadice-web-icons";
import {TRANSLATE_ACTION, TRANSLATE_ACTION_GROUP} from "@levigo/webtoolkit-ng-client/dist/defaults/actions/action-templates";

// @ts-ignore
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false // for a proper fix, see https://v17.angular.io/guide/standalone-components
})
export class AppComponent implements OnInit, AfterViewInit {
  logger = Logger.get(AppComponent);

  readonly DEFAULT_PROFILE = "JWT-Demo-Profile";
  private static SAVE_ANNOS_MSG_NAME: string = "SAVE_ANNOS";

  // The following variables' values are those classes that are defined in the subfolder "config"
  readonly DEMO_DOCUMENTS = DEMO_DOCUMENTS;
  readonly FLOATING_BUTTON_CONFIG = FLOATING_BUTTON_CONFIG;
  readonly PILLBOX_CONFIG = PILLBOX_CONFIG;

  // viewer mode - default mode or accessible mode for people with visual impairment?
  mode$ = new BehaviorSubject<ViewerType>(ViewerType.RENDERED_GWT);
  viewerType$ = this.mode$.pipe(map(mode => (mode ? ViewerType.ACCESSIBLE : ViewerType.RENDERED_GWT)));
  defaultSidebarAction: string = "anno";
  readonly sideBar$ = new BehaviorSubject<Nullable<string>>(this.defaultSidebarAction);

  @ViewChild("attachmentPanel")
  attachmentPanel!: AttachmentPanelComponent;

  displayAttachment: boolean = false;
  attachmentId: string = "";
  attachmentName: string = "";

  // Right toolbar configuration object - controls which sidebar panels are available
  rightToolbarActionConfig: {
    annotationPanel: boolean,
    advancedSearch: boolean,
    bookmarkPanel: boolean,
    attachmentPanel: boolean,
    documentSelectionPanel: boolean
  } = {
    annotationPanel: true,
    advancedSearch: true,
    bookmarkPanel: true,
    attachmentPanel: false,
    documentSelectionPanel: false
  };

  // All sidebar toggle actions
  readonly TOGGLE_ANNO_PANEL_ACTION = DefaultActions.Factories.makeEnumAction(
    this.sideBar$, JadiceIcon.ANNO_FALLBACK_ICON, {
      translate: true, content: "jadiceWebViewerDist.sidebar.anno"
    }, "anno");

  readonly TOGGLE_ADVANCED_SEARCH_ACTION = DefaultActions.Factories.makeEnumAction(
    this.sideBar$, JadiceIcon.DEFAULT_TEXTSEARCH, {
      translate: true, content: "jadiceWebViewerDist.sidebar.search"
    }, "advancedSearch");

  readonly TOGGLE_BOOKMARK_PANEL_ACTION = DefaultActions.Factories.makeEnumAction(
    this.sideBar$, JadiceIcon.BOOKMARK, {
      translate: true, content: "jadiceWebViewerDist.sidebar.bookmarks"
    }, "bookmarks");

  readonly TOGGLE_ATTACHMENT_ACTION = DefaultActions.Factories.makeEnumAction(
    this.sideBar$, JadiceIcon.EDITOR_COPY, {
      translate: true, content: "jadiceWebViewerDist.sidebar.attachments"
    }, "attachments");

  readonly TOGGLE_DOCS_PANEL_ACTION = DefaultActions.Factories.makeEnumAction(
    this.sideBar$, JadiceIcon.DEFAULT_DOCUMENT, {
      translate: true, content: "jadiceWebViewerDist.sidebar.documents"
    }, "docs");

  // Default right toolbar configuration with all available actions
  readonly DEFAULT_RIGHT_TOOLBAR_CONFIG: ToolbarConfig<Viewer> = {
    alignment: Alignment.VERTICAL,
    actions: [
      ToolbarUtils.makeButton(this.TOGGLE_ADVANCED_SEARCH_ACTION),
      ToolbarUtils.makeButton(this.TOGGLE_ANNO_PANEL_ACTION),
      ToolbarUtils.makeButton(this.TOGGLE_BOOKMARK_PANEL_ACTION),
      ToolbarUtils.makeButton(this.TOGGLE_ATTACHMENT_ACTION)
    ],
    auxiliaryActions: [],
    menu: {
      display: false,
      menuConfiguration: {
        menuItems: []
      }
    }
  };

  // use the default config until we have the anno profile data.
  // Then in ngAfterViewInit, replace the default config so we can add our custom redacted pdf export.
  TOOLBAR_CONFIG: ToolbarConfig<Viewer> = DefaultToolbar.CONFIG;

  @ViewChild("viewerComponent", {static: true})
  viewerComponent!: MultiModeViewerComponent;

  @ViewChild("thumbnailPanelComponent")
  thumbnailPanelComponent!: ThumbnailPanelComponent;

  @ViewChild("uploadDialogsWrapper")
  uploadDialogsWrapper!: UploadDialogsWrapperComponent;

  passwordRequiredSource: DocumentSource | null = null;

  readonly showThumbnails$ = new BehaviorSubject<boolean>(true);

  // Initialize with default configuration
  rightToolbarConfig: ToolbarConfig<Viewer> = this.DEFAULT_RIGHT_TOOLBAR_CONFIG;

  readonly TOGGLE_THUMBNAILS_ACTION: Action<Viewer> = DefaultActions.Factories.makeToggleAction(
    this.showThumbnails$, JadiceIcon.PAGE_VIEW_LEFT,
    {content: "actions.toggleThumbnails", translate: true}
  );

  readonly TOGGLE_THUMBNAILS_BUTTON: ButtonConfig<Viewer> = {
    type: ButtonType.SINGLE_ACTION,
    action: this.TOGGLE_THUMBNAILS_ACTION
  };

  readonly SWITCH_MODE_ACTION: Action<Viewer> = {
    icon: JadiceIcon.DEFAULT_READER_MODE,
    label: {content: "actions.accessibleMode", translate: true},
    isActive$: () => this.mode$.pipe(map(mode => mode === ViewerType.ACCESSIBLE)),
    handle: () => this.toggleMultiModeViewer()
  };

  source: Nullable<DocumentSource | any> = {
    uris: ["http://localhost:3000/PDFUA.pdf"],
    annotationUrisList: [["http://localhost:3000/test101.xml"]],
    password: null
  };

  displayOpenFile: boolean = true;

  annotations$ = new BehaviorSubject<DocumentAnnotations>([]);
  annotationProfile$ = new BehaviorSubject<Nullable<AnnotationProfile>>(null);

  attachmentSource: DocumentSource | any = {
    uri: "",
    password: null
  };

  constructor(private i18n: I18NService) {
    i18n.init();
    // Initialize the right toolbar with the current configuration
    this.configureRightToolbar({});
  }

  ngAfterViewInit(): void {
    this.annotationProfile$.pipe().forEach(profile => {
      if (profile) {
        let typesNotToRenderOnExport = profile.types
          .filter(profile => !profile.name.endsWith("Mask"))
          .map(profile => profile.name);

        const exportActions = [];
        // Configure various export options
        exportActions.push(DefaultActions.EXPORT_PDF);
        exportActions.push(this.createRedactedButton(typesNotToRenderOnExport));
        exportActions.push(DefaultActions.EXPORT_PDF_A);
        exportActions.push(DefaultActions.EXPORT_TIFF);
        exportActions.push(DefaultActions.PRINT);

        const actionGroup = {
          icon: JadiceIcon.EXPORT_PDF,
          label: TRANSLATE_ACTION_GROUP("export"),
          actions: exportActions
        };

        let exportAction = ToolbarUtils.makeSelection(actionGroup);
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
                      isEnabled$: (): Observable<boolean> => {
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
            actions: [
              ...((DefaultToolbar.CONFIG.actions as any).slice(0, -1)),
              exportAction
            ],
            auxiliaryActions: [
              ...(DefaultToolbar.CONFIG.auxiliaryActions as any),
              ToolbarUtils.makeButton(this.SWITCH_MODE_ACTION)
            ]
          }
      }
    });
    this.setupAnnotations();
  }

  /**
   * Dynamically configures the right toolbar based on the provided configuration.
   * This method allows enabling/disabling individual sidebar panels.
   *
   * @param config Configuration object specifying which panels should be enabled
   */
  configureRightToolbar(config: {
    annotationPanel?: boolean,
    advancedSearch?: boolean,
    bookmarkPanel?: boolean,
    attachmentPanel?: boolean,
    documentSelectionPanel?: boolean
  }): void {
    const actions: ToolbarAction<Viewer>[] = [];
    // Merge the provided config with the current configuration
    this.rightToolbarActionConfig = {...this.rightToolbarActionConfig, ...config};
    actions.push(ToolbarUtils.makeButton(this.TOGGLE_ADVANCED_SEARCH_ACTION));
    actions.push(ToolbarUtils.makeButton(this.TOGGLE_ANNO_PANEL_ACTION));
    // If annotations are enabled, set it as the default sidebar
    if (!this.sideBar$.value) {
      this.sideBar$.next("anno");
    }
    actions.push(ToolbarUtils.makeButton(this.TOGGLE_BOOKMARK_PANEL_ACTION));
    actions.push(ToolbarUtils.makeButton(this.TOGGLE_ATTACHMENT_ACTION));
    // Update the right toolbar configuration
    this.rightToolbarConfig = {
      ...this.DEFAULT_RIGHT_TOOLBAR_CONFIG,
      actions: actions
    };
  }

  createRedactedButton(skippedTypesOnRendering: string[]) {
    let redactedButton: Action<Viewer> = {
      icon: JadiceIcon.EXPORT_PDF,
      label: TRANSLATE_ACTION("exportRedactedPDF"),
      isEnabled$: (params$: NObservable<Viewer>) => AsyncUtils.makeCombinedViewerAndDocumentStream(params$).pipe(map(({document: doc}) => !!doc)),
      handle(viewer) {
        const document = viewer?.getTransferableDocument();
        if (!document) {
          return;
        }

        const docDto = document.toSnapshot().toDTO();

        const dto: ExportConfiguration = {
          document: docDto,
          type: ExportType.PDF_REDACT,
          downloadPurpose: DownloadPurpose.SAVE,
          disabledAnnoTypes: skippedTypesOnRendering
        };
        Export.download(dto); // async.
      },
    };
    return redactedButton;
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
    fromEvent(window, "resize").subscribe(() => {
      this.updateResponsiveBehaviors();
    });
    this.updateResponsiveBehaviors();
    merge(this.showThumbnails$, this.sideBar$).subscribe(() => this.viewerComponent?.recalculateSize());
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

  private updateResponsiveBehaviors() {
    this.showThumbnails$.next(this.hasEnoughSpaceForThumbnailView(4));
    if (!this.hasEnoughSpaceForThumbnailView(3.5))
      this.sideBar$.next(null)
  }

  private hasEnoughSpaceForThumbnailView(value: number): boolean {
    return window.innerWidth > value * 250;
  }

  toggleMultiModeViewer() {
    if (this.mode$.getValue() === ViewerType.RENDERED_GWT) {
      this.mode$.next(ViewerType.ACCESSIBLE);
    } else {
      this.mode$.next(ViewerType.RENDERED_GWT);
    }
  }

  // Example methods to demonstrate how to use the dynamic configuration

  /**
   * Enable only annotation and search panels
   */
  enableBasicMode() {
    this.configureRightToolbar({
      annotationPanel: true,
      advancedSearch: true,
      bookmarkPanel: false,
      attachmentPanel: false,
      documentSelectionPanel: false
    });
  }

  /**
   * Enable all available panels
   */
  enableFullMode() {
    this.configureRightToolbar({
      annotationPanel: true,
      advancedSearch: true,
      bookmarkPanel: true,
      attachmentPanel: true,
      documentSelectionPanel: true
    });
  }

  /**
   * Disable all sidebar panels
   */
  enableMinimalMode() {
    this.configureRightToolbar({
      annotationPanel: false,
      advancedSearch: false,
      bookmarkPanel: false,
      attachmentPanel: false,
      documentSelectionPanel: false
    });
  }

  async handleAttachmentClick(attachment: any) {
    this.logger.debug("Received attachment outer", attachment);
    this.displayAttachment = true;
    await this.openAttachment(attachment.file.id, attachment.file.name);
  }

  async openAttachment(attachmentId: string, attachmentName: string) {
    const sourceAny = this.source as any;
    const attachmentUri = sourceAny.uri ? sourceAny.uri: sourceAny.uris[0];
    this.logger.debug("Opening attachmentSource=" + attachmentUri + "?attachment=" + attachmentId);
    this.attachmentSource = {
      uri: attachmentUri + "?attachment=" + attachmentId,
      password: null
    };
    this.attachmentId = attachmentId;
    this.attachmentName = attachmentName;
  }
}
