package com.veltrix.service;

import com.veltrix.dto.order.OrderItemRequest;
import com.veltrix.dto.order.OrderRequest;
import com.veltrix.model.*;
import com.veltrix.model.enums.FormaPagamento;
import com.veltrix.repository.*;
import com.veltrix.security.TenantContext;
import jakarta.persistence.EntityNotFoundException;
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
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock private OrderRepository orderRepository;
    @Mock private ProductRepository productRepository;
    @Mock private PmcReferenciaRepository pmcReferenciaRepository;
    @Mock private CashFlowService cashFlowService;
    @Mock private ProductService productService;
    @Mock private UserRepository userRepository;
    @Mock private PdvTerminalService pdvTerminalService;
    @Mock private ParametroEmpresaRepository parametroEmpresaRepository;

    @InjectMocks
    private OrderService orderService;

    private static final Long COMPANY_ID = 1L;
    private User usuarioAtual;
    private PdvTerminal terminal;

    @BeforeEach
    void setup() {
        TenantContext.setCompanyId(COMPANY_ID);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("vendedor@empresa.com", null, List.of()));

        usuarioAtual = new User();
        usuarioAtual.setId(1L);
        usuarioAtual.setEmail("vendedor@empresa.com");
        usuarioAtual.setName("Vendedor");

        terminal = new PdvTerminal();
        terminal.setId(1L);
        terminal.setCodigo("V-1");

        when(userRepository.findByEmail("vendedor@empresa.com")).thenReturn(Optional.of(usuarioAtual));
        when(pdvTerminalService.resolveTerminalForPdv(any(), any(), any())).thenReturn(terminal);
    }

    @AfterEach
    void teardown() {
        TenantContext.clear();
        SecurityContextHolder.clearContext();
    }

    // -------------------------------------------------------------------------
    // Estoque
    // -------------------------------------------------------------------------
    @Nested
    class ValidacaoEstoque {

        @Test
        void estoqueInsuficiente_lancaException() {
            Product produto = produtoBase(new BigDecimal("10.00"), 2);
            when(productRepository.findByIdAndCompanyId(1L, COMPANY_ID)).thenReturn(Optional.of(produto));

            assertThatThrownBy(() -> orderService.create(pedidoRequest(1L, 5, FormaPagamento.DINHEIRO)))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Estoque insuficiente");
        }

        @Test
        void estoqueExato_permitido() {
            Product produto = produtoBase(new BigDecimal("10.00"), 3);
            when(productRepository.findByIdAndCompanyId(1L, COMPANY_ID)).thenReturn(Optional.of(produto));
            when(productService.calcularPrecoEfetivo(produto, 3)).thenReturn(new BigDecimal("30.00"));
            when(orderRepository.save(any())).thenAnswer(i -> {
                Order o = i.getArgument(0);
                o.setId(1L);
                o.setItems(List.of());
                return o;
            });

            assertThatCode(() -> orderService.create(pedidoRequest(1L, 3, FormaPagamento.DINHEIRO)))
                    .doesNotThrowAnyException();
        }

        @Test
        void aposVenda_estoqueDecrementado() {
            Product produto = produtoBase(new BigDecimal("10.00"), 10);
            when(productRepository.findByIdAndCompanyId(1L, COMPANY_ID)).thenReturn(Optional.of(produto));
            when(productService.calcularPrecoEfetivo(produto, 3)).thenReturn(new BigDecimal("30.00"));
            when(orderRepository.save(any())).thenAnswer(i -> {
                Order o = i.getArgument(0);
                o.setId(1L);
                o.setItems(List.of());
                return o;
            });

            orderService.create(pedidoRequest(1L, 3, FormaPagamento.DINHEIRO));

            assertThat(produto.getStock()).isEqualTo(7);
        }

        @Test
        void produtoNaoEncontrado_lancaException() {
            when(productRepository.findByIdAndCompanyId(99L, COMPANY_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> orderService.create(pedidoRequest(99L, 1, FormaPagamento.DINHEIRO)))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Produto não encontrado");
        }
    }

    // -------------------------------------------------------------------------
    // Forma de pagamento VOUCHER
    // -------------------------------------------------------------------------
    @Nested
    class VoucherPagamento {

        @Test
        void voucher_moduloFastFoodDesativado_lancaException() {
            ParametroEmpresa param = new ParametroEmpresa();
            param.setModuloFastFoodAtivo(false);
            when(parametroEmpresaRepository.findByCompanyId(COMPANY_ID)).thenReturn(Optional.of(param));

            assertThatThrownBy(() -> orderService.create(pedidoRequest(1L, 1, FormaPagamento.VOUCHER)))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("voucher");
        }

        @Test
        void voucher_moduloFastFoodAtivo_permitido() {
            ParametroEmpresa param = new ParametroEmpresa();
            param.setModuloFastFoodAtivo(true);
            when(parametroEmpresaRepository.findByCompanyId(COMPANY_ID)).thenReturn(Optional.of(param));

            Product produto = produtoBase(new BigDecimal("15.00"), 10);
            when(productRepository.findByIdAndCompanyId(1L, COMPANY_ID)).thenReturn(Optional.of(produto));
            when(productService.calcularPrecoEfetivo(produto, 1)).thenReturn(new BigDecimal("15.00"));
            when(orderRepository.save(any())).thenAnswer(i -> {
                Order o = i.getArgument(0);
                o.setId(1L);
                o.setItems(List.of());
                return o;
            });

            assertThatCode(() -> orderService.create(pedidoRequest(1L, 1, FormaPagamento.VOUCHER)))
                    .doesNotThrowAnyException();
        }
    }

    // -------------------------------------------------------------------------
    // Parcelas
    // -------------------------------------------------------------------------
    @Nested
    class Parcelas {

        @Test
        void naoCartao_parcelasForçadas1() {
            Product produto = produtoBase(new BigDecimal("10.00"), 10);
            when(productRepository.findByIdAndCompanyId(1L, COMPANY_ID)).thenReturn(Optional.of(produto));
            when(productService.calcularPrecoEfetivo(any(), anyInt())).thenReturn(new BigDecimal("10.00"));
            when(orderRepository.save(any())).thenAnswer(i -> {
                Order o = i.getArgument(0);
                o.setId(1L);
                o.setItems(List.of());
                return o;
            });

            OrderRequest req = pedidoRequest(1L, 1, FormaPagamento.PIX);
            req.setParcelas(5); // deve ser ignorado para PIX

            var response = orderService.create(req);

            assertThat(response.getParcelas()).isEqualTo(1);
        }

        @Test
        void cartao_parcelasRespeitadas() {
            Product produto = produtoBase(new BigDecimal("10.00"), 10);
            when(productRepository.findByIdAndCompanyId(1L, COMPANY_ID)).thenReturn(Optional.of(produto));
            when(productService.calcularPrecoEfetivo(any(), anyInt())).thenReturn(new BigDecimal("10.00"));
            when(orderRepository.save(any())).thenAnswer(i -> {
                Order o = i.getArgument(0);
                o.setId(1L);
                o.setParcelas(3);
                o.setItems(List.of());
                return o;
            });

            OrderRequest req = pedidoRequest(1L, 1, FormaPagamento.CARTAO);
            req.setParcelas(3);

            var response = orderService.create(req);

            assertThat(response.getParcelas()).isEqualTo(3);
        }
    }

    // -------------------------------------------------------------------------
    // Cálculo de total
    // -------------------------------------------------------------------------
    @Nested
    class CalculoTotal {

        @Test
        void total_subtotalMenosDesconto() {
            Product produto = produtoBase(new BigDecimal("100.00"), 10);
            when(productRepository.findByIdAndCompanyId(1L, COMPANY_ID)).thenReturn(Optional.of(produto));
            when(productService.calcularPrecoEfetivo(produto, 2)).thenReturn(new BigDecimal("200.00"));
            when(orderRepository.save(any())).thenAnswer(i -> {
                Order o = i.getArgument(0);
                o.setId(1L);
                o.setItems(List.of());
                return o;
            });

            OrderRequest req = pedidoRequest(1L, 2, FormaPagamento.DINHEIRO);
            req.setDesconto(new BigDecimal("20.00"));

            var response = orderService.create(req);

            assertThat(response.getTotal()).isEqualByComparingTo("180.00");
        }

        @Test
        void total_descontoMaiorQueSubtotal_totalZero() {
            Product produto = produtoBase(new BigDecimal("50.00"), 10);
            when(productRepository.findByIdAndCompanyId(1L, COMPANY_ID)).thenReturn(Optional.of(produto));
            when(productService.calcularPrecoEfetivo(produto, 1)).thenReturn(new BigDecimal("50.00"));
            when(orderRepository.save(any())).thenAnswer(i -> {
                Order o = i.getArgument(0);
                o.setId(1L);
                o.setItems(List.of());
                return o;
            });

            OrderRequest req = pedidoRequest(1L, 1, FormaPagamento.DINHEIRO);
            req.setDesconto(new BigDecimal("200.00")); // maior que subtotal

            var response = orderService.create(req);

            assertThat(response.getTotal()).isEqualByComparingTo("0.00");
        }

        @Test
        void vendaRegistraCashFlow() {
            Product produto = produtoBase(new BigDecimal("100.00"), 10);
            when(productRepository.findByIdAndCompanyId(1L, COMPANY_ID)).thenReturn(Optional.of(produto));
            when(productService.calcularPrecoEfetivo(produto, 1)).thenReturn(new BigDecimal("100.00"));
            when(orderRepository.save(any())).thenAnswer(i -> {
                Order o = i.getArgument(0);
                o.setId(42L);
                o.setItems(List.of());
                return o;
            });

            orderService.create(pedidoRequest(1L, 1, FormaPagamento.DINHEIRO));

            verify(cashFlowService).recordCredit(eq(COMPANY_ID), eq(new BigDecimal("100.00")), eq("Venda #42"));
        }
    }

    // -------------------------------------------------------------------------
    // PMC
    // -------------------------------------------------------------------------
    @Nested
    class ValidacaoPmc {

        @Test
        void semRegistroMsEGtin_naoConsultaRepositorio() {
            Product produto = produtoBase(new BigDecimal("10.00"), 10);
            // registroMs e gtinEan já são null no produtoBase
            when(productRepository.findByIdAndCompanyId(1L, COMPANY_ID)).thenReturn(Optional.of(produto));
            when(productService.calcularPrecoEfetivo(any(), anyInt())).thenReturn(new BigDecimal("10.00"));
            when(orderRepository.save(any())).thenAnswer(i -> {
                Order o = i.getArgument(0);
                o.setId(1L);
                o.setItems(List.of());
                return o;
            });

            orderService.create(pedidoRequest(1L, 1, FormaPagamento.DINHEIRO));

            verify(pmcReferenciaRepository, never()).findVigente(any(), any(), any(), any());
        }

        @Test
        void comRegistroMs_semPmcVigente_statusOk() {
            Product produto = produtoBase(new BigDecimal("10.00"), 10);
            produto.setRegistroMs("123456789");
            when(productRepository.findByIdAndCompanyId(1L, COMPANY_ID)).thenReturn(Optional.of(produto));
            when(productService.calcularPrecoEfetivo(any(), anyInt())).thenReturn(new BigDecimal("10.00"));
            when(pmcReferenciaRepository.findVigente(any(), any(), any(), any())).thenReturn(Optional.empty());
            when(orderRepository.save(any())).thenAnswer(i -> {
                Order o = i.getArgument(0);
                o.setId(1L);
                o.setItems(List.of());
                return o;
            });

            assertThatCode(() -> orderService.create(pedidoRequest(1L, 1, FormaPagamento.DINHEIRO)))
                    .doesNotThrowAnyException();
        }
    }

    // -------------------------------------------------------------------------
    // helpers
    // -------------------------------------------------------------------------
    private Product produtoBase(BigDecimal price, int stock) {
        Product p = new Product();
        p.setId(1L);
        p.setCompanyId(COMPANY_ID);
        p.setName("Produto Teste");
        p.setPrice(price);
        p.setStock(stock);
        p.setActive(true);
        p.setEmPromocao(false);
        p.setPromoQtdLevar(0);
        p.setPromoQtdPagar(0);
        return p;
    }

    private OrderRequest pedidoRequest(Long productId, int qty, FormaPagamento forma) {
        OrderItemRequest item = new OrderItemRequest();
        item.setProductId(productId);
        item.setQuantity(qty);

        OrderRequest req = new OrderRequest();
        req.setItems(List.of(item));
        req.setFormaPagamento(forma);
        req.setDesconto(BigDecimal.ZERO);
        return req;
    }
}
