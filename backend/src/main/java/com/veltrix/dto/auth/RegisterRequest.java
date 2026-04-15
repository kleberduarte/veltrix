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

    @NotBlank @Size(min = 4)
    private String password;

    @Size(max = 40)
    private String codigoConvite;
}
