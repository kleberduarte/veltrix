package com.veltrix.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.flyway.FlywayConfigurationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Aplica explicitamente {@code spring.flyway.out-of-order} no Flyway (default {@code true}),
 * para bases com histórico em gap (ex.: V10+ aplicado antes da V9 Java) sem ignorar
 * {@code FLYWAY_OUT_OF_ORDER=false} quando quiser modo estrito.
 */
@Configuration
public class FlywayOrderingConfiguration {

    @Bean
    public FlywayConfigurationCustomizer flywayOutOfOrder(
            @Value("${spring.flyway.out-of-order:true}") boolean outOfOrder) {
        return configuration -> configuration.outOfOrder(outOfOrder);
    }
}
