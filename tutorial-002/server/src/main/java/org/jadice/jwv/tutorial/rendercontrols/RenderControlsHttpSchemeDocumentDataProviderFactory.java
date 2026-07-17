package org.jadice.jwv.tutorial.rendercontrols;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.levigo.jadice.web.nextgen.server.dataprovider.HttpSchemeDocumentDataProviderConfiguration;
import com.levigo.jadice.web.server.ContextualFactory;
import com.levigo.jadice.web.server.InvocationContext;
import com.levigo.jadice.web.server.UriScheme;
import com.levigo.jadice.web.server.file.FileRepository;
import com.levigo.jadice.web.transport.server.TransportInvocationContext;

import jakarta.servlet.http.HttpSession;

/**
 * Factory that registers {@link RenderControlsHttpSchemeDocumentDataProvider} for the {@code http}
 * and {@code https} schemes, replacing the built-in {@code HttpSchemeDocumentDataProvider}.
 * <p>
 * The built-in provider is suppressed via {@code webtoolkit.uriProviderHttpEnabled: false} in
 * {@code application.yml} (that flag only gates the built-in factory), so this factory becomes the
 * single provider for the HTTP schemes. It mirrors the built-in factory's wiring (HTTP config,
 * optional upload repository, temp folder) and additionally passes the render-controls settings.
 * </p>
 */
@Component
@UriScheme({"http", "https"})
public class RenderControlsHttpSchemeDocumentDataProviderFactory
        implements ContextualFactory<RenderControlsHttpSchemeDocumentDataProvider> {

    private final HttpSchemeDocumentDataProviderConfiguration httpConfiguration;
    private final RenderControlsLoadConfiguration renderControlsLoadConfiguration;
    private FileRepository repository;
    private String tempFolderPath;

    public RenderControlsHttpSchemeDocumentDataProviderFactory(
            final HttpSchemeDocumentDataProviderConfiguration httpConfiguration,
            final RenderControlsLoadConfiguration renderControlsLoadConfiguration) {
        this.httpConfiguration = httpConfiguration;
        this.renderControlsLoadConfiguration = renderControlsLoadConfiguration;
    }

    @Autowired(required = false)
    public void setFileRepository(@Qualifier("uploadRepository") final FileRepository repository) {
        this.repository = repository;
    }

    @Value("${webtoolkit.upload.tempFolderPath:#{null}}")
    public void setTempFolderPath(final String tempFolderPath) {
        this.tempFolderPath = tempFolderPath;
    }

    @Override
    public RenderControlsHttpSchemeDocumentDataProvider create(final InvocationContext context) {
        HttpSession session = null;
        if (context instanceof TransportInvocationContext transportInvocationContext) {
            session = transportInvocationContext.getSession();
        }
        return new RenderControlsHttpSchemeDocumentDataProvider(context, session, httpConfiguration, repository,
                tempFolderPath, renderControlsLoadConfiguration.isEnabled(), renderControlsLoadConfiguration.getUri());
    }
}
