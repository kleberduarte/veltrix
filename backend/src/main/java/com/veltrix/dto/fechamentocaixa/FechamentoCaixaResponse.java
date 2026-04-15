package com.veltrix.dto.fechamentocaixa;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class FechamentoCaixaResponse {
    private Long id;
    private String nomeOperador;
    private LocalDate dataReferencia;
    private LocalDateTime dataFechamento;
    private Long quantidadeVendas;
    private BigDecimal totalDinheiro;
    private BigDecimal totalCartao;
    private BigDecimal totalDebito;
    private BigDecimal totalPix;
    private BigDecimal totalGeral;
    private BigDecimal valorInformadoDinheiro;
    private BigDecimal diferencaDinheiro;
}
