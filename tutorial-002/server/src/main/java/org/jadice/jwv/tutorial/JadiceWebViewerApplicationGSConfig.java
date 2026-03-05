package org.jadice.jwv.tutorial;

import java.util.Arrays;

import jakarta.annotation.PostConstruct;

import org.jadice.jwv.tutorial.annotation.SaveJadiceAnnotationsHandler;
import org.springframework.stereotype.Component;

import com.jadice.web.export.server.ExportHelper;
import com.levigo.jadice.web.server.internal.AnnotationService;

/**
 * Configuration class for the Jadice Web Viewer application.
 * <p>
 * This class is responsible for setting up and configuring the Jadice Web Viewer
 * application after the Spring context has been initialized. For instance, it registers handlers
 * for saving annotations and configures redaction types.
 * </p>
 */
@Component
public class JadiceWebViewerApplicationGSConfig {
    private final AnnotationService annotationService;
    private final SaveJadiceAnnotationsHandler saveJadiceAnnotationsHandler;

    public JadiceWebViewerApplicationGSConfig(final AnnotationService annotationService,
                                              final SaveJadiceAnnotationsHandler saveJadiceAnnotationsHandler) {
        this.annotationService = annotationService;
        this.saveJadiceAnnotationsHandler = saveJadiceAnnotationsHandler;
    }

    /**
     * Initializes the Jadice Web Viewer application configuration after the Spring context
     * has been fully initialized.
     * <p>
     * This method performs the following configuration tasks:
     * <ul>
     *   <li>Registers the {@link SaveJadiceAnnotationsHandler} for saving annotations</li>
     *   <li>Configures supported redaction types</li>
     * </ul>
     * </p>
     */
    @PostConstruct
    public void postConstruct() {
        annotationService.registerSaveAnnotationsHandler(saveJadiceAnnotationsHandler, "SaveJadiceAnnotationsHandler");
        ExportHelper.setRedactionTypes(Arrays.asList("Mask", "TextMask"));
    }
}
