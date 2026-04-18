package com.veltrix.model;

import com.veltrix.model.enums.StatusOrdemServico;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "ordens_servico")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrdemServico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "numero_os", nullable = false)
    private Long numeroOs;

    // Cliente
    @Column(name = "cliente_id")
    private Long clienteId;

    @Column(name = "nome_cliente", nullable = false)
    private String nomeCliente;

    @Column(name = "telefone_cliente")
    private String telefoneCliente;

    @Column(name = "contato_cliente")
    private String contatoCliente;

    // Equipamento
    @Column
    private String equipamento;

    @Column
    private String marca;

    @Column
    private String modelo;

    @Column(name = "numero_serie")
    private String numeroSerie;

    @Column
    private String acessorios;

    // Diagnóstico
    @Column(name = "defeito_relatado", columnDefinition = "TEXT")
    private String defeitoRelatado;

    @Column(columnDefinition = "TEXT")
    private String diagnostico;

    @Column(name = "servico_executado", columnDefinition = "TEXT")
    private String servicoExecutado;

    @Column(name = "tecnico_responsavel")
    private String tecnicoResponsavel;

    @Column(columnDefinition = "TEXT")
    private String observacao;

    // Financeiro
    @Column(name = "valor_servico", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal valorServico = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal desconto = BigDecimal.ZERO;

    @Column(name = "valor_total", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal valorTotal = BigDecimal.ZERO;

    // Status e datas (VARCHAR como em User.role — evita ENUM nativo MySQL no validate)
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private StatusOrdemServico status = StatusOrdemServico.ABERTA;

    @Column(name = "data_abertura", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime dataAbertura = LocalDateTime.now();

    @Column(name = "data_previsao_entrega")
    private LocalDate dataPrevisaoEntrega;

    @Column(name = "data_conclusao")
    private LocalDateTime dataConclusao;

    @Column(name = "data_entrega")
    private LocalDateTime dataEntrega;

    @Column(name = "venda_id")
    private Long vendaId;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() { this.updatedAt = LocalDateTime.now(); }
}
