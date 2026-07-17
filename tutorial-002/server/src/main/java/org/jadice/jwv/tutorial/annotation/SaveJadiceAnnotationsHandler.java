package org.jadice.jwv.tutorial.annotation;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.Authenticator;
import java.net.PasswordAuthentication;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

import org.jadice.util.log.Logger;
import org.jadice.util.log.LoggerFactory;
import org.springframework.stereotype.Component;

import com.levigo.jadice.document.Document;
import com.levigo.jadice.document.JadiceException;
import com.levigo.jadice.document.write.DefaultWriterControls;
import com.levigo.jadice.document.write.FormatWriter;
import com.levigo.jadice.format.annotation.JadiceAnnotationWriter;
import com.levigo.jadice.web.server.annotation.save.SaveAnnotationsHandler;
import com.levigo.jadice.web.server.annotation.save.SaveAnnotationsRequestDTO;
import com.levigo.jadice.web.server.annotation.save.SaveAnnotationsResponseDTO;

/**
 * Handler implementation for saving Jadice annotations through HTTP POST requests.
 */
@Component
public class SaveJadiceAnnotationsHandler implements SaveAnnotationsHandler {
    private static final Logger LOGGER = LoggerFactory.getLogger(SaveJadiceAnnotationsHandler.class);

    private final AnnotationSaveConfiguration annotationSaveConfiguration;

    public SaveJadiceAnnotationsHandler(final AnnotationSaveConfiguration annotationSaveConfiguration) {
        this.annotationSaveConfiguration = annotationSaveConfiguration;
    }

    @Override
    public SaveAnnotationsResponseDTO run(final Document document, final SaveAnnotationsRequestDTO dto) throws IOException, JadiceException {
        try {
            // The stream id comes from the client; validate it before it forms a storage URL/header.
            final String streamId = sanitizeStreamId(dto.getSaveStreamId());

            // Store the annotations.
            final ByteArrayOutputStream annotationData = new ByteArrayOutputStream();
            final DefaultWriterControls controls = new DefaultWriterControls();
            final FormatWriter writer = new JadiceAnnotationWriter();
            writer.write(document, annotationData, controls);
            postToStorage(buildSaveUrl(streamId), annotationData.toByteArray(), streamId, "application/octet-stream");

            // Store the render controls the client attached (via getTransferableDocument) as the
            // "serializedRenderControls" property, into the companion file the loader reads back.
            final Object serializedRenderControls = document.getProperties().get("serializedRenderControls");
            if (serializedRenderControls instanceof String renderControls && !renderControls.isBlank()) {
                final String renderControlsStreamId = toRenderControlsStreamId(streamId);
                postToStorage(buildSaveUrl(renderControlsStreamId),
                        renderControls.getBytes(StandardCharsets.UTF_8), renderControlsStreamId, "application/json");
            }

            return new SaveAnnotationsResponseDTO();
        } catch (final URISyntaxException | InterruptedException e) {
            LOGGER.error(getClass() + ": error saving annotation", e);
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new IOException("Error saving annotation: " + e.getMessage(), e);
        }
    }

    /**
     * POSTs raw bytes to the storage server, applying the configured authentication. Used for both
     * the annotation stream and the render-controls JSON.
     */
    private void postToStorage(final String saveUrl, final byte[] data, final String filename, final String contentType)
            throws IOException, InterruptedException, URISyntaxException {
        if (LOGGER.isDebugEnabled()) {
            LOGGER.debug(getClass() + ": sending " + filename + " to " + saveUrl);
        }

        final URI uri = buildURI(saveUrl);
        final HttpClient.Builder clientBuilder = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(annotationSaveConfiguration.getConnectTimeout()));
        final HttpRequest.Builder requestBuilder = HttpRequest.newBuilder(uri)
                .timeout(Duration.ofSeconds(annotationSaveConfiguration.getRequestTimeout()))
                .version(HttpClient.Version.HTTP_1_1)
                .header("Content-Type", contentType);

        configureAuthentication(clientBuilder, requestBuilder);

        final HttpRequest request = requestBuilder
                .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                .POST(HttpRequest.BodyPublishers.ofByteArray(data))
                .build();

        final HttpClient httpClient = clientBuilder.build();
        final HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() >= 200 && response.statusCode() < 300) {
            if (LOGGER.isDebugEnabled()) {
                LOGGER.debug(getClass() + ": successfully sent " + filename + " to " + saveUrl);
            }
        } else {
            final String errorMessage = "Failed to save " + filename + ": HTTP " + response.statusCode() + " - " + response.body();
            LOGGER.error(getClass() + ": " + errorMessage);
            throw new IOException(errorMessage);
        }
    }

    private String buildSaveUrl(final String saveStreamId) {
        return annotationSaveConfiguration.getBaseUrl() + "/" + saveStreamId;
    }

    /**
     * Validates the client-supplied stream id before it is used to build the storage URL and the
     * Content-Disposition header. Rejects anything outside a conservative allowlist, so path
     * separators, {@code ..}, quotes or CR/LF cannot cause path traversal or header injection.
     */
    private String sanitizeStreamId(final String saveStreamId) {
        if (saveStreamId == null || !saveStreamId.matches("[A-Za-z0-9._-]+")) {
            throw new IllegalArgumentException("Illegal saveStreamId: " + saveStreamId);
        }
        return saveStreamId;
    }

    /**
     * Derives the render-controls file name from the annotation stream id, e.g.
     * {@code test93.xml} to {@code test93.rendercontrols.json}. This keeps the saved render controls
     * next to the annotations and matches the {@code render-controls.load.uri} the server reads on
     * load.
     */
    private String toRenderControlsStreamId(final String saveStreamId) {
        final int dot = saveStreamId.lastIndexOf('.');
        final String base = dot > 0 ? saveStreamId.substring(0, dot) : saveStreamId;
        return base + ".rendercontrols.json";
    }

    private URI buildURI(final String urlString) throws URISyntaxException {
        return new URI(urlString);
    }

    private void configureAuthentication(final HttpClient.Builder clientBuilder, final HttpRequest.Builder requestBuilder) {
        if (annotationSaveConfiguration.getAuthentication() != null) {
            if (annotationSaveConfiguration.getAuthentication().getToken() != null) {
                requestBuilder.header("Authorization", annotationSaveConfiguration.getAuthentication().getToken());
            } else if (annotationSaveConfiguration.getAuthentication().getUsername() != null &&
                    annotationSaveConfiguration.getAuthentication().getPassword() != null) {
                clientBuilder.authenticator(new Authenticator() {
                    @Override
                    protected PasswordAuthentication getPasswordAuthentication() {
                        return new PasswordAuthentication(
                                annotationSaveConfiguration.getAuthentication().getUsername(),
                                annotationSaveConfiguration.getAuthentication().getPassword().toCharArray()
                        );
                    }
                });
            }
        }
    }
}
