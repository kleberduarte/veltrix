package com.veltrix.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String name;
    private String email;
    private Long companyId;
    private String companyName;
    private String accessToken;
    private String role;
    private Boolean mustChangePassword;
    /** Convite PDV: senha a definir em /primeiro-acesso (sem senha no cadastro). */
    private Boolean inviteSelfRegistration;
}
