package com.veltrix.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "cash_flow")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CashFlow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(nullable = false, length = 10)
    private String type; // IN or OUT

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
