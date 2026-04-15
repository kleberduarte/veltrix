package com.veltrix.dto.fechamentocaixa;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class FechamentoCaixaRequest {
    private Long terminalId;
    private BigDecimal valorInformadoDinheiro;
}
