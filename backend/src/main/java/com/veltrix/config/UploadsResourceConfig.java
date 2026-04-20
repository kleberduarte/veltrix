package com.veltrix.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Serve arquivos salvos em {@code veltrix.uploads.dir}/products/ em {@code /files/products/**}.
 */
@Configuration
public class UploadsResourceConfig implements WebMvcConfigurer {

    @Value("${veltrix.uploads.dir:${user.home}/.veltrix/uploads}")
    private String uploadsRoot;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = "file:" + uploadsRoot.replace("\\", "/");
        if (!location.endsWith("/")) {
            location += "/";
        }
        registry.addResourceHandler("/files/products/**")
                .addResourceLocations(location + "products/");
    }
}
