package org.jadice.jwv.tutorial;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Getter;
import lombok.Setter;

/**
 * Configuration properties for Cross-Origin Resource Sharing (CORS) settings.
 * <p>
 * This class defines properties that can be configured in application properties or YAML files
 * with the prefix "cors". It provides default values for all CORS-related settings that control
 * how the application handles cross-origin requests from web browsers.
 * </p>
 */
@Setter
@Getter
@Configuration
@ConfigurationProperties(prefix = "cors")
public class CorsProperties {
    /**
     * List of allowed origin patterns for CORS requests.
     * <p>
     * These patterns determine which origins are allowed to access resources from this server.
     * The default value "*" allows access from any origin.
     * </p>
     */
    private List<String> allowedOriginPatterns = List.of("*");

    /**
     * List of allowed headers in CORS requests.
     * <p>
     * Specifies which HTTP headers can be used during the actual request.
     * The default value "*" allows all headers.
     * </p>
     */
    private List<String> allowedHeaders = List.of("*");

    /**
     * List of HTTP methods allowed for CORS requests.
     * <p>
     * Determines which HTTP methods (GET, POST, etc.) are allowed when accessing resources.
     * The default value "*" allows all methods.
     * </p>
     */
    private List<String> allowedMethods = List.of("*");

    /**
     * List of HTTP headers exposed to the browser in CORS responses.
     * <p>
     * These headers are made accessible to the browser's JavaScript code.
     * By default, only "content-length" is exposed.
     * </p>
     */
    private List<String> exposedHeaders = List.of("content-length");

    /**
     * Whether cookies and authorization headers are allowed in CORS requests.
     * <p>
     * When set to true, allows credentials like cookies, authorization headers or TLS client
     * certificates to be included in CORS requests. Default is true.
     * </p>
     */
    private Boolean allowCredentials = true;

    /**
     * Maximum time in seconds that the results of a preflight request can be cached.
     * <p>
     * This setting determines how long the browser should cache the preflight response.
     * The default value is 3600 seconds (1 hour).
     * </p>
     */
    private Long maxAge = 3600L;
}
