package com.veltrix.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PrimeiraSenhaConviteRequest {
    @NotBlank
    @Size(min = 6, max = 128)
    private String novaSenha;
}
