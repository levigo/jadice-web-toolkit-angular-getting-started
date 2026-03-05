/**
 * <pre>
 * Copyright (c), levigo holding gmbh.
 *
 * This file is subject to the terms and conditions defined in
 * file 'LICENSE.txt', which is part of this source code package.
 * </pre>
 */
package org.jadice.jwv.tutorial;

import java.io.IOException;
import java.io.InputStream;

import org.springframework.stereotype.Component;

import com.levigo.jadice.document.io.MemoryInputStream;
import com.levigo.jadice.document.io.SeekableInputStream;
import com.levigo.jadice.web.server.annotation.AnnotationImageProvider;

@Component
public class AnnoImageProvider implements AnnotationImageProvider {
    @Override
    public SeekableInputStream provideAnnotationImage(String annotationImageID) throws IOException {
        InputStream is = switch (annotationImageID) {
            case "signatureAnnoImage" ->
                    Thread.currentThread().getContextClassLoader().getResourceAsStream("signature_kl_opaque_dotted.png");
            case "qrJWTAnnoImage" ->
                    Thread.currentThread().getContextClassLoader().getResourceAsStream("qr_jwt.png");
            case "qrJadiceAnnoImage" ->
                    Thread.currentThread().getContextClassLoader().getResourceAsStream("qr_jadice.png");
            default -> null;
        };

        if (null == is)
            throw new IOException("Couldn't find/load image for id \"" + annotationImageID + "\"");

        return new MemoryInputStream(is);
    }
}
