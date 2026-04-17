package com.veltrix.service;

import com.veltrix.dto.auth.*;
import com.veltrix.model.Company;
import com.veltrix.model.ParametroEmpresa;
import com.veltrix.model.PdvTerminal;
import com.veltrix.model.User;
import com.veltrix.model.enums.Role;
import com.veltrix.repository.*;
import com.veltrix.repository.CashFlowRepository;
import com.veltrix.repository.ClienteRepository;
import com.veltrix.repository.OrdemServicoRepository;
import com.veltrix.repository.PmcReferenciaRepository;
import com.veltrix.repository.ProdutoLoteRepository;
import com.veltrix.repository.ProductRepository;
import com.veltrix.security.JwtUtil;
import com.veltrix.security.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final PdvTerminalService pdvTerminalService;
    private final PdvTerminalRepository pdvTerminalRepository;
    private final OrderRepository orderRepository;
    private final FechamentoCaixaRepository fechamentoCaixaRepository;
    private final ParametroEmpresaRepository parametroEmpresaRepository;
    private final ProductRepository productRepository;
    private final ProdutoLoteRepository produtoLoteRepository;
    private final CashFlowRepository cashFlowRepository;
    private final ClienteRepository clienteRepository;
    private final OrdemServicoRepository ordemServicoRepository;
    private final PmcReferenciaRepository pmcReferenciaRepository;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email já está em uso");
        }
        if (!StringUtils.hasText(request.getCodigoConvite())) {
            throw new IllegalArgumentException("Código de convite é obrigatório.");
        }
        String code = request.getCodigoConvite().trim().toUpperCase();
        Company company = companyRepository.findByPdvInviteCodeIgnoreCase(code)
                .orElseThrow(() -> new IllegalArgumentException("Código de convite inválido ou expirado. Solicite um novo código ao administrador."));

        boolean definirSenhaSóNoPrimeiroAcesso = !StringUtils.hasText(request.getPassword());
        if (!definirSenhaSóNoPrimeiroAcesso && request.getPassword().length() < 4) {
            throw new IllegalArgumentException("Senha deve ter pelo menos 4 caracteres.");
        }
        String senhaInterna = definirSenhaSóNoPrimeiroAcesso
                ? passwordEncoder.encode(UUID.randomUUID().toString() + UUID.randomUUID())
                : passwordEncoder.encode(request.getPassword());

        User user = userRepository.save(User.builder()
                .company(company)
                .name(request.getName().trim())
                .email(normalizeEmail(request.getEmail()))
                .password(senhaInterna)
                .telefone(null)
                .role(Role.VENDEDOR)
                .mustChangePassword(true)
                .inviteSelfRegistration(definirSenhaSóNoPrimeiroAcesso)
                .build());
        company.setPdvInviteCode(null);
        companyRepository.save(company);

        String token = jwtUtil.generateToken(user.getId(), company.getId(), user.getEmail(), user.getRole().name());
        return buildResponse(token, user, company);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Credenciais inválidas"));

        if (user.getRole() == Role.ADMIN_EMPRESA && isEmpresaReservadaAdminEmpresa(user.getCompany())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Administradores de empresa não podem acessar a empresa reservada (Default).");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getCompany().getId(), user.getEmail(), user.getRole().name());
        return buildResponse(token, user, user.getCompany());
    }

    @Transactional(readOnly = true)
    public EmailStatusResponse getEmailStatus(EmailLookupRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (!StringUtils.hasText(email)) {
            throw new IllegalArgumentException("Informe um e-mail válido.");
        }
        return userRepository.findByEmail(email)
                .map(u -> EmailStatusResponse.builder()
                        .exists(true)
                        .requiresPasswordSetup(Boolean.TRUE.equals(u.getMustChangePassword()))
                        .build())
                .orElse(EmailStatusResponse.builder()
                        .exists(false)
                        .requiresPasswordSetup(false)
                        .build());
    }

    /**
     * Usuário já cadastrado com {@link User#getMustChangePassword()} true: valida a senha provisória e define a definitiva em um único passo.
     */
    @Transactional
    public AuthResponse setupInitialPassword(SetupInitialPasswordRequest request) {
        String email = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("E-mail não cadastrado."));

        if (!Boolean.TRUE.equals(user.getMustChangePassword())) {
            throw new IllegalArgumentException(
                    "Este e-mail já possui senha definida. Use sua senha na etapa de acesso.");
        }

        if (user.getRole() == Role.ADMIN_EMPRESA && isEmpresaReservadaAdminEmpresa(user.getCompany())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Administradores de empresa não podem acessar a empresa reservada (Default).");
        }

        if (!passwordEncoder.matches(request.getSenhaProvisoria(), user.getPassword())) {
            throw new IllegalArgumentException("Senha provisória incorreta.");
        }

        user.setPassword(passwordEncoder.encode(request.getNovaSenha()));
        user.setMustChangePassword(false);
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getId(), user.getCompany().getId(), user.getEmail(), user.getRole().name());
        return buildResponse(token, user, user.getCompany());
    }

    @Transactional
    public CreateUserResponse createUser(CreateUserRequest request) {
        String emailNorm = normalizeEmail(request.getEmail());
        if (userRepository.existsByEmail(emailNorm)) {
            throw new IllegalArgumentException("Email já está em uso");
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new IllegalStateException("Não autenticado");
        }
        User current = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new EntityNotFoundException("Usuário atual não encontrado"));

        Company company = resolveCompanyForNewUser(request, current);
        if (isEmpresaReservadaAdminEmpresa(company) && request.getRole() == Role.ADMIN_EMPRESA) {
            throw new IllegalArgumentException("Não é permitido criar administrador de empresa na empresa reservada.");
        }
        if (request.getRole() == Role.ADM && current.getRole() != Role.ADM) {
            throw new IllegalArgumentException("Apenas administrador global pode atribuir o perfil Adm Global.");
        }

        String plain;
        boolean gerada;
        if (!StringUtils.hasText(request.getPassword())) {
            plain = gerarSenhaProvisoria();
            gerada = true;
        } else {
            if (request.getPassword().length() < 4) {
                throw new IllegalArgumentException("Senha deve ter pelo menos 4 caracteres");
            }
            plain = request.getPassword();
            gerada = false;
        }
        boolean mustChange;
        if (request.getRole() == Role.VENDEDOR) {
            // Regra legado: vendedor criado pelo admin troca senha apenas quando ela foi gerada automaticamente.
            mustChange = gerada;
        } else {
            mustChange = Boolean.TRUE.equals(request.getMustChangePassword()) || gerada;
        }

        PdvTerminal terminal = null;
        if (request.getPdvTerminalId() != null && request.getPdvTerminalId() >= 1) {
            terminal = pdvTerminalRepository.findByIdAndCompanyId(request.getPdvTerminalId(), company.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Terminal PDV inválido para esta empresa."));
        }

        User user = userRepository.save(User.builder()
                .company(company)
                .name(request.getName().trim())
                .email(emailNorm)
                .password(passwordEncoder.encode(plain))
                .role(request.getRole())
                .telefone(trimOrNull(request.getTelefone()))
                .mustChangePassword(mustChange)
                .pdvTerminal(terminal)
                .build());

        return toCreateUserResponse(user, gerada ? plain : null);
    }

    @Transactional
    public AuthResponse changePassword(ChangePasswordRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

        if (Boolean.TRUE.equals(user.getInviteSelfRegistration())) {
            throw new IllegalArgumentException("Use a tela de primeiro acesso para definir sua senha de convite.");
        }

        if (!passwordEncoder.matches(request.getSenhaAtual(), user.getPassword())) {
            throw new IllegalArgumentException("Senha atual incorreta");
        }
        user.setPassword(passwordEncoder.encode(request.getNovaSenha()));
        user.setMustChangePassword(false);
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getId(), user.getCompany().getId(), user.getEmail(), user.getRole().name());
        return buildResponse(token, user, user.getCompany());
    }

    /**
     * Primeiro acesso após cadastro com convite PDV (sem senha no formulário): define a senha definitiva.
     */
    @Transactional
    public AuthResponse definirPrimeiraSenhaConvite(PrimeiraSenhaConviteRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));
        if (!Boolean.TRUE.equals(user.getMustChangePassword()) || !Boolean.TRUE.equals(user.getInviteSelfRegistration())) {
            throw new IllegalArgumentException("Esta operação não se aplica ao seu usuário.");
        }
        if (request.getNovaSenha().length() < 6) {
            throw new IllegalArgumentException("A nova senha deve ter pelo menos 6 caracteres.");
        }
        user.setPassword(passwordEncoder.encode(request.getNovaSenha()));
        user.setMustChangePassword(false);
        user.setInviteSelfRegistration(false);
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getId(), user.getCompany().getId(), user.getEmail(), user.getRole().name());
        return buildResponse(token, user, user.getCompany());
    }

    @Transactional
    public MeResponse getMe(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));
        Company company = resolveTenantCompany(user);
        return MeResponse.builder()
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .companyId(company.getId())
                .companyName(company.getName())
                .accessToken(company.getAccessToken())
                .role(user.getRole().name())
                .mustChangePassword(user.getMustChangePassword())
                .inviteSelfRegistration(Boolean.TRUE.equals(user.getInviteSelfRegistration()))
                .telefone(user.getTelefone())
                .pdvTerminalId(user.getPdvTerminal() != null ? user.getPdvTerminal().getId() : null)
                .pdvTerminalCodigo(user.getPdvTerminal() != null ? user.getPdvTerminal().getCodigo() : null)
                .build();
    }

    /**
     * Empresa do contexto atual (JWT): para Adm Global que alternou a empresa, o tenant é o do token, não o vínculo do usuário.
     */
    private Company resolveTenantCompany(User user) {
        Long tid = TenantContext.getCompanyId();
        if (tid == null) {
            return user.getCompany();
        }
        return companyRepository.findById(tid).orElse(user.getCompany());
    }

    public List<UserResponse> listUsers() {
        getCurrentUser();
        Long cid = TenantContext.getCompanyId();
        if (cid == null) {
            throw new IllegalStateException("Contexto de empresa não definido.");
        }
        List<User> list = userRepository.findByCompany_IdOrderByIdAsc(cid);
        return list.stream().map(this::toUserResponse2).toList();
    }

    public List<CompanySummaryResponse> listCompaniesForSelector() {
        User current = getCurrentUser();
        if (current.getRole() == Role.ADM) {
            return companyRepository.findAll().stream()
                    .map(c -> {
                        String accessToken = isEmpresaReservada(c) ? null : c.getAccessToken();
                        return new CompanySummaryResponse(
                                c.getId(), c.getName(),
                                Boolean.TRUE.equals(c.getSystemDefault()),
                                accessToken);
                    })
                    .sorted(Comparator.comparing(CompanySummaryResponse::getName))
                    .toList();
        }
        Company c = current.getCompany();
        return List.of(new CompanySummaryResponse(c.getId(), c.getName(), Boolean.TRUE.equals(c.getSystemDefault())));
    }

    /**
     * Retorna o código de convite PDV da empresa atual; cria um se ainda não existir (exceto empresa reservada).
     */
    @Transactional
    public PdvInviteResponse getPdvInviteCode() {
        User current = getCurrentUser();
        Company company = resolveTenantCompany(current);
        if (!isEmpresaReservada(company) && !StringUtils.hasText(company.getPdvInviteCode())) {
            company.setPdvInviteCode(gerarCodigoConvite());
            company = companyRepository.save(company);
        }
        return buildPdvInviteResponse(company);
    }

    private static PdvInviteResponse buildPdvInviteResponse(Company company) {
        return PdvInviteResponse.builder()
                .companyId(company.getId())
                .companyName(company.getName())
                .codigo(company.getPdvInviteCode())
                .build();
    }

    @Transactional
    public PdvInviteResponse regeneratePdvInviteCode() {
        User current = getCurrentUser();
        if (current.getRole() == Role.VENDEDOR) {
            throw new IllegalStateException("Sem permissão para gerar código de convite.");
        }
        Company company = resolveTenantCompany(current);
        String novo = gerarCodigoConvite();
        company.setPdvInviteCode(novo);
        companyRepository.save(company);
        return PdvInviteResponse.builder()
                .companyId(company.getId())
                .companyName(company.getName())
                .codigo(novo)
                .build();
    }

    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        User current = getCurrentUser();
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

        assertCanManageUser(current, user);

        if (StringUtils.hasText(request.getEmail())) {
            String ne = normalizeEmail(request.getEmail());
            if (!ne.equals(user.getEmail()) && userRepository.existsByEmailAndIdNot(ne, id)) {
                throw new IllegalArgumentException("Email já está em uso");
            }
            user.setEmail(ne);
        }
        if (StringUtils.hasText(request.getName())) {
            user.setName(request.getName().trim());
        }
        if (request.getRole() != null) {
            if (request.getRole() == Role.ADM && current.getRole() != Role.ADM) {
                throw new IllegalArgumentException("Apenas administrador global pode atribuir o perfil Adm Global.");
            }
            if (user.getRole() != Role.ADM && request.getRole() == Role.ADM && current.getRole() != Role.ADM) {
                throw new IllegalArgumentException("Sem permissão para promover a Adm Global.");
            }
            user.setRole(request.getRole());
        }

        if (StringUtils.hasText(request.getPassword())) {
            if (request.getPassword().length() < 4) {
                throw new IllegalArgumentException("Senha deve ter pelo menos 4 caracteres");
            }
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setMustChangePassword(false);
        }

        if (Boolean.TRUE.equals(request.getAplicarTelefone())) {
            user.setTelefone(trimOrNull(request.getTelefone()));
        }

        if (current.getRole() == Role.ADM && request.getCompanyId() != null && request.getCompanyId() >= 1) {
            Company nova = companyRepository.findById(request.getCompanyId())
                    .orElseThrow(() -> new EntityNotFoundException("Empresa não encontrada"));
            if (isEmpresaReservadaAdminEmpresa(nova) && user.getRole() == Role.ADMIN_EMPRESA) {
                throw new IllegalArgumentException("Não é permitido vincular administrador de empresa à empresa reservada.");
            }
            user.setCompany(nova);
            user.setPdvTerminal(null);
        }

        if (Boolean.TRUE.equals(request.getDesvincularPdv())) {
            user.setPdvTerminal(null);
        } else if (request.getPdvTerminalId() != null) {
            if (request.getPdvTerminalId() < 1) {
                user.setPdvTerminal(null);
            } else {
                PdvTerminal t = pdvTerminalRepository.findByIdAndCompanyId(request.getPdvTerminalId(), user.getCompany().getId())
                        .orElseThrow(() -> new IllegalArgumentException("Terminal PDV inválido para a empresa do usuário."));
                user.setPdvTerminal(t);
            }
        }

        userRepository.save(user);
        return toUserResponse2(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        User current = getCurrentUser();
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

        if (user.getId().equals(current.getId())) {
            throw new IllegalArgumentException("Não é possível excluir o próprio usuário.");
        }

        assertCanManageUser(current, user);

        if (current.getRole() == Role.ADMIN_EMPRESA && user.getRole() == Role.ADM) {
            throw new IllegalStateException("Sem permissão para excluir perfil Adm Global.");
        }

        if (userRepository.count() <= 1) {
            throw new IllegalStateException("Não é possível excluir o único usuário do sistema.");
        }

        long companyId = user.getCompany().getId();
        if (orderRepository.countByUsuarioId(id) > 0) {
            List<User> outros = userRepository.findByCompany_IdOrderByIdAsc(companyId).stream()
                    .filter(u -> !u.getId().equals(id))
                    .toList();
            if (outros.isEmpty()) {
                throw new IllegalStateException("Não há outro usuário na empresa para manter o histórico de vendas.");
            }
            User substituto = outros.stream()
                    .min(Comparator
                            .comparing((User u) -> u.getRole() == Role.ADM ? 0 : 1)
                            .thenComparing(User::getId))
                    .orElseThrow();
            orderRepository.reatribuirUsuarioPedidos(id, substituto.getId());
        }

        fechamentoCaixaRepository.desvincularUsuario(id);
        userRepository.delete(user);
    }

    private void assertCanManageUser(User current, User target) {
        Long tid = TenantContext.getCompanyId();
        if (tid == null) {
            throw new IllegalStateException("Contexto de empresa não definido.");
        }
        if (current.getRole() == Role.ADM) {
            if (!target.getCompany().getId().equals(tid)) {
                throw new IllegalStateException(
                        "Altere o contexto da empresa no menu para gerenciar este usuário.");
            }
            return;
        }
        if (current.getRole() == Role.ADMIN_EMPRESA) {
            if (!target.getCompany().getId().equals(tid)) {
                throw new IllegalStateException("Sem permissão para alterar usuário de outra empresa.");
            }
            return;
        }
        throw new IllegalStateException("Sem permissão.");
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new IllegalStateException("Não autenticado");
        }
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new EntityNotFoundException("Usuário atual não encontrado"));
    }

    private Company resolveCompanyForNewUser(CreateUserRequest request, User current) {
        if (current.getRole() == Role.ADM && request.getCompanyId() != null && request.getCompanyId() >= 1) {
            return companyRepository.findById(request.getCompanyId())
                    .orElseThrow(() -> new EntityNotFoundException("Empresa não encontrada"));
        }
        if (current.getRole() == Role.ADMIN_EMPRESA) {
            return companyRepository.findById(TenantContext.getCompanyId())
                    .orElseThrow(() -> new EntityNotFoundException("Empresa não encontrada"));
        }
        return companyRepository.findById(TenantContext.getCompanyId())
                .orElseThrow(() -> new EntityNotFoundException("Empresa não encontrada"));
    }

    private static String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private static String trimOrNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private static String gerarSenhaProvisoria() {
        final String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
        SecureRandom r = new SecureRandom();
        StringBuilder sb = new StringBuilder(14);
        for (int i = 0; i < 14; i++) {
            sb.append(chars.charAt(r.nextInt(chars.length())));
        }
        return sb.toString();
    }

    private static String gerarAccessToken() {
        return UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
    }

    private static String gerarCodigoConvite() {
        final String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        SecureRandom r = new SecureRandom();
        StringBuilder sb = new StringBuilder(8);
        for (int i = 0; i < 8; i++) {
            sb.append(chars.charAt(r.nextInt(chars.length())));
        }
        return sb.toString();
    }

    private CreateUserResponse toCreateUserResponse(User user, String senhaTemporaria) {
        return CreateUserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .companyId(user.getCompany().getId())
                .companyName(user.getCompany().getName())
                .telefone(user.getTelefone())
                .mustChangePassword(user.getMustChangePassword())
                .senhaTemporaria(senhaTemporaria)
                .pdvTerminalId(user.getPdvTerminal() != null ? user.getPdvTerminal().getId() : null)
                .pdvTerminalCodigo(user.getPdvTerminal() != null ? user.getPdvTerminal().getCodigo() : null)
                .build();
    }

    private AuthResponse buildResponse(String token, User user, Company company) {
        return AuthResponse.builder()
                .token(token)
                .name(user.getName())
                .email(user.getEmail())
                .companyId(company.getId())
                .companyName(company.getName())
                .accessToken(company.getAccessToken())
                .role(user.getRole().name())
                .mustChangePassword(user.getMustChangePassword())
                .inviteSelfRegistration(Boolean.TRUE.equals(user.getInviteSelfRegistration()))
                .build();
    }

    private UserResponse toUserResponse2(User user) {
        UserResponse r = new UserResponse();
        r.setId(user.getId());
        r.setName(user.getName());
        r.setEmail(user.getEmail());
        r.setRole(user.getRole());
        r.setTelefone(user.getTelefone());
        r.setMustChangePassword(user.getMustChangePassword());
        r.setCompanyId(user.getCompany().getId());
        r.setCompanyName(user.getCompany().getName());
        if (user.getPdvTerminal() != null) {
            r.setPdvTerminalId(user.getPdvTerminal().getId());
            r.setPdvTerminalCodigo(user.getPdvTerminal().getCodigo());
        }
        r.setCreatedAt(user.getCreatedAt());
        return r;
    }

    private static boolean isEmpresaReservada(Company company) {
        if (Boolean.TRUE.equals(company.getSystemDefault())) {
            return true;
        }
        String n = company.getName();
        if (n == null) {
            return false;
        }
        String normalized = n.trim();
        return "default".equalsIgnoreCase(normalized) || "sistema".equalsIgnoreCase(normalized);
    }

    private static boolean isEmpresaReservadaAdminEmpresa(Company company) {
        return isEmpresaReservada(company);
    }

    @Transactional
    public AuthResponse switchCompany(Long companyId) {
        User user = getCurrentUser();
        Company target = companyRepository.findById(companyId)
                .orElseThrow(() -> new EntityNotFoundException("Empresa não encontrada"));
        if (user.getRole() == Role.ADM) {
            // pode alternar para qualquer empresa
        } else {
            if (!user.getCompany().getId().equals(companyId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissão para acessar esta empresa.");
            }
        }
        if (user.getRole() == Role.ADMIN_EMPRESA && isEmpresaReservadaAdminEmpresa(target)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Administradores de empresa não podem acessar a empresa reservada.");
        }
        String token = jwtUtil.generateToken(user.getId(), target.getId(), user.getEmail(), user.getRole().name());
        return buildResponse(token, user, target);
    }

    @Transactional
    public CompanySummaryResponse createCompany(String name) {
        User current = getCurrentUser();
        if (current.getRole() != Role.ADM) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Apenas administrador global pode cadastrar empresas.");
        }
        String n = name.trim();
        if (n.length() < 2 || n.length() > 255) {
            throw new IllegalArgumentException("Nome da empresa deve ter entre 2 e 255 caracteres.");
        }
        Company c = companyRepository.save(Company.builder()
                .name(n)
                .plan("FREE")
                .systemDefault(false)
                .pdvInviteCode(gerarCodigoConvite())
                .accessToken(gerarAccessToken())
                .build());
        seedParametrosPadrao(c.getId(), n);
        CompanySummaryResponse resp = new CompanySummaryResponse(c.getId(), c.getName(), false, c.getAccessToken());
        resp.setPdvInviteCode(c.getPdvInviteCode());
        return resp;
    }

    /**
     * Exclui uma empresa e todos os seus dados (cascade completo).
     * Exclusivo para ADM Global. Empresas system_default não podem ser excluídas.
     */
    @Transactional
    public void deleteCompany(Long companyId) {
        User current = getCurrentUser();
        if (current.getRole() != Role.ADM) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Apenas administrador global pode excluir empresas.");
        }
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new EntityNotFoundException("Empresa não encontrada"));
        if (Boolean.TRUE.equals(company.getSystemDefault())) {
            throw new IllegalArgumentException("A empresa padrão do sistema não pode ser excluída.");
        }
        if (current.getCompany().getId().equals(companyId)) {
            throw new IllegalArgumentException("Você não pode excluir a empresa à qual seu usuário pertence.");
        }

        // 1. Anular FK de usuários para terminais PDV (evita violação antes de deletar terminais)
        userRepository.desvinculaTerminaisDeEmpresa(companyId);

        // 2. Dados financeiros e operacionais (sem dependências entre si)
        produtoLoteRepository.deleteByCompanyId(companyId);
        orderRepository.deleteByCompanyId(companyId);
        fechamentoCaixaRepository.deleteByCompanyId(companyId);
        cashFlowRepository.deleteByCompanyId(companyId);
        ordemServicoRepository.deleteByCompanyId(companyId);
        pmcReferenciaRepository.deleteByCompanyId(companyId);
        clienteRepository.deleteByCompanyId(companyId);

        // 3. Terminais (FK usuários já anulada no passo 1)
        pdvTerminalRepository.deleteByCompanyId(companyId);

        // 4. Produtos (lotes já deletados)
        productRepository.deleteByCompanyId(companyId);

        // 5. Parâmetros da empresa
        parametroEmpresaRepository.deleteByCompanyId(companyId);

        // 6. Usuários (FK para company — devem ser deletados antes da company)
        userRepository.deleteByCompany_Id(companyId);

        // 7. Empresa
        companyRepository.delete(company);
    }

    /** Retorna branding público para a URL exclusiva de acesso da empresa. */
    @Transactional(readOnly = true)
    public CompanyAccessResponse getCompanyAccessInfo(String accessToken) {
        Company c = companyRepository.findByAccessToken(accessToken)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Link de acesso inválido."));
        if (isEmpresaReservada(c)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Link de acesso inválido.");
        }

        var parametro = parametroEmpresaRepository.findByCompanyId(c.getId()).orElse(null);
        String nomeEmpresa = parametro != null && parametro.getNomeEmpresa() != null ? parametro.getNomeEmpresa() : c.getName();
        String logoUrl = parametro != null ? parametro.getLogoUrl() : null;
        String corPrimaria = parametro != null && parametro.getCorPrimaria() != null ? parametro.getCorPrimaria() : "#2563eb";
        String corSecundaria = parametro != null && parametro.getCorSecundaria() != null ? parametro.getCorSecundaria() : "#1e3a8a";
        String corBotao = parametro != null && parametro.getCorBotao() != null ? parametro.getCorBotao() : "#2563eb";
        String corBotaoTexto = parametro != null && parametro.getCorBotaoTexto() != null ? parametro.getCorBotaoTexto() : "#ffffff";

        return new CompanyAccessResponse(
                c.getId(), c.getName(), nomeEmpresa, logoUrl,
                corPrimaria, corSecundaria, corBotao, corBotaoTexto);
    }

    /**
     * Cria os parâmetros da empresa com o estilo padrão Veltrix, caso ainda não existam.
     * Chamado na criação de empresa e nos bootstraps de startup.
     */
    public void seedParametrosPadrao(Long companyId, String nomeEmpresa) {
        if (parametroEmpresaRepository.findByCompanyId(companyId).isPresent()) {
            return;
        }
        parametroEmpresaRepository.save(ParametroEmpresa.builder()
                .companyId(companyId)
                .nomeEmpresa(nomeEmpresa)
                .build());
    }
}
