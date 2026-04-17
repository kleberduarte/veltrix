package com.veltrix.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank @Email
    private String email;

    @NotBlank
    private String name;

    /** Opcional no convite PDV: vazio = senha definida na tela /primeiro-acesso. */
    private String password;

    @NotBlank
    @Size(max = 40)
    private String codigoConvite;
}
