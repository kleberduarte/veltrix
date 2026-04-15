package com.veltrix.dto.order;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class OrderItemRequest {
    @NotNull
    private Long productId;

    @NotNull @Min(1)
    private Integer quantity;

    // Farmácia
    private String loteCodigo;
    private String loteValidade;
    private String receitaTipo;
    private String receitaNumero;
    private String receitaPrescritor;
    private String receitaData;
}
