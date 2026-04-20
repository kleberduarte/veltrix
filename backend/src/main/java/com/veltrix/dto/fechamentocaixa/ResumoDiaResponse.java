package com.veltrix.dto.fechamentocaixa;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class ResumoDiaResponse {
    private Long quantidadeVendas;
    private BigDecimal totalDinheiro;
    private BigDecimal totalCartao;
    private BigDecimal totalDebito;
    private BigDecimal totalPix;
    private BigDecimal totalVoucher;
    private BigDecimal totalGeral;
    private boolean jaFechado;
}
