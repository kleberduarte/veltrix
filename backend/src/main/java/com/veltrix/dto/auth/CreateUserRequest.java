package com.veltrix.dto.auth;

import com.veltrix.model.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateUserRequest {
    @NotBlank
    private String name;

    @NotBlank @Email
    private String email;

    /** Vazio = senha gerada automaticamente (usuário deve trocar no 1º acesso se mustChangePassword). */
    private String password;

    @NotNull
    private Role role;

    private String telefone;
    private Boolean mustChangePassword;

    /** Só Adm Global: empresa do novo usuário (omitido = empresa do token). */
    private Long companyId;

    /** Terminal PDV exclusivo (opcional); deve pertencer à empresa do usuário. */
    private Long pdvTerminalId;
}
