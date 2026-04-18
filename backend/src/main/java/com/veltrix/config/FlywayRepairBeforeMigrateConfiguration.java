package com.veltrix.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Executa {@link org.flywaydb.core.Flyway#repair()} antes de {@code migrate}.
 * <ul>
 *   <li>Remove entradas com {@code success = 0} (migração falhou no meio), permitindo reaplicar.</li>
 *   <li>Realinha checksums quando o conteúdo de um script já aplicado foi corrigido (ex.: V24).</li>
 * </ul>
 * Desative com {@code veltrix.flyway.repair-before-migrate=false} se precisar do comportamento estrito do Flyway.
 */
@Configuration
public class FlywayRepairBeforeMigrateConfiguration {

    @Bean
    public FlywayMigrationStrategy flywayRepairThenMigrate(
            @Value("${veltrix.flyway.repair-before-migrate:true}") boolean repairFirst) {
        return flyway -> {
            if (repairFirst) {
                flyway.repair();
            }
            flyway.migrate();
        };
    }
}
