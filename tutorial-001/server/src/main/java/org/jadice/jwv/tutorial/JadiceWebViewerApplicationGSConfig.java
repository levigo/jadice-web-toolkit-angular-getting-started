package org.jadice.jwv.tutorial;

import java.util.Arrays;
import java.util.HashMap;

import javax.annotation.PostConstruct;

import org.jadice.jwv.tutorial.annotation.AnnotationSaveConfiguration;
import org.jadice.jwv.tutorial.annotation.SaveJadiceAnnotationsHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.jadice.web.export.server.ExportHelper;
import com.levigo.jadice.web.server.annotation.save.SaveAnnotationsHandler;
import com.levigo.jadice.web.server.config.ConfigurationManager;
import com.levigo.jadice.web.server.config.ServerConfiguration;

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

    @Autowired
    private AnnotationSaveConfiguration annotationSaveConfiguration;

    /**
     * Initializes the Jadice Web Viewer application configuration after the Spring context
     * has been fully initialized.
     * <p>
     * This method performs the following configuration tasks:
     * <ul>
     *   <li>Retrieves the server configuration</li>
     *   <li>Registers the {@link SaveJadiceAnnotationsHandler} for saving annotations</li>
     *   <li>Configures supported redaction types</li>
     * </ul>
     * </p>
     */
    @PostConstruct
    public void postConstruct() {
        final ServerConfiguration serverConfiguration = ConfigurationManager.getServerConfiguration();
        final HashMap<String, SaveAnnotationsHandler> saveAnnotationsHandlerHashMap = new HashMap<>();
        final SaveJadiceAnnotationsHandler saveJadiceAnnotationsHandler = new SaveJadiceAnnotationsHandler();
        saveJadiceAnnotationsHandler.setAnnotationSaveConfiguration(annotationSaveConfiguration);
        saveAnnotationsHandlerHashMap.put("SaveJadiceAnnotationsHandler", saveJadiceAnnotationsHandler);
        serverConfiguration.setSaveAnnotationHandlers(saveAnnotationsHandlerHashMap);
        ExportHelper.setRedactionTypes(Arrays.asList("Mask", "TextMask"));
    }
}
