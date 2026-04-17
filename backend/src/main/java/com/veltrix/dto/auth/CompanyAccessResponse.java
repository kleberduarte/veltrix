package com.veltrix.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CompanyAccessResponse {
    private Long companyId;
    private String companyName;
    private String nomeEmpresa;
    private String logoUrl;
    private String corPrimaria;
    private String corSecundaria;
    private String corBotao;
    private String corBotaoTexto;
}
