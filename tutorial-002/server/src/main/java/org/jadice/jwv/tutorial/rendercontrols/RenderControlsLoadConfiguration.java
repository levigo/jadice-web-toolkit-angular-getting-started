package org.jadice.jwv.tutorial.rendercontrols;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

/**
 * Configuration ({@code render-controls.load} prefix) for restoring render controls (rotation,
 * gradation curve) when a document is loaded. The {@link #uri} JSON is fetched server-side and
 * attached to the document before it is read, so the client restores the settings on load.
 */
@Setter
@Getter
@Configuration
@ToString
@ConfigurationProperties(prefix = "render-controls.load")
public class RenderControlsLoadConfiguration {

    /** Whether stored render controls should be attached when loading a document. */
    private boolean enabled = true;

    /**
     * Absolute URL of the render-controls JSON on the storage server, e.g.
     * {@code http://localhost:3000/test93.rendercontrols.json}. Fetched with the credentials from
     * {@code webtoolkit.ddp.http.authentication}.
     */
    private String uri;
}
