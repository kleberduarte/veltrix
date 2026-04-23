package com.veltrix.service;

import com.veltrix.dto.fechamentocaixa.FechamentoCaixaRequest;
import com.veltrix.model.FechamentoCaixa;
import com.veltrix.model.Order;
import com.veltrix.model.enums.FormaPagamento;
import com.veltrix.repository.FechamentoCaixaRepository;
import com.veltrix.repository.OrderRepository;
import com.veltrix.security.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FechamentoCaixaServiceTest {

    @Mock
    private FechamentoCaixaRepository fechamentoRepository;

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private FechamentoCaixaService fechamentoCaixaService;

    private static final Long COMPANY_ID = 1L;

    @BeforeEach
    void setup() {
        TenantContext.setCompanyId(COMPANY_ID);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("operador@empresa.com", null, List.of()));
    }

    @AfterEach
    void teardown() {
        TenantContext.clear();
        SecurityContextHolder.clearContext();
    }

    // -------------------------------------------------------------------------
    // resumoHoje
    // -------------------------------------------------------------------------
    @Nested
    class ResumoHoje {

        @Test
        void semVendas_totaisZerados() {
            when(orderRepository.findByCompanyIdAndCreatedAtBetween(eq(COMPANY_ID), any(), any()))
                    .thenReturn(List.of());
            when(fechamentoRepository.existsByCompanyIdAndDataReferencia(COMPANY_ID, LocalDate.now()))
                    .thenReturn(false);

            var resumo = fechamentoCaixaService.resumoHoje();

            assertThat(resumo.getTotalGeral()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(resumo.getQuantidadeVendas()).isZero();
            assertThat(resumo.isJaFechado()).isFalse();
        }

        @Test
        void comVendas_agregaPorFormaPagamento() {
            Order dinheiro1 = pedido(FormaPagamento.DINHEIRO, "50.00");
            Order dinheiro2 = pedido(FormaPagamento.DINHEIRO, "30.00");
            Order cartao    = pedido(FormaPagamento.CARTAO,   "100.00");
            Order pix       = pedido(FormaPagamento.PIX,      "75.00");

            when(orderRepository.findByCompanyIdAndCreatedAtBetween(eq(COMPANY_ID), any(), any()))
                    .thenReturn(List.of(dinheiro1, dinheiro2, cartao, pix));
            when(fechamentoRepository.existsByCompanyIdAndDataReferencia(any(), any())).thenReturn(false);

            var resumo = fechamentoCaixaService.resumoHoje();

            assertThat(resumo.getTotalDinheiro()).isEqualByComparingTo("80.00");
            assertThat(resumo.getTotalCartao()).isEqualByComparingTo("100.00");
            assertThat(resumo.getTotalPix()).isEqualByComparingTo("75.00");
            assertThat(resumo.getTotalDebito()).isEqualByComparingTo("0.00");
            assertThat(resumo.getTotalGeral()).isEqualByComparingTo("255.00");
            assertThat(resumo.getQuantidadeVendas()).isEqualTo(4L);
        }

        @Test
        void jaFechado_retornaFlagTrue() {
            when(orderRepository.findByCompanyIdAndCreatedAtBetween(eq(COMPANY_ID), any(), any()))
                    .thenReturn(List.of());
            when(fechamentoRepository.existsByCompanyIdAndDataReferencia(COMPANY_ID, LocalDate.now()))
                    .thenReturn(true);

            var resumo = fechamentoCaixaService.resumoHoje();

            assertThat(resumo.isJaFechado()).isTrue();
        }
    }

    // -------------------------------------------------------------------------
    // fechar
    // -------------------------------------------------------------------------
    @Nested
    class Fechar {

        @Test
        void caixaJaFechado_lancaException() {
            when(orderRepository.findByCompanyIdAndCreatedAtBetween(eq(COMPANY_ID), any(), any()))
                    .thenReturn(List.of());
            when(fechamentoRepository.existsByCompanyIdAndDataReferencia(COMPANY_ID, LocalDate.now()))
                    .thenReturn(true);

            FechamentoCaixaRequest req = new FechamentoCaixaRequest();

            assertThatThrownBy(() -> fechamentoCaixaService.fechar(req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Caixa já foi fechado hoje");
        }

        @Test
        void fechar_calculaDiferencaCorretamente() {
            Order venda = pedido(FormaPagamento.DINHEIRO, "200.00");
            when(orderRepository.findByCompanyIdAndCreatedAtBetween(eq(COMPANY_ID), any(), any()))
                    .thenReturn(List.of(venda));
            when(fechamentoRepository.existsByCompanyIdAndDataReferencia(any(), any())).thenReturn(false);
            when(fechamentoRepository.save(any())).thenAnswer(i -> {
                FechamentoCaixa fc = i.getArgument(0);
                fc.setId(1L);
                return fc;
            });

            FechamentoCaixaRequest req = new FechamentoCaixaRequest();
            req.setValorInformadoDinheiro(new BigDecimal("180.00"));

            var response = fechamentoCaixaService.fechar(req);

            // 180 - 200 = -20
            assertThat(response.getDiferencaDinheiro()).isEqualByComparingTo("-20.00");
        }

        @Test
        void fechar_semValorInformado_usaTotalDinheiro() {
            Order venda = pedido(FormaPagamento.DINHEIRO, "150.00");
            when(orderRepository.findByCompanyIdAndCreatedAtBetween(eq(COMPANY_ID), any(), any()))
                    .thenReturn(List.of(venda));
            when(fechamentoRepository.existsByCompanyIdAndDataReferencia(any(), any())).thenReturn(false);
            when(fechamentoRepository.save(any())).thenAnswer(i -> {
                FechamentoCaixa fc = i.getArgument(0);
                fc.setId(1L);
                return fc;
            });

            FechamentoCaixaRequest req = new FechamentoCaixaRequest();
            // valorInformadoDinheiro = null → usa totalDinheiro

            var response = fechamentoCaixaService.fechar(req);

            assertThat(response.getDiferencaDinheiro()).isEqualByComparingTo("0.00");
        }

        @Test
        void fechar_nomeOperadorExtraido() {
            when(orderRepository.findByCompanyIdAndCreatedAtBetween(eq(COMPANY_ID), any(), any()))
                    .thenReturn(List.of());
            when(fechamentoRepository.existsByCompanyIdAndDataReferencia(any(), any())).thenReturn(false);
            when(fechamentoRepository.save(any())).thenAnswer(i -> {
                FechamentoCaixa fc = i.getArgument(0);
                fc.setId(1L);
                return fc;
            });

            var response = fechamentoCaixaService.fechar(new FechamentoCaixaRequest());

            assertThat(response.getNomeOperador()).isEqualTo("operador@empresa.com");
        }
    }

    // -------------------------------------------------------------------------
    // helpers
    // -------------------------------------------------------------------------
    private Order pedido(FormaPagamento forma, String total) {
        return Order.builder()
                .companyId(COMPANY_ID)
                .formaPagamento(forma)
                .total(new BigDecimal(total))
                .createdAt(LocalDateTime.now())
                .build();
    }
}
