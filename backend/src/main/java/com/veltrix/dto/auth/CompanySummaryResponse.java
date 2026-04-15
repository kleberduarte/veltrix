package com.veltrix.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class CompanySummaryResponse {
    private Long id;
    private String name;
    private Boolean systemDefault;
    /** Visível apenas para ADM Global — token de onboarding da empresa. */
    private String onboardingToken;
    /** Token permanente para URL exclusiva de acesso da empresa. */
    private String accessToken;

    public CompanySummaryResponse(Long id, String name, Boolean systemDefault) {
        this.id = id;
        this.name = name;
        this.systemDefault = systemDefault;
    }

    public CompanySummaryResponse(Long id, String name, Boolean systemDefault, String onboardingToken) {
        this.id = id;
        this.name = name;
        this.systemDefault = systemDefault;
        this.onboardingToken = onboardingToken;
    }

    public CompanySummaryResponse(Long id, String name, Boolean systemDefault, String onboardingToken, String accessToken) {
        this.id = id;
        this.name = name;
        this.systemDefault = systemDefault;
        this.onboardingToken = onboardingToken;
        this.accessToken = accessToken;
    }
}
