package org.jadice.jwv.tutorial;

import java.util.Arrays;

import jakarta.annotation.PostConstruct;

import org.springframework.stereotype.Component;

import com.jadice.web.export.server.ExportHelper;

/**
 * Configuration class for the Jadice Web Viewer application.
 * <p>
 * This class is responsible for setting up and configuring the Jadice Web Viewer
 * application after the Spring context has been initialized. For instance, it configures
 * the supported redaction types for the export pipeline.
 * </p>
 * <p>
 * Since jadice web toolkit 7, a {@link com.levigo.jadice.web.server.annotation.save.SaveAnnotationsHandler}
 * implementation annotated with {@link Component} is auto-registered. Earlier versions required
 * an explicit {@code AnnotationService.registerSaveAnnotationsHandler(handler, id)} call here;
 * that call is no longer needed.
 * </p>
 */
@Component
public class JadiceWebViewerApplicationGSConfig {

    /**
     * Initializes the Jadice Web Viewer application configuration after the Spring context
     * has been fully initialized. Configures the supported redaction types.
     */
    @PostConstruct
    public void postConstruct() {
        ExportHelper.setRedactionTypes(Arrays.asList("Mask", "TextMask"));
    }
}
