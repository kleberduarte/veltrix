package com.veltrix.service;

import com.veltrix.dto.pdvterminal.*;
import com.veltrix.model.PdvTerminal;
import com.veltrix.model.User;
import com.veltrix.model.enums.Role;
import com.veltrix.model.enums.StatusCaixa;
import com.veltrix.repository.PdvTerminalRepository;
import com.veltrix.repository.UserRepository;
import com.veltrix.security.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PdvTerminalService {

    private final PdvTerminalRepository repository;
    private final UserRepository userRepository;

    public List<PdvTerminalResponse> findAll() {
        return repository.findByCompanyIdAndAtivoTrue(TenantContext.getCompanyId())
                .stream().map(this::toResponse).toList();
    }

    /** Lista terminais de uma empresa (Adm Global: qualquer empresa; demais: só a própria). */
    public List<PdvTerminalResponse> findForCompany(Long companyId, User current) {
        if (current.getRole() != Role.ADM && !current.getCompany().getId().equals(companyId)) {
            throw new IllegalArgumentException("Sem permissão para listar terminais desta empresa.");
        }
        return repository.findByCompanyIdAndAtivoTrue(companyId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public PdvTerminalResponse create(PdvTerminalRequest request) {
        Long companyId = TenantContext.getCompanyId();
        if (repository.existsByCodigoAndCompanyId(request.getCodigo(), companyId)) {
            throw new IllegalArgumentException("Código de terminal já existe: " + request.getCodigo());
        }
        PdvTerminal t = PdvTerminal.builder()
                .companyId(companyId)
                .codigo(request.getCodigo())
                .nome(request.getNome())
                .ativo(Boolean.TRUE.equals(request.getAtivo()))
                .build();
        return toResponse(repository.save(t));
    }

    @Transactional
    public PdvTerminalResponse update(Long id, PdvTerminalRequest request) {
        PdvTerminal t = repository.findByIdAndCompanyId(id, TenantContext.getCompanyId())
                .orElseThrow(() -> new EntityNotFoundException("Terminal não encontrado"));
        t.setNome(request.getNome());
        t.setAtivo(Boolean.TRUE.equals(request.getAtivo()));
        return toResponse(repository.save(t));
    }

    @Transactional
    public void heartbeat(Long id, User currentUser, String operador, StatusCaixa statusCaixa) {
        PdvTerminal t = repository.findByIdAndCompanyId(id, TenantContext.getCompanyId())
                .orElseThrow(() -> new EntityNotFoundException("Terminal não encontrado"));
        // Vínculo do usuário com terminal só acontece no uso real do PDV (heartbeat).
        boolean mesmoContextoEmpresa = currentUser.getCompany() != null
                && currentUser.getCompany().getId().equals(TenantContext.getCompanyId());
        if (mesmoContextoEmpresa && (currentUser.getPdvTerminal() == null
                || !currentUser.getPdvTerminal().getId().equals(t.getId()))) {
            currentUser.setPdvTerminal(t);
            userRepository.save(currentUser);
        }
        t.setUltimoHeartbeat(LocalDateTime.now());
        t.setUltimoOperador(operador);
        if (statusCaixa != null) {
            t.setStatusCaixa(statusCaixa);
        } else if (t.getStatusCaixa() == null) {
            t.setStatusCaixa(StatusCaixa.LIVRE);
        }
        repository.save(t);
    }

    /**
     * Atualiza heartbeat/operador após venda finalizada — reflete na tela Monitor PDV / Terminais PDV.
     */
    @Transactional
    public void touchAfterSale(Long terminalId, String nomeOperador) {
        PdvTerminal t = repository.findByIdAndCompanyId(terminalId, TenantContext.getCompanyId())
                .orElseThrow(() -> new EntityNotFoundException("Terminal não encontrado"));
        t.setUltimoHeartbeat(LocalDateTime.now());
        t.setUltimoOperador(nomeOperador);
        repository.save(t);
    }

    /**
     * Garante vínculo do usuário a um terminal da empresa: reutiliza {@code V-{userId}} se já existir,
     * ou o único terminal ativo cadastrado, ou cria {@code V-{userId}} — evita duplicar como {@code V-28-1}.
     */
    @Transactional
    public PdvTerminal ensureAndLinkTerminalForUsuario(Long companyId, User user) {
        PdvTerminal t = resolveReuseOrCreateTerminal(companyId, user);
        if (user.getPdvTerminal() == null || !user.getPdvTerminal().getId().equals(t.getId())) {
            user.setPdvTerminal(t);
            userRepository.save(user);
        }
        return t;
    }

    /**
     * Escolhe terminal sem gravar no usuário (ex.: decisão antes de vincular).
     */
    private PdvTerminal resolveReuseOrCreateTerminal(Long companyId, User user) {
        String codigoV = "V-" + user.getId();
        Optional<PdvTerminal> porCodigo = repository.findByCompanyIdAndCodigo(companyId, codigoV);
        if (porCodigo.isPresent()) {
            PdvTerminal t = porCodigo.get();
            if (!Boolean.TRUE.equals(t.getAtivo())) {
                t.setAtivo(true);
                t = repository.save(t);
            }
            return t;
        }
        List<PdvTerminal> ativos = repository.findByCompanyIdAndAtivoTrue(companyId);
        if (ativos.size() == 1) {
            return ativos.get(0);
        }
        return criarTerminalNovoPadrao(companyId, user);
    }

    private PdvTerminal criarTerminalNovoPadrao(Long companyId, User user) {
        String codigoBase = "V-" + user.getId();
        String codigo = codigoBase;
        if (repository.existsByCodigoAndCompanyId(codigo, companyId)) {
            int n = 0;
            do {
                n++;
                codigo = codigoBase + "-" + n;
            } while (repository.existsByCodigoAndCompanyId(codigo, companyId));
        }
        String nome = user.getName() == null ? "PDV" : ("PDV " + user.getName().trim());
        if (nome.length() > 120) {
            nome = nome.substring(0, 120);
        }
        return repository.save(PdvTerminal.builder()
                .companyId(companyId)
                .codigo(codigo)
                .nome(nome)
                .ativo(true)
                .build());
    }

    /**
     * Resolve o terminal da venda: usa o ID enviado pelo PDV, o vínculo do usuário ou reutiliza/cria conforme regras acima.
     */
    @Transactional
    public PdvTerminal resolveTerminalForPdv(User user, Long companyId, Long requestedTerminalId) {
        if (requestedTerminalId != null && requestedTerminalId >= 1) {
            return repository.findByIdAndCompanyId(requestedTerminalId, companyId)
                    .orElseThrow(() -> new IllegalArgumentException("Terminal PDV inválido para esta empresa."));
        }
        boolean mesmoContextoEmpresa = user.getCompany().getId().equals(companyId);
        if (mesmoContextoEmpresa && user.getPdvTerminal() != null) {
            PdvTerminal t = user.getPdvTerminal();
            if (t.getCompanyId().equals(companyId) && Boolean.TRUE.equals(t.getAtivo())) {
                return t;
            }
        }
        if (mesmoContextoEmpresa) {
            return ensureAndLinkTerminalForUsuario(companyId, user);
        }
        return findOrCreateTerminalAdmEmpresa(user, companyId);
    }

    /**
     * Adm global operando em outra empresa (JWT): terminal dedicado por usuário+empresa, sem alterar vínculo na empresa "home".
     */
    private PdvTerminal findOrCreateTerminalAdmEmpresa(User user, Long companyId) {
        String codigo = "ADM-" + user.getId() + "-E" + companyId;
        return repository.findByCompanyIdAndCodigo(companyId, codigo)
                .map(t -> {
                    if (!Boolean.TRUE.equals(t.getAtivo())) {
                        t.setAtivo(true);
                        return repository.save(t);
                    }
                    return t;
                })
                .orElseGet(() -> {
                    String nome = (user.getName() == null ? "PDV" : user.getName().trim()) + " (contexto)";
                    if (nome.length() > 120) {
                        nome = nome.substring(0, 120);
                    }
                    return repository.save(PdvTerminal.builder()
                            .companyId(companyId)
                            .codigo(codigo)
                            .nome(nome)
                            .ativo(true)
                            .build());
                });
    }

    @Transactional
    public void delete(Long id) {
        PdvTerminal t = repository.findByIdAndCompanyId(id, TenantContext.getCompanyId())
                .orElseThrow(() -> new EntityNotFoundException("Terminal não encontrado"));
        t.setAtivo(false);
        repository.save(t);
    }

    private PdvTerminalResponse toResponse(PdvTerminal t) {
        PdvTerminalResponse r = new PdvTerminalResponse();
        r.setId(t.getId()); r.setCodigo(t.getCodigo()); r.setNome(t.getNome());
        r.setAtivo(t.getAtivo()); r.setUltimoOperador(t.getUltimoOperador());
        r.setUltimoHeartbeat(t.getUltimoHeartbeat()); r.setStatusCaixa(t.getStatusCaixa());
        return r;
    }
}
