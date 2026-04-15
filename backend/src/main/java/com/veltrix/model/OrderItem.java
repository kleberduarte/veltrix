package com.veltrix.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    // Rastreabilidade farmácia
    @Column(name = "lote_codigo")
    private String loteCodigo;

    @Column(name = "lote_validade")
    private String loteValidade;

    // Receita
    @Column(name = "receita_tipo")
    private String receitaTipo;

    @Column(name = "receita_numero")
    private String receitaNumero;

    @Column(name = "receita_prescritor")
    private String receitaPrescritor;

    @Column(name = "receita_data")
    private String receitaData;

    // PMC
    @Column(name = "pmc_aplicado", precision = 10, scale = 2)
    private BigDecimal pmcAplicado;

    @Column(name = "pmc_status")
    private String pmcStatus; // OK, AVISO, VIOLACAO
}
