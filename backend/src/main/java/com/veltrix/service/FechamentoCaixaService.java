package com.veltrix.service;

import com.veltrix.dto.fechamentocaixa.*;
import com.veltrix.model.FechamentoCaixa;
import com.veltrix.model.Order;
import com.veltrix.model.enums.FormaPagamento;
import com.veltrix.repository.FechamentoCaixaRepository;
import com.veltrix.repository.OrderRepository;
import com.veltrix.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FechamentoCaixaService {

    private final FechamentoCaixaRepository fechamentoRepository;
    private final OrderRepository orderRepository;

    public ResumoDiaResponse resumoHoje() {
        Long companyId = TenantContext.getCompanyId();
        LocalDateTime inicio = LocalDate.now().atStartOfDay();
        LocalDateTime fim = inicio.plusDays(1);
        List<Order> orders = orderRepository.findByCompanyIdAndCreatedAtBetween(companyId, inicio, fim);

        BigDecimal dinheiro = soma(orders, FormaPagamento.DINHEIRO);
        BigDecimal cartao = soma(orders, FormaPagamento.CARTAO);
        BigDecimal debito = soma(orders, FormaPagamento.DEBITO);
        BigDecimal pix = soma(orders, FormaPagamento.PIX);

        return ResumoDiaResponse.builder()
                .quantidadeVendas((long) orders.size())
                .totalDinheiro(dinheiro)
                .totalCartao(cartao)
                .totalDebito(debito)
                .totalPix(pix)
                .totalGeral(dinheiro.add(cartao).add(debito).add(pix))
                .jaFechado(fechamentoRepository.existsByCompanyIdAndDataReferencia(companyId, LocalDate.now()))
                .build();
    }

    @Transactional
    public FechamentoCaixaResponse fechar(FechamentoCaixaRequest request) {
        Long companyId = TenantContext.getCompanyId();
        String operador = SecurityContextHolder.getContext().getAuthentication().getName();

        ResumoDiaResponse resumo = resumoHoje();
        if (resumo.isJaFechado()) throw new IllegalArgumentException("Caixa já foi fechado hoje");

        BigDecimal valorInformado = request.getValorInformadoDinheiro() != null ?
                request.getValorInformadoDinheiro() : resumo.getTotalDinheiro();
        BigDecimal diferenca = valorInformado.subtract(resumo.getTotalDinheiro());

        FechamentoCaixa fc = FechamentoCaixa.builder()
                .companyId(companyId)
                .terminalId(request.getTerminalId())
                .nomeOperador(operador)
                .dataReferencia(LocalDate.now())
                .quantidadeVendas(resumo.getQuantidadeVendas())
                .totalDinheiro(resumo.getTotalDinheiro())
                .totalCartao(resumo.getTotalCartao())
                .totalDebito(resumo.getTotalDebito())
                .totalPix(resumo.getTotalPix())
                .totalGeral(resumo.getTotalGeral())
                .valorInformadoDinheiro(valorInformado)
                .diferencaDinheiro(diferenca)
                .build();

        return toResponse(fechamentoRepository.save(fc));
    }

    public List<FechamentoCaixaResponse> historico() {
        return fechamentoRepository.findByCompanyIdOrderByDataFechamentoDesc(TenantContext.getCompanyId())
                .stream().map(this::toResponse).toList();
    }

    private BigDecimal soma(List<Order> orders, FormaPagamento forma) {
        return orders.stream()
                .filter(o -> forma.equals(o.getFormaPagamento()))
                .map(Order::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private FechamentoCaixaResponse toResponse(FechamentoCaixa fc) {
        FechamentoCaixaResponse r = new FechamentoCaixaResponse();
        r.setId(fc.getId()); r.setNomeOperador(fc.getNomeOperador());
        r.setDataReferencia(fc.getDataReferencia()); r.setDataFechamento(fc.getDataFechamento());
        r.setQuantidadeVendas(fc.getQuantidadeVendas());
        r.setTotalDinheiro(fc.getTotalDinheiro()); r.setTotalCartao(fc.getTotalCartao());
        r.setTotalDebito(fc.getTotalDebito());
        r.setTotalPix(fc.getTotalPix()); r.setTotalGeral(fc.getTotalGeral());
        r.setValorInformadoDinheiro(fc.getValorInformadoDinheiro());
        r.setDiferencaDinheiro(fc.getDiferencaDinheiro());
        return r;
    }
}
