package com.veltrix.service;

import com.veltrix.dto.produtelote.*;
import com.veltrix.model.ProdutoLote;
import com.veltrix.repository.ProdutoLoteRepository;
import com.veltrix.security.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProdutoLoteService {

    private final ProdutoLoteRepository repository;

    public List<ProdutoLoteResponse> findByProduto(Long productId) {
        return repository.findByProductIdAndCompanyIdOrderByValidadeAsc(productId, TenantContext.getCompanyId())
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public ProdutoLoteResponse create(ProdutoLoteRequest request) {
        ProdutoLote lote = ProdutoLote.builder()
                .companyId(TenantContext.getCompanyId())
                .productId(request.getProductId())
                .codigoLote(request.getCodigoLote())
                .validade(request.getValidade())
                .quantidadeAtual(request.getQuantidadeAtual())
                .build();
        return toResponse(repository.save(lote));
    }

    @Transactional
    public ProdutoLoteResponse update(Long id, ProdutoLoteRequest request) {
        ProdutoLote lote = repository.findByIdAndCompanyId(id, TenantContext.getCompanyId())
                .orElseThrow(() -> new EntityNotFoundException("Lote não encontrado"));
        lote.setCodigoLote(request.getCodigoLote());
        lote.setValidade(request.getValidade());
        lote.setQuantidadeAtual(request.getQuantidadeAtual());
        return toResponse(repository.save(lote));
    }

    @Transactional
    public void delete(Long id) {
        ProdutoLote lote = repository.findByIdAndCompanyId(id, TenantContext.getCompanyId())
                .orElseThrow(() -> new EntityNotFoundException("Lote não encontrado"));
        repository.delete(lote);
    }

    private ProdutoLoteResponse toResponse(ProdutoLote l) {
        ProdutoLoteResponse r = new ProdutoLoteResponse();
        r.setId(l.getId()); r.setProductId(l.getProductId());
        r.setCodigoLote(l.getCodigoLote()); r.setValidade(l.getValidade());
        r.setQuantidadeAtual(l.getQuantidadeAtual()); r.setCreatedAt(l.getCreatedAt());
        return r;
    }
}
