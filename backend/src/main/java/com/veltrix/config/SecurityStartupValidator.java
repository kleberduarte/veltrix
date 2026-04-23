package com.veltrix.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
public class SecurityStartupValidator {

    private static final Logger log = LoggerFactory.getLogger(SecurityStartupValidator.class);

    private static final String DEV_JWT_SECRET = "VeltrixDevSecretKey2024LocalOnly!DoNotUseInProd";
    private static final String DEV_ADMIN_PASSWORD = "AdmGlobal2024!";

    @Value("${veltrix.jwt.secret}")
    private String jwtSecret;

    @Value("${veltrix.global-admin.password}")
    private String globalAdminPassword;

    private final Environment environment;

    public SecurityStartupValidator(Environment environment) {
        this.environment = environment;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void validate() {
        boolean isProd = Arrays.asList(environment.getActiveProfiles()).contains("prod");

        if (isProd) {
            if (DEV_JWT_SECRET.equals(jwtSecret)) {
                throw new IllegalStateException(
                    "SEGURANÇA: JWT_SECRET está com o valor padrão de desenvolvimento em produção. " +
                    "Defina a variável de ambiente JWT_SECRET com um valor seguro de pelo menos 32 caracteres.");
            }
            if (DEV_ADMIN_PASSWORD.equals(globalAdminPassword)) {
                throw new IllegalStateException(
                    "SEGURANÇA: GLOBAL_ADMIN_PASSWORD está com o valor padrão de desenvolvimento em produção. " +
                    "Defina a variável de ambiente GLOBAL_ADMIN_PASSWORD.");
            }
            if (jwtSecret.length() < 32) {
                throw new IllegalStateException(
                    "SEGURANÇA: JWT_SECRET deve ter pelo menos 32 caracteres. Comprimento atual: " + jwtSecret.length());
            }
        } else {
            if (DEV_JWT_SECRET.equals(jwtSecret)) {
                log.warn("AVISO: Usando JWT_SECRET padrão de desenvolvimento. Nunca use este valor em produção.");
            }
        }
    }
}
