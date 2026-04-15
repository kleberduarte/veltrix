package com.veltrix.service;

import com.veltrix.dto.cash.*;
import com.veltrix.model.CashFlow;
import com.veltrix.repository.CashFlowRepository;
import com.veltrix.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CashFlowService {

    private final CashFlowRepository cashFlowRepository;

    public List<CashFlowResponse> findAll() {
        Long companyId = TenantContext.getCompanyId();
        return cashFlowRepository.findByCompanyIdOrderByCreatedAtDesc(companyId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public CashFlowResponse create(CashFlowRequest request) {
        Long companyId = TenantContext.getCompanyId();
        CashFlow cashFlow = CashFlow.builder()
                .companyId(companyId)
                .type(request.getType())
                .amount(request.getAmount())
                .description(request.getDescription())
                .build();
        return toResponse(cashFlowRepository.save(cashFlow));
    }

    @Transactional
    public void recordCredit(Long companyId, BigDecimal amount, String description) {
        CashFlow cashFlow = CashFlow.builder()
                .companyId(companyId)
                .type("IN")
                .amount(amount)
                .description(description)
                .build();
        cashFlowRepository.save(cashFlow);
    }

    private CashFlowResponse toResponse(CashFlow c) {
        CashFlowResponse r = new CashFlowResponse();
        r.setId(c.getId());
        r.setType(c.getType());
        r.setAmount(c.getAmount());
        r.setDescription(c.getDescription());
        r.setCreatedAt(c.getCreatedAt());
        return r;
    }
}
