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
            final ByteArrayOutputStream annotationData = new ByteArrayOutputStream();
            final DefaultWriterControls controls = new DefaultWriterControls();
            final FormatWriter writer = new JadiceAnnotationWriter();
            writer.write(document, annotationData, controls);

            final String saveUrl = buildSaveUrl(dto.getSaveStreamId());
            if (LOGGER.isDebugEnabled()) {
                LOGGER.debug(getClass() + ": sending annotation file to " + saveUrl);
            }

            final URI uri = buildURI(saveUrl);
            final HttpClient.Builder clientBuilder = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(annotationSaveConfiguration.getConnectTimeout()));
            final HttpRequest.Builder requestBuilder = HttpRequest.newBuilder(uri)
                    .timeout(Duration.ofSeconds(annotationSaveConfiguration.getRequestTimeout()))
                    .version(HttpClient.Version.HTTP_1_1)
                    .header("Content-Type", "application/octet-stream");

            configureAuthentication(clientBuilder, requestBuilder);

            final HttpRequest request = requestBuilder
                    .header("Content-Disposition", "attachment; filename=\"" + dto.getSaveStreamId() + "\"")
                    .POST(HttpRequest.BodyPublishers.ofByteArray(annotationData.toByteArray()))
                    .build();

            final HttpClient httpClient = clientBuilder.build();
            final HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                if (LOGGER.isDebugEnabled()) {
                    LOGGER.debug(getClass() + ": successfully sent annotation to " + saveUrl);
                }
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
        return annotationSaveConfiguration.getBaseUrl() + "/" + saveStreamId;
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
