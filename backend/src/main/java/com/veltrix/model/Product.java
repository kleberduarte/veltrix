package com.veltrix.model;

import com.veltrix.model.enums.TipoControle;
import com.veltrix.model.enums.TipoProduto;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    // Identificação
    @Column(name = "codigo_produto")
    private String codigoProduto;

    @Column(name = "gtin_ean")
    private String gtinEan;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Column
    private String categoria;

    // Preços
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "preco_promocional", precision = 10, scale = 2)
    private BigDecimal precoPromocional;

    @Column(name = "promocao_inicio")
    private LocalDate promocaoInicio;

    @Column(name = "promocao_fim")
    private LocalDate promocaoFim;

    @Column(name = "em_promocao", nullable = false)
    @Builder.Default
    private Boolean emPromocao = false;

    // Promoção por quantidade (Leve X Pague Y)
    @Column(name = "promo_qtd_levar")
    @Builder.Default
    private Integer promoQtdLevar = 0;

    @Column(name = "promo_qtd_pagar")
    @Builder.Default
    private Integer promoQtdPagar = 0;

    // Estoque
    @Column(nullable = false)
    @Builder.Default
    private Integer stock = 0;

    @Column(name = "estoque_minimo")
    @Builder.Default
    private Integer estoqueMinimo = 0;

    // Tipo
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private TipoProduto tipo = TipoProduto.UNIDADE;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_controle", length = 30)
    @Builder.Default
    private TipoControle tipoControle = TipoControle.COMUM;

    // Flags farmácia
    @Column(name = "exige_receita", nullable = false)
    @Builder.Default
    private Boolean exigeReceita = false;

    @Column(name = "exige_lote", nullable = false)
    @Builder.Default
    private Boolean exigeLote = false;

    @Column(name = "exige_validade", nullable = false)
    @Builder.Default
    private Boolean exigeValidade = false;

    @Column(name = "registro_ms")
    private String registroMs;

    @Column(name = "pmc", precision = 10, scale = 2)
    private BigDecimal pmc;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() { this.updatedAt = LocalDateTime.now(); }
}
