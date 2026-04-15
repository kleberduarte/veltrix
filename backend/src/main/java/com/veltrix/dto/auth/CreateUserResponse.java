package com.veltrix.dto.auth;

import com.veltrix.model.enums.Role;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CreateUserResponse {
    private Long id;
    private String name;
    private String email;
    private Role role;
    private Long companyId;
    private String companyName;
    private String telefone;
    private Boolean mustChangePassword;
    /** Senha em texto (somente quando gerada automaticamente). */
    private String senhaTemporaria;
    private Long pdvTerminalId;
    private String pdvTerminalCodigo;
}
