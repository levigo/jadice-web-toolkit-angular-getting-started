package org.jadice.jwv.tutorial.rendercontrols;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import org.jadice.util.log.Logger;
import org.jadice.util.log.LoggerFactory;

import com.levigo.jadice.document.JadiceException;
import com.levigo.jadice.document.read.Reader;
import com.levigo.jadice.web.nextgen.server.dataprovider.HttpSchemeDocumentDataProvider;
import com.levigo.jadice.web.nextgen.server.dataprovider.HttpSchemeDocumentDataProviderConfiguration;
import com.levigo.jadice.web.server.InvocationContext;
import com.levigo.jadice.web.server.UriScheme;
import com.levigo.jadice.web.server.file.FileRepository;
import com.levigo.jadice.web.server.rendercontrols.RenderControlsUtils;
import com.levigo.jadice.web.shared.UriSource;

import jakarta.servlet.http.HttpSession;

/**
 * A {@link HttpSchemeDocumentDataProvider} that additionally restores render controls (rotation,
 * gradation curve, ...) when a document is loaded over the {@code http}/{@code https} scheme.
 * <p>
 * Before the document is read, it fetches the render-controls JSON from a configured URL and
 * attaches it to the document via
 * {@link RenderControlsUtils#attach(com.levigo.jadice.document.Document, String)}. The jadice web
 * toolkit client reads the attached {@code serializedRenderControls} property when the document is
 * installed into the viewer and applies the stored settings. This mirrors the reference example
 * {@code com.levigo.jadice.web.demo.common.server.dataprovider.ClassPathWithRenderControlsDocumentDataProvider}.
 * </p>
 * <p>
 * A missing or unreadable render-controls file never breaks document loading; it is simply skipped.
 * The JSON is fetched through the inherited, authentication-aware HTTP client, so the storage
 * server credentials configured under {@code webtoolkit.ddp.http.authentication} are reused.
 * </p>
 */
@UriScheme({"http", "https"})
public class RenderControlsHttpSchemeDocumentDataProvider extends HttpSchemeDocumentDataProvider {

    private static final Logger LOGGER = LoggerFactory.getLogger(RenderControlsHttpSchemeDocumentDataProvider.class);

    private final boolean renderControlsEnabled;
    private final String renderControlsUri;

    public RenderControlsHttpSchemeDocumentDataProvider(final InvocationContext context, final HttpSession session,
            final HttpSchemeDocumentDataProviderConfiguration configuration, final FileRepository repository,
            final String tempFolderPath, final boolean renderControlsEnabled, final String renderControlsUri) {
        super(context, session, configuration, repository, tempFolderPath);
        this.renderControlsEnabled = renderControlsEnabled;
        this.renderControlsUri = renderControlsUri;
    }

    @Override
    public void read(final Reader reader, final UriSource source) throws JadiceException, IOException {
        // MANDATORY: attach the render controls before the super implementation reads the document,
        // otherwise the client will not have them available when the document is installed.
        attachRenderControls(reader);
        super.read(reader, source);
    }

    private void attachRenderControls(final Reader reader) {
        if (!renderControlsEnabled || renderControlsUri == null || renderControlsUri.isBlank() || reader == null
                || reader.getDocument() == null) {
            return;
        }
        try {
            final String json = fetchRenderControlsJson(renderControlsUri);
            if (json != null && !json.isBlank()) {
                RenderControlsUtils.attach(reader.getDocument(), json);
                if (LOGGER.isDebugEnabled()) {
                    LOGGER.debug(getClass() + ": attached render controls from " + renderControlsUri);
                }
            }
        } catch (final Exception e) {
            // A missing (e.g. HTTP 404 before the first save) or unreadable render-controls file
            // must not break document loading.
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            LOGGER.info(getClass() + ": no render controls attached from " + renderControlsUri + " (" + e.getMessage() + ")");
        }
    }

    private String fetchRenderControlsJson(final String url) throws IOException, InterruptedException {
        // getResourceStream(...) is inherited from HttpSchemeDocumentDataProvider and applies the
        // configured authentication (webtoolkit.ddp.http.authentication) for the target host.
        try (final InputStream in = getResourceStream(url)) {
            if (in == null) {
                return null;
            }
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
