package org.jadice.jwv.tutorial;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.context.annotation.Import;

import com.levigo.jadice.web.server.spring.JWTSpringConfiguration;
import com.levigo.jadice.web.server.spring.SpringPropertiesServerConfiguration;
import com.levigo.jadice.web.server.spring.autoconfig.JWTSpringComponentScan;


@SpringBootApplication
@Import({JWTSpringConfiguration.class, SpringPropertiesServerConfiguration.class, JWTSpringComponentScan.class})
public class JadiceWebViewerApplication001 {
    public static void main(String[] args) {
        SpringApplication.run(JadiceWebViewerApplication001.class, args);
    }
}
