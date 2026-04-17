package com.veltrix.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SetupInitialPasswordRequest {
    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String senhaProvisoria;

    @NotBlank
    @Size(min = 6)
    private String novaSenha;
}
