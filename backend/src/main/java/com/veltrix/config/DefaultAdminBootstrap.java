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
 * Cria empresa + usuário admin da empresa na primeira subida, se ainda não existir o e-mail configurado.
 */
@Slf4j
@Component
@Order(100)
@RequiredArgsConstructor
public class DefaultAdminBootstrap implements ApplicationRunner {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    @Value("${veltrix.admin.bootstrap.enabled:false}")
    private boolean enabled;

    @Value("${veltrix.admin.email:admin@veltrix.local}")
    private String adminEmail;

    @Value("${veltrix.admin.password:admin123}")
    private String adminPassword;

    @Value("${veltrix.admin.name:Administrador}")
    private String adminName;

    @Value("${veltrix.admin.company-name:Veltrix}")
    private String companyName;

    @Override
    public void run(ApplicationArguments args) {
        if (!enabled) {
            log.info("Bootstrap do admin desabilitado (veltrix.admin.bootstrap.enabled=false).");
            return;
        }
        if (!StringUtils.hasText(adminEmail) || !StringUtils.hasText(adminPassword)) {
            log.warn("Bootstrap do admin ignorado: e-mail ou senha vazios.");
            return;
        }
        if (userRepository.existsByEmail(adminEmail.trim().toLowerCase())) {
            log.debug("Bootstrap do admin ignorado: usuário {} já existe.", adminEmail);
            return;
        }

        Company company = companyRepository.save(Company.builder()
                .name(companyName)
                .accessToken(UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", ""))
                .build());

        userRepository.save(User.builder()
                .company(company)
                .name(adminName)
                .email(adminEmail.trim().toLowerCase())
                .password(passwordEncoder.encode(adminPassword))
                .role(Role.ADMIN_EMPRESA)
                .mustChangePassword(false)
                .build());

        log.info("Usuário admin criado: {} (empresa: {}). Altere a senha em produção.", adminEmail, companyName);
        authService.seedParametrosPadrao(company.getId(), companyName);
    }
}
