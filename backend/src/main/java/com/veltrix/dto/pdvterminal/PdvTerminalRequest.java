package com.veltrix.dto.pdvterminal;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PdvTerminalRequest {
    @NotBlank
    private String codigo;

    @NotBlank
    private String nome;

    private Boolean ativo = true;
}
