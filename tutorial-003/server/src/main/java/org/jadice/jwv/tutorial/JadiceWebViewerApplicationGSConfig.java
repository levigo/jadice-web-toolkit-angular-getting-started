package org.jadice.jwv.tutorial;

import java.util.Arrays;

import jakarta.annotation.PostConstruct;

import org.springframework.stereotype.Component;

import com.jadice.web.export.server.ExportHelper;

/**
 * Tutorial-specific bootstrap configuration.
 */
@Component
public class JadiceWebViewerApplicationGSConfig {

    @PostConstruct
    public void postConstruct() {
        ExportHelper.setRedactionTypes(Arrays.asList("Mask", "TextMask"));
    }
}
