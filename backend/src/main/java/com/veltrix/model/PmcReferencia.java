package com.veltrix.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "pmc_referencias")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PmcReferencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "product_id")
    private Long productId;

    @Column(name = "registro_ms")
    private String registroMs;

    @Column(name = "gtin_ean")
    private String gtinEan;

    @Column
    private String descricao;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal pmc;

    @Column(name = "vigencia_inicio")
    private LocalDate vigenciaInicio;

    @Column(name = "vigencia_fim")
    private LocalDate vigenciaFim;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
