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
 * <p>
 * This component implements the {@link SaveAnnotationsHandler} interface to handle
 * annotation save requests. It converts the annotations to a binary format and sends them
 * to a remote HTTP server using Java's HTTP client. The handler supports both Bearer token
 * and Basic authentication methods based on the configuration.
 * </p>
 */
@Component
public class SaveJadiceAnnotationsHandler implements SaveAnnotationsHandler {
    private static final Logger LOGGER = LoggerFactory.getLogger(SaveJadiceAnnotationsHandler.class);

    private AnnotationSaveConfiguration annotationSaveConfiguration;

    @Override
    public SaveAnnotationsResponseDTO run(final Document document, final SaveAnnotationsRequestDTO dto) throws IOException, JadiceException {
        try {
            // Write annotation to ByteArrayOutputStream
            final ByteArrayOutputStream annotationData = new ByteArrayOutputStream();
            final DefaultWriterControls controls = new DefaultWriterControls();
            final FormatWriter writer = new JadiceAnnotationWriter();
            writer.write(document, annotationData, controls);
            // Upload annotation data via HTTP POST
            final String saveUrl = buildSaveUrl(dto.getSaveStreamId());
            if (LOGGER.isDebugEnabled()) {
                LOGGER.debug(getClass() + ": sending annotation file to " + saveUrl);
            }
            // Build HTTP client and request
            final URI uri = buildURI(saveUrl);
            final HttpClient.Builder clientBuilder = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(annotationSaveConfiguration.getConnectTimeout()));
            final HttpRequest.Builder requestBuilder = HttpRequest.newBuilder(uri)
                    .timeout(Duration.ofSeconds(annotationSaveConfiguration.getRequestTimeout()))
                    .version(HttpClient.Version.HTTP_1_1)
                    .header("Content-Type", "application/octet-stream");
            // Add authentication if configured
            configureAuthentication(clientBuilder, requestBuilder);
            // Build POST request with annotation data
            final HttpRequest request = requestBuilder
                    .header("Content-Disposition", "attachment; filename=\"" + dto.getSaveStreamId() + "\"")
                    .POST(HttpRequest.BodyPublishers.ofByteArray(annotationData.toByteArray()))
                    .build();
            // Send request
            final HttpClient httpClient = clientBuilder.build();
            final HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            // Check response
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                if (LOGGER.isDebugEnabled()) {
                    LOGGER.debug(getClass() + ": successfully sent annotation to " + saveUrl);
                }
                // Create and return response DTO with success information
                return new SaveAnnotationsResponseDTO();
            } else {
                final String errorMessage = "Failed to save annotation: HTTP " + response.statusCode() + " - " + response.body();
                LOGGER.error(getClass() + ": " + errorMessage);
                throw new IOException(errorMessage);
            }
        } catch (final URISyntaxException | InterruptedException e) {
            LOGGER.error(getClass() + ": error saving annotation", e);
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new IOException("Error saving annotation: " + e.getMessage(), e);
        }
    }

    private String buildSaveUrl(final String saveStreamId) {
        return annotationSaveConfiguration.getBaseUrl() + "/" + saveStreamId + "?upload";
    }

    private URI buildURI(final String urlString) throws URISyntaxException {
        return new URI(urlString);
    }

    /**
     * Configures authentication for the HTTP request based on configuration settings.
     * <p>
     * Supports two authentication methods:
     * <ul>
     *   <li>Bearer Token: Adds an Authorization header with the token</li>
     *   <li>Basic Authentication: Sets up username/password authentication</li>
     * </ul>
     * </p>
     *
     * @param clientBuilder the HTTP client builder to configure
     * @param requestBuilder the HTTP request builder to configure
     */
    private void configureAuthentication(final HttpClient.Builder clientBuilder, final HttpRequest.Builder requestBuilder) {
        if (annotationSaveConfiguration.getAuthentication() != null) {
            if (annotationSaveConfiguration.getAuthentication().getToken() != null) {
                // Bearer Token authentication
                requestBuilder.header("Authorization", annotationSaveConfiguration.getAuthentication().getToken());
            } else if (annotationSaveConfiguration.getAuthentication().getUsername() != null &&
                    annotationSaveConfiguration.getAuthentication().getPassword() != null) {
                // Basic authentication
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

    public void setAnnotationSaveConfiguration(AnnotationSaveConfiguration annotationSaveConfiguration) {
        this.annotationSaveConfiguration = annotationSaveConfiguration;
    }
}
