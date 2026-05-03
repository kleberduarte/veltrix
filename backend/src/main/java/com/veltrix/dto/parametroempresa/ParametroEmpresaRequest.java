package com.veltrix.dto.parametroempresa;

import com.veltrix.model.enums.Segmento;
import com.veltrix.model.enums.TipoEstabelecimentoFastFood;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ParametroEmpresaRequest {
    @Size(max = 255)
    private String nomeEmpresa;

    @Size(max = 1000)
    private String logoUrl;

    @Size(max = 500)
    private String mensagemBoasVindas;

    @Size(max = 7)
    private String corPrimaria;

    @Size(max = 7)
    private String corSecundaria;

    @Size(max = 7)
    private String corFundo;

    @Size(max = 7)
    private String corTexto;

    @Size(max = 7)
    private String corBotao;

    @Size(max = 7)
    private String corBotaoTexto;

    @Size(max = 100)
    private String chavePix;

    @Size(max = 255)
    private String suporteEmail;

    @Size(max = 20)
    private String suporteWhatsapp;

    private Segmento segmento;

    // Farmácia
    private Boolean moduloFarmaciaAtivo;
    private Boolean farmaciaLoteValidadeObrigatorio;
    private Boolean farmaciaControladosAtivo;
    private Boolean farmaciaAntimicrobianosAtivo;
    private Boolean farmaciaPmcAtivo;

    @Size(max = 20)
    private String farmaciaPmcModo;

    // Informática
    private Boolean moduloInformaticaAtivo;

    // Fast Food / Totem
    private Boolean moduloFastFoodAtivo;
    private TipoEstabelecimentoFastFood tipoEstabelecimentoFastFood;

    @Size(max = 18)
    private String cnpj;

    @Size(max = 30)
    private String inscricaoMunicipal;

    @Size(max = 20)
    private String telefoneComercial;

    @Size(max = 20)
    private String fax;

    @Size(max = 255)
    private String emailComercial;

    @Size(max = 300)
    private String enderecoLinha1Os;

    @Size(max = 100)
    private String cidadeUfOs;

    @Size(max = 5000)
    private String textoTermosOs;
}
