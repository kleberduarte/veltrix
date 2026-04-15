package com.veltrix.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OnboardingInfoResponse {
    private Long companyId;
    private String companyName;
    // Branding da empresa para customizar a tela de onboarding
    private String nomeEmpresa;
    private String logoUrl;
    private String corPrimaria;
    private String corSecundaria;
    private String corBotao;
    private String corBotaoTexto;
}
