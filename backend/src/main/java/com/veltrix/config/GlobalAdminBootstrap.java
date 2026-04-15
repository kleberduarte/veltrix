package com.veltrix.config;

import com.veltrix.model.Company;
import com.veltrix.model.User;
import com.veltrix.model.enums.Role;
import com.veltrix.repository.CompanyRepository;
import com.veltrix.repository.UserRepository;
import com.veltrix.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import java.util.UUID;

/**
 * Cria empresa interna + usuário com perfil {@link Role#ADM} (Adm Global) na primeira subida,
 * se o e-mail configurado ainda não existir.
 */
@Slf4j
@Component
@Order(99)
@RequiredArgsConstructor
public class GlobalAdminBootstrap implements ApplicationRunner {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    @Value("${veltrix.global-admin.bootstrap.enabled:true}")
    private boolean enabled;

    @Value("${veltrix.global-admin.email:adm.global@veltrix.local}")
    private String email;

    @Value("${veltrix.global-admin.password:AdmGlobal2024!}")
    private String password;

    @Value("${veltrix.global-admin.name:Adm Global}")
    private String name;

    @Value("${veltrix.global-admin.company-name:Sistema}")
    private String companyName;

    @Override
    public void run(ApplicationArguments args) {
        if (!enabled) {
            log.info("Bootstrap do Adm Global desabilitado (veltrix.global-admin.bootstrap.enabled=false).");
            return;
        }
        if (!StringUtils.hasText(email) || !StringUtils.hasText(password)) {
            log.warn("Bootstrap do Adm Global ignorado: e-mail ou senha vazios.");
            return;
        }
        String normalized = email.trim().toLowerCase();
        if (userRepository.existsByEmail(normalized)) {
            log.debug("Bootstrap do Adm Global ignorado: usuário {} já existe.", normalized);
            return;
        }

        Company company = companyRepository.save(Company.builder()
                .name(companyName)
                .accessToken(UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", ""))
                .build());

        userRepository.save(User.builder()
                .company(company)
                .name(name)
                .email(normalized)
                .password(passwordEncoder.encode(password))
                .role(Role.ADM)
                .mustChangePassword(false)
                .build());

        log.info("Usuário Adm Global criado: {} (empresa: {}). Altere a senha em application.properties ou variáveis de ambiente em produção.",
                normalized, companyName);
        authService.seedParametrosPadrao(company.getId(), companyName);
    }
}
