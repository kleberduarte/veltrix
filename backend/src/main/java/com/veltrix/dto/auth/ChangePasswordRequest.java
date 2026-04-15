package com.veltrix.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChangePasswordRequest {
    @NotBlank
    private String senhaAtual;

    @NotBlank @Size(min = 6)
    private String novaSenha;
}
