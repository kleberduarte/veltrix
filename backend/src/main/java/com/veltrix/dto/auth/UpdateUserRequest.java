package com.veltrix.dto.auth;

import com.veltrix.model.enums.Role;
import lombok.Data;

@Data
public class UpdateUserRequest {
    private String name;
    private String email;
    private Role role;
    /** Nova senha (opcional). */
    private String password;
    private String telefone;
    /** Só Adm Global: altera empresa do usuário. */
    private Long companyId;
    /** Terminal PDV vinculado (null = não alterar o vínculo se omitido). */
    private Long pdvTerminalId;
    private Boolean desvincularPdv;
    private Boolean aplicarTelefone;
}
