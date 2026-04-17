package com.veltrix.dto.auth;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class CompanySummaryResponse {
    private Long id;
    private String name;
    private Boolean systemDefault;
    /** Token permanente para URL exclusiva de acesso da empresa. */
    private String accessToken;
    /** Código de convite PDV (vendedor no login) — preenchido ao criar empresa ou quando aplicável. */
    private String pdvInviteCode;

    public CompanySummaryResponse(Long id, String name, Boolean systemDefault) {
        this.id = id;
        this.name = name;
        this.systemDefault = systemDefault;
    }

    public CompanySummaryResponse(Long id, String name, Boolean systemDefault, String accessToken) {
        this.id = id;
        this.name = name;
        this.systemDefault = systemDefault;
        this.accessToken = accessToken;
    }
}
