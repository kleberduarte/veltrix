package com.veltrix.dto.order;

import com.veltrix.model.enums.FormaPagamento;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class OrderRequest {
    @NotEmpty @Valid
    private List<OrderItemRequest> items;

    private FormaPagamento formaPagamento = FormaPagamento.DINHEIRO;
    private Integer parcelas = 1;
    private String chavePix;
    private String cpfCliente;
    private Long clienteId;
    private BigDecimal desconto = BigDecimal.ZERO;
    private Long terminalId;
}
