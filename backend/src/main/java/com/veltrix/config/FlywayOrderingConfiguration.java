package com.veltrix.config;

import org.springframework.boot.autoconfigure.flyway.FlywayConfigurationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Garante {@code outOfOrder=true} no Flyway mesmo quando variáveis de ambiente no Railway
 * (ex.: {@code SPRING_FLYWAY_OUT_OF_ORDER}) têm precedência sobre {@code application*.properties},
 * o que impedia aplicar a migração Java V9 em bases com histórico em gap (V10+ sem V9).
 */
@Configuration
public class FlywayOrderingConfiguration {

    @Bean
    public FlywayConfigurationCustomizer flywayOutOfOrder() {
        return configuration -> configuration.outOfOrder(true);
    }
}
