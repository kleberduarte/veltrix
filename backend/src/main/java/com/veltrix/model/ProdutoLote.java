package com.veltrix.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "produto_lotes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProdutoLote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "codigo_lote", nullable = false)
    private String codigoLote;

    @Column
    private LocalDate validade;

    @Column(name = "quantidade_atual", nullable = false)
    @Builder.Default
    private Integer quantidadeAtual = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() { this.updatedAt = LocalDateTime.now(); }
}
