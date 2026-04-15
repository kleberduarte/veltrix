package com.veltrix.service;

import com.veltrix.dto.ordemservico.*;
import com.veltrix.model.Company;
import com.veltrix.model.OrdemServico;
import com.veltrix.model.enums.StatusOrdemServico;
import com.veltrix.repository.CompanyRepository;
import com.veltrix.repository.OrdemServicoRepository;
import com.veltrix.repository.ParametroEmpresaRepository;
import com.veltrix.security.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class OrdemServicoService {

    private final OrdemServicoRepository repository;
    private final ParametroEmpresaRepository parametroEmpresaRepository;
    private final CompanyRepository companyRepository;

    // Transições válidas de status
    private static final Map<StatusOrdemServico, Set<StatusOrdemServico>> TRANSICOES = Map.of(
            StatusOrdemServico.ABERTA,               Set.of(StatusOrdemServico.EM_ANALISE, StatusOrdemServico.CANCELADA),
            StatusOrdemServico.EM_ANALISE,            Set.of(StatusOrdemServico.AGUARDANDO_APROVACAO, StatusOrdemServico.CANCELADA),
            StatusOrdemServico.AGUARDANDO_APROVACAO,  Set.of(StatusOrdemServico.CONCLUIDA, StatusOrdemServico.CANCELADA),
            StatusOrdemServico.CONCLUIDA,             Set.of(StatusOrdemServico.ENTREGUE, StatusOrdemServico.CANCELADA),
            StatusOrdemServico.ENTREGUE,              Set.of(),
            StatusOrdemServico.CANCELADA,             Set.of()
    );

    public List<OrdemServicoResponse> findAll() {
        assertOrdemServicoEnabledForCurrentCompany();
        return repository.findByCompanyIdOrderByDataAberturaDesc(TenantContext.getCompanyId())
                .stream().map(this::toResponse).toList();
    }

    public List<OrdemServicoResponse> findByStatus(StatusOrdemServico status) {
        assertOrdemServicoEnabledForCurrentCompany();
        return repository.findByCompanyIdAndStatusOrderByDataAberturaDesc(TenantContext.getCompanyId(), status)
                .stream().map(this::toResponse).toList();
    }

    public OrdemServicoResponse findById(Long id) {
        assertOrdemServicoEnabledForCurrentCompany();
        return toResponse(repository.findByIdAndCompanyId(id, TenantContext.getCompanyId())
                .orElseThrow(() -> new EntityNotFoundException("OS não encontrada")));
    }

    @Transactional
    public OrdemServicoResponse create(OrdemServicoRequest request) {
        assertOrdemServicoEnabledForCurrentCompany();
        Long companyId = TenantContext.getCompanyId();
        Long numero = repository.maxNumeroOs(companyId) + 1;

        BigDecimal valorServico = request.getValorServico() != null ? request.getValorServico() : BigDecimal.ZERO;
        BigDecimal desconto = request.getDesconto() != null ? request.getDesconto() : BigDecimal.ZERO;
        BigDecimal total = valorServico.subtract(desconto).max(BigDecimal.ZERO);

        OrdemServico os = OrdemServico.builder()
                .companyId(companyId)
                .numeroOs(numero)
                .clienteId(request.getClienteId())
                .nomeCliente(request.getNomeCliente())
                .telefoneCliente(request.getTelefoneCliente())
                .contatoCliente(request.getContatoCliente())
                .equipamento(request.getEquipamento())
                .marca(request.getMarca())
                .modelo(request.getModelo())
                .numeroSerie(request.getNumeroSerie())
                .acessorios(request.getAcessorios())
                .defeitoRelatado(request.getDefeitoRelatado())
                .diagnostico(request.getDiagnostico())
                .servicoExecutado(request.getServicoExecutado())
                .tecnicoResponsavel(request.getTecnicoResponsavel())
                .observacao(request.getObservacao())
                .valorServico(valorServico)
                .desconto(desconto)
                .valorTotal(total)
                .dataPrevisaoEntrega(request.getDataPrevisaoEntrega())
                .build();

        return toResponse(repository.save(os));
    }

    @Transactional
    public OrdemServicoResponse update(Long id, OrdemServicoRequest request) {
        assertOrdemServicoEnabledForCurrentCompany();
        OrdemServico os = repository.findByIdAndCompanyId(id, TenantContext.getCompanyId())
                .orElseThrow(() -> new EntityNotFoundException("OS não encontrada"));

        BigDecimal valorServico = request.getValorServico() != null ? request.getValorServico() : BigDecimal.ZERO;
        BigDecimal desconto = request.getDesconto() != null ? request.getDesconto() : BigDecimal.ZERO;

        os.setClienteId(request.getClienteId());
        os.setNomeCliente(request.getNomeCliente());
        os.setTelefoneCliente(request.getTelefoneCliente());
        os.setContatoCliente(request.getContatoCliente());
        os.setEquipamento(request.getEquipamento());
        os.setMarca(request.getMarca());
        os.setModelo(request.getModelo());
        os.setNumeroSerie(request.getNumeroSerie());
        os.setAcessorios(request.getAcessorios());
        os.setDefeitoRelatado(request.getDefeitoRelatado());
        os.setDiagnostico(request.getDiagnostico());
        os.setServicoExecutado(request.getServicoExecutado());
        os.setTecnicoResponsavel(request.getTecnicoResponsavel());
        os.setObservacao(request.getObservacao());
        os.setValorServico(valorServico);
        os.setDesconto(desconto);
        os.setValorTotal(valorServico.subtract(desconto).max(BigDecimal.ZERO));
        os.setDataPrevisaoEntrega(request.getDataPrevisaoEntrega());

        return toResponse(repository.save(os));
    }

    @Transactional
    public OrdemServicoResponse updateStatus(Long id, StatusOrdemServico novoStatus) {
        assertOrdemServicoEnabledForCurrentCompany();
        OrdemServico os = repository.findByIdAndCompanyId(id, TenantContext.getCompanyId())
                .orElseThrow(() -> new EntityNotFoundException("OS não encontrada"));

        Set<StatusOrdemServico> permitidos = TRANSICOES.getOrDefault(os.getStatus(), Set.of());
        if (!permitidos.contains(novoStatus)) {
            throw new IllegalArgumentException(
                    "Transição inválida: " + os.getStatus() + " → " + novoStatus);
        }

        os.setStatus(novoStatus);
        if (novoStatus == StatusOrdemServico.CONCLUIDA) os.setDataConclusao(LocalDateTime.now());
        if (novoStatus == StatusOrdemServico.ENTREGUE)  os.setDataEntrega(LocalDateTime.now());

        return toResponse(repository.save(os));
    }

    @Transactional
    public void delete(Long id) {
        assertOrdemServicoEnabledForCurrentCompany();
        OrdemServico os = repository.findByIdAndCompanyId(id, TenantContext.getCompanyId())
                .orElseThrow(() -> new EntityNotFoundException("OS não encontrada"));
        repository.delete(os);
    }

    private void assertOrdemServicoEnabledForCurrentCompany() {
        Long companyId = TenantContext.getCompanyId();
        if (companyId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sessão inválida.");
        }
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Empresa não encontrada."));
        if (isReservedCompany(company)) {
            return;
        }
        boolean moduloInformaticaAtivo = parametroEmpresaRepository.findByCompanyId(companyId)
                .map(p -> Boolean.TRUE.equals(p.getModuloInformaticaAtivo()))
                .orElse(false);
        if (!moduloInformaticaAtivo) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Módulo de informática desativado para esta empresa.");
        }
    }

    private static boolean isReservedCompany(Company company) {
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

    private OrdemServicoResponse toResponse(OrdemServico os) {
        OrdemServicoResponse r = new OrdemServicoResponse();
        r.setId(os.getId()); r.setNumeroOs(os.getNumeroOs());
        r.setClienteId(os.getClienteId()); r.setNomeCliente(os.getNomeCliente());
        r.setTelefoneCliente(os.getTelefoneCliente()); r.setContatoCliente(os.getContatoCliente());
        r.setEquipamento(os.getEquipamento()); r.setMarca(os.getMarca()); r.setModelo(os.getModelo());
        r.setNumeroSerie(os.getNumeroSerie()); r.setAcessorios(os.getAcessorios());
        r.setDefeitoRelatado(os.getDefeitoRelatado()); r.setDiagnostico(os.getDiagnostico());
        r.setServicoExecutado(os.getServicoExecutado()); r.setTecnicoResponsavel(os.getTecnicoResponsavel());
        r.setObservacao(os.getObservacao());
        r.setValorServico(os.getValorServico()); r.setDesconto(os.getDesconto()); r.setValorTotal(os.getValorTotal());
        r.setStatus(os.getStatus()); r.setDataAbertura(os.getDataAbertura());
        r.setDataPrevisaoEntrega(os.getDataPrevisaoEntrega()); r.setDataConclusao(os.getDataConclusao());
        r.setDataEntrega(os.getDataEntrega()); r.setVendaId(os.getVendaId());
        r.setCreatedAt(os.getCreatedAt());
        return r;
    }
}
