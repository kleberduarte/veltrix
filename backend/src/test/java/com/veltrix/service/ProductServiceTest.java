package com.veltrix.service;

import com.veltrix.model.Product;
import com.veltrix.repository.ProductRepository;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private ProductService productService;

    private static final Long COMPANY_ID = 1L;

    @BeforeEach
    void setup() {
        TenantContext.setCompanyId(COMPANY_ID);
    }

    @AfterEach
    void teardown() {
        TenantContext.clear();
    }

    // -------------------------------------------------------------------------
    // calcularPrecoEfetivo
    // -------------------------------------------------------------------------
    @Nested
    class CalcularPrecoEfetivo {

        @Test
        void precoNormal_semPromocao() {
            Product p = produtoBase(new BigDecimal("10.00"));

            BigDecimal result = productService.calcularPrecoEfetivo(p, 3);

            assertThat(result).isEqualByComparingTo("30.00");
        }

        @Test
        void precoPromocional_quandoFlagEmPromocaoTrue() {
            Product p = produtoBase(new BigDecimal("10.00"));
            p.setEmPromocao(true);
            p.setPrecoPromocional(new BigDecimal("7.00"));

            BigDecimal result = productService.calcularPrecoEfetivo(p, 2);

            assertThat(result).isEqualByComparingTo("14.00");
        }

        @Test
        void precoPromocional_quandoDataDentroDoIntervalo() {
            Product p = produtoBase(new BigDecimal("10.00"));
            p.setEmPromocao(false);
            p.setPrecoPromocional(new BigDecimal("6.00"));
            p.setPromocaoInicio(LocalDate.now().minusDays(1));
            p.setPromocaoFim(LocalDate.now().plusDays(1));

            BigDecimal result = productService.calcularPrecoEfetivo(p, 1);

            assertThat(result).isEqualByComparingTo("6.00");
        }

        @Test
        void precoNormal_quandoDataForaDoIntervalo() {
            Product p = produtoBase(new BigDecimal("10.00"));
            p.setEmPromocao(false);
            p.setPrecoPromocional(new BigDecimal("6.00"));
            p.setPromocaoInicio(LocalDate.now().plusDays(1));
            p.setPromocaoFim(LocalDate.now().plusDays(5));

            BigDecimal result = productService.calcularPrecoEfetivo(p, 1);

            assertThat(result).isEqualByComparingTo("10.00");
        }

        @Test
        void leveXPagueY_quantidadeExata() {
            // Leve 3, Pague 2
            Product p = produtoBase(new BigDecimal("10.00"));
            p.setPromoQtdLevar(3);
            p.setPromoQtdPagar(2);

            // 3 unidades → paga 2
            BigDecimal result = productService.calcularPrecoEfetivo(p, 3);

            assertThat(result).isEqualByComparingTo("20.00");
        }

        @Test
        void leveXPagueY_quantidadeMultipla() {
            // Leve 3, Pague 2 → 6 unidades = 2 grupos × 2 = paga 4
            Product p = produtoBase(new BigDecimal("10.00"));
            p.setPromoQtdLevar(3);
            p.setPromoQtdPagar(2);

            BigDecimal result = productService.calcularPrecoEfetivo(p, 6);

            assertThat(result).isEqualByComparingTo("40.00");
        }

        @Test
        void leveXPagueY_quantidadeComRestante() {
            // Leve 3, Pague 2 → 4 unidades = 1 grupo (paga 2) + 1 restante = paga 3
            Product p = produtoBase(new BigDecimal("10.00"));
            p.setPromoQtdLevar(3);
            p.setPromoQtdPagar(2);

            BigDecimal result = productService.calcularPrecoEfetivo(p, 4);

            assertThat(result).isEqualByComparingTo("30.00");
        }

        @Test
        void leveXPagueY_quantidadeMenorQueLevar_usaPrecoNormal() {
            Product p = produtoBase(new BigDecimal("10.00"));
            p.setPromoQtdLevar(3);
            p.setPromoQtdPagar(2);

            // 2 < 3 (levar), não aciona promo
            BigDecimal result = productService.calcularPrecoEfetivo(p, 2);

            assertThat(result).isEqualByComparingTo("20.00");
        }

        @Test
        void leveXPagueY_comPrecoPromocional() {
            // Promo de preço + Leve 3 Pague 2
            Product p = produtoBase(new BigDecimal("10.00"));
            p.setEmPromocao(true);
            p.setPrecoPromocional(new BigDecimal("8.00"));
            p.setPromoQtdLevar(3);
            p.setPromoQtdPagar(2);

            // 3 unidades: paga 2 × 8.00 = 16.00
            BigDecimal result = productService.calcularPrecoEfetivo(p, 3);

            assertThat(result).isEqualByComparingTo("16.00");
        }
    }

    // -------------------------------------------------------------------------
    // delete (soft delete)
    // -------------------------------------------------------------------------
    @Nested
    class Delete {

        @Test
        void delete_marcaActiveFalse() {
            Product p = produtoBase(new BigDecimal("5.00"));
            p.setId(10L);
            p.setActive(true);
            when(productRepository.findByIdAndCompanyId(10L, COMPANY_ID)).thenReturn(Optional.of(p));
            when(productRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            productService.delete(10L);

            assertThat(p.getActive()).isFalse();
            verify(productRepository).save(p);
        }

        @Test
        void delete_produtoNaoEncontrado_lancaException() {
            when(productRepository.findByIdAndCompanyId(99L, COMPANY_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> productService.delete(99L))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Produto não encontrado");
        }
    }

    // -------------------------------------------------------------------------
    // listCategorias
    // -------------------------------------------------------------------------
    @Nested
    class ListCategorias {

        @Test
        void listCategorias_retornaOrdenadoEDistinto() {
            Product p1 = produtoBase(BigDecimal.ONE); p1.setCategoria("Bebidas");
            Product p2 = produtoBase(BigDecimal.ONE); p2.setCategoria("Alimentos");
            Product p3 = produtoBase(BigDecimal.ONE); p3.setCategoria("Bebidas");
            Product p4 = produtoBase(BigDecimal.ONE); p4.setCategoria(null);
            Product p5 = produtoBase(BigDecimal.ONE); p5.setCategoria("  ");

            when(productRepository.findByCompanyIdAndActiveTrue(COMPANY_ID))
                    .thenReturn(List.of(p1, p2, p3, p4, p5));

            List<String> result = productService.listCategorias();

            assertThat(result).containsExactly("Alimentos", "Bebidas");
        }
    }

    // -------------------------------------------------------------------------
    // findByCategoria
    // -------------------------------------------------------------------------
    @Nested
    class FindByCategoria {

        @Test
        void findByCategoria_filtraCaseInsensitive() {
            Product p1 = produtoBase(BigDecimal.ONE); p1.setId(1L); p1.setCategoria("Bebidas");
            Product p2 = produtoBase(BigDecimal.ONE); p2.setId(2L); p2.setCategoria("Alimentos");

            when(productRepository.findByCompanyIdAndActiveTrue(COMPANY_ID))
                    .thenReturn(List.of(p1, p2));

            List<?> result = productService.findByCategoria("bebidas");

            assertThat(result).hasSize(1);
        }
    }

    // -------------------------------------------------------------------------
    // helpers
    // -------------------------------------------------------------------------
    private Product produtoBase(BigDecimal price) {
        return Product.builder()
                .companyId(COMPANY_ID)
                .name("Produto Teste")
                .price(price)
                .stock(100)
                .active(true)
                .build();
    }
}
