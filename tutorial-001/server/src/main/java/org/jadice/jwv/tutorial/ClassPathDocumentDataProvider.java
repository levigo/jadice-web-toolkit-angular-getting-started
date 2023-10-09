package org.jadice.jwv.tutorial;

import java.io.IOException;
import java.io.InputStream;

import org.jetbrains.annotations.NotNull;
import org.springframework.stereotype.Component;

import com.levigo.jadice.document.JadiceException;
import com.levigo.jadice.document.read.Reader;
import com.levigo.jadice.format.pdf.crypt.standard.PDFStandardSecurityHandlerSettings;
import com.levigo.jadice.format.pdf.crypt.standard.PasswordMaterial;
import com.levigo.jadice.web.server.UriBasedDocumentDataProvider;
import com.levigo.jadice.web.server.UriScheme;
import com.levigo.jadice.web.shared.UriHandle;
import com.levigo.jadice.web.shared.UriSource;
import com.levigo.jadice.web.shared.service.exceptions.RecoverFailedException;

@Component
@UriScheme({"classpath"})
public class ClassPathDocumentDataProvider implements UriBasedDocumentDataProvider {

    @Override
    public void read(Reader reader, UriSource source) throws JadiceException, IOException {
        final String uri = getUri(source.getPassword(), reader, source.getUris().get(0));
        final InputStream documentStream = get(uri);
        reader.read(documentStream);
    }

    @Override
    public void recover(Reader reader, UriHandle handle) throws RecoverFailedException, JadiceException {
        final String uri = getUri(handle.getPassword(), reader, handle.getUris().get(0));

        try {
            final InputStream documentStream = get(uri);
            reader.read(documentStream);
        } catch (IOException e) {
            throw new RecoverFailedException("Can't recover " + handle, e);
        }
    }

    @NotNull
    private static String getUri(String password, Reader reader, String classPathSubString) {
        if (password != null) {
            PDFStandardSecurityHandlerSettings settings = reader.getSettings(PDFStandardSecurityHandlerSettings.class);
            settings.setCryptoMaterialProvider(receiver -> receiver.receive(new PasswordMaterial(password)));
        }

        return classPathSubString.substring("classpath:".length());
    }

    protected InputStream get(final String resource) throws IOException {
        // Attention: This is not safe. Depending on the security manager configuration in the JVM
        // this code might load any resource on the system. This code is just for demonstration
        // purposes and does not yield a secure way of handling input.
        // See https://docs.oracle.com/javase/8/docs/technotes/guides/lang/resources.html#security
        // and
        // https://docs.oracle.com/javase/tutorial/essential/environment/security.html form more
        // information.
        InputStream in = getClass().getResourceAsStream("/documents/" + resource);
        if (in == null) {
            in = getClass().getClassLoader().getResourceAsStream("/documents/" + resource);
            if (in == null)
                throw new IOException("Cant find Resource on Classpath: " + resource);
        }
        return in;
    }
}
