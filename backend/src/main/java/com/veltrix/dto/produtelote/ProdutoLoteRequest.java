package com.veltrix.dto.produtelote;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class ProdutoLoteRequest {
    @NotNull
    private Long productId;

    @NotBlank
    private String codigoLote;

    private LocalDate validade;

    @NotNull
    private Integer quantidadeAtual;
}
