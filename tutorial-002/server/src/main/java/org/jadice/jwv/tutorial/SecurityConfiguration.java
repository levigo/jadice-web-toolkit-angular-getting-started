package org.jadice.jwv.tutorial;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

/**
 * CORS configuration for the Jadice Web Viewer gs application.
 * <p>
 * This class configures Cross-Origin Resource Sharing (CORS) settings for the application
 * using properties defined in the application configuration files. It creates and registers
 * a CORS filter with the appropriate settings to control cross-origin requests.
 * </p>
 */
@Configuration
public class SecurityConfiguration {

    private final CorsProperties corsProperties;

    public SecurityConfiguration(final CorsProperties corsProperties) {
        this.corsProperties = corsProperties;
    }

    /**
     * Creates and configures a CORS filter registration bean.
     * <p>
     * This method creates a {@link CorsFilter} with configuration from the injected
     * {@link CorsProperties}, including:
     * <ul>
     *   <li>Allowed origin patterns</li>
     *   <li>Allowed headers</li>
     *   <li>Allowed methods</li>
     *   <li>Exposed headers</li>
     *   <li>Whether credentials are allowed</li>
     *   <li>Max age for preflight requests</li>
     * </ul>
     * The filter is applied to all paths ("/**") and assigned the highest priority (order 0).
     * </p>
     *
     * @return A {@link FilterRegistrationBean} containing the configured CORS filter
     */
    @Bean
    public FilterRegistrationBean<CorsFilter> corsFilterRegistrationBean() {
        final CorsConfiguration config = new CorsConfiguration();
        config.applyPermitDefaultValues();
        config.setAllowCredentials(corsProperties.getAllowCredentials());
        config.setAllowedOriginPatterns(corsProperties.getAllowedOriginPatterns());
        config.setAllowedHeaders(corsProperties.getAllowedHeaders());
        config.setAllowedMethods(corsProperties.getAllowedMethods());
        config.setExposedHeaders(corsProperties.getExposedHeaders());
        config.setMaxAge(corsProperties.getMaxAge());
        final UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        final FilterRegistrationBean<CorsFilter> bean = new FilterRegistrationBean<>(new CorsFilter(source));
        bean.setOrder(0);
        return bean;
    }
}
