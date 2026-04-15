package com.veltrix.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "fechamentos_caixa")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FechamentoCaixa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "terminal_id")
    private Long terminalId;

    @Column(name = "usuario_id")
    private Long usuarioId;

    @Column(name = "nome_operador")
    private String nomeOperador;

    @Column(name = "data_referencia", nullable = false)
    private LocalDate dataReferencia;

    @Column(name = "quantidade_vendas", nullable = false)
    @Builder.Default
    private Long quantidadeVendas = 0L;

    @Column(name = "total_dinheiro", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal totalDinheiro = BigDecimal.ZERO;

    @Column(name = "total_cartao", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal totalCartao = BigDecimal.ZERO;

    @Column(name = "total_debito", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal totalDebito = BigDecimal.ZERO;

    @Column(name = "total_pix", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal totalPix = BigDecimal.ZERO;

    @Column(name = "total_geral", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal totalGeral = BigDecimal.ZERO;

    @Column(name = "valor_informado_dinheiro", precision = 10, scale = 2)
    private BigDecimal valorInformadoDinheiro;

    @Column(name = "diferenca_dinheiro", precision = 10, scale = 2)
    private BigDecimal diferencaDinheiro;

    @Column(name = "data_fechamento", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime dataFechamento = LocalDateTime.now();
}
