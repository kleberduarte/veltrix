package com.veltrix.model;

import com.veltrix.model.enums.FormaPagamento;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "usuario_id")
    private Long usuarioId;

    @Column(name = "nome_operador")
    private String nomeOperador;

    @Column(name = "cpf_cliente")
    private String cpfCliente;

    @Column(name = "cliente_id")
    private Long clienteId;

    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal desconto = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal total;

    @Enumerated(EnumType.STRING)
    @Column(name = "forma_pagamento", nullable = false, length = 20, columnDefinition = "varchar(20)")
    @Builder.Default
    private FormaPagamento formaPagamento = FormaPagamento.DINHEIRO;

    @Column
    @Builder.Default
    private Integer parcelas = 1;

    @Column(name = "chave_pix")
    private String chavePix;

    @Column(nullable = false)
    @Builder.Default
    private String status = "COMPLETED";

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();
}
