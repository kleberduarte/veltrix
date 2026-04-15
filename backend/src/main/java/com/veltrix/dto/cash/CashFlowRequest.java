package com.veltrix.dto.cash;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class CashFlowRequest {
    @NotBlank @Pattern(regexp = "IN|OUT")
    private String type;

    @NotNull @DecimalMin("0.01")
    private BigDecimal amount;

    private String description;
}
