package com.veltrix.dto.produtelote;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class ProdutoLoteResponse {
    private Long id;
    private Long productId;
    private String codigoLote;
    private LocalDate validade;
    private Integer quantidadeAtual;
    private LocalDateTime createdAt;
}
