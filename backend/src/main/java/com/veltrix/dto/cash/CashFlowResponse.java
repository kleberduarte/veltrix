package com.veltrix.dto.cash;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class CashFlowResponse {
    private Long id;
    private String type;
    private BigDecimal amount;
    private String description;
    private LocalDateTime createdAt;
}
