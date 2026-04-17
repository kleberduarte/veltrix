package com.veltrix.dto.auth;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MeResponse {
    private Long userId;
    private String name;
    private String email;
    private Long companyId;
    private String companyName;
    private String accessToken;
    private String role;
    private Boolean mustChangePassword;
    /** Convite PDV: primeiro acesso só pede nova senha (sem senha atual). */
    private Boolean inviteSelfRegistration;
    private String telefone;
    private Long pdvTerminalId;
    private String pdvTerminalCodigo;
}
