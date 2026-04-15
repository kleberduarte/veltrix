package com.veltrix.service;

import com.veltrix.dto.pdvterminal.*;
import com.veltrix.model.PdvTerminal;
import com.veltrix.model.User;
import com.veltrix.model.enums.Role;
import com.veltrix.model.enums.StatusCaixa;
import com.veltrix.repository.PdvTerminalRepository;
import com.veltrix.security.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PdvTerminalService {

    private final PdvTerminalRepository repository;

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
    public void heartbeat(Long id, String operador) {
        PdvTerminal t = repository.findByIdAndCompanyId(id, TenantContext.getCompanyId())
                .orElseThrow(() -> new EntityNotFoundException("Terminal não encontrado"));
        t.setUltimoHeartbeat(LocalDateTime.now());
        t.setUltimoOperador(operador);
        t.setStatusCaixa(StatusCaixa.OCUPADO);
        repository.save(t);
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
