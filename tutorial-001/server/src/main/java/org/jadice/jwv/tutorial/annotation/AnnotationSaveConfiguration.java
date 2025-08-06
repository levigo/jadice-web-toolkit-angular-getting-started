package org.jadice.jwv.tutorial.annotation;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

/**
 * Configuration properties for annotation saving functionality.
 * <p>
 * This class defines properties that can be configured in application properties or YAML files
 * with the prefix "annotation.save". It provides configuration for the HTTP endpoint, connection
 * parameters, and authentication details used when saving annotations to a remote server.
 * </p>
 * <p>Example YAML configuration:</p>
 * <pre>
 * annotation:
 *   save:
 *     base-url: http://localhost:8081
 *     connect-timeout: 30
 *     request-timeout: 30
 *     authentication:
 *       username: user
 *       password: pass
 * </pre>
 */
@Setter
@Getter
@Configuration
@ToString
@ConfigurationProperties(prefix = "annotation.save")
public class AnnotationSaveConfiguration {
    private String baseUrl;
    private int connectTimeout = 30;
    private int requestTimeout = 30;
    private AuthenticationConfig authentication;
    @Setter
    @Getter
    public static class AuthenticationConfig {
        private String username;
        private String password;
        private String token;
    }
}
