package com.veltrix.dto.order;

import com.veltrix.model.enums.FormaPagamento;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class OrderResponse {
    private Long id;
    private BigDecimal subtotal;
    private BigDecimal desconto;
    private BigDecimal total;
    private String status;
    private FormaPagamento formaPagamento;
    private Integer parcelas;
    private String cpfCliente;
    private Long clienteId;
    private String nomeOperador;
    private LocalDateTime createdAt;
    private List<OrderItemResponse> items;

    @Data
    public static class OrderItemResponse {
        private Long productId;
        private String productName;
        private Integer quantity;
        private BigDecimal price;
        private BigDecimal subtotal;
        private String loteCodigo;
        private String pmcStatus;
    }
}
