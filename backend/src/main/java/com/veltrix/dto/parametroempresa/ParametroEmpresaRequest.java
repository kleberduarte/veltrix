package com.veltrix.dto.parametroempresa;

import com.veltrix.model.enums.Segmento;
import com.veltrix.model.enums.TipoEstabelecimentoFastFood;
import lombok.Data;

@Data
public class ParametroEmpresaRequest {
    private String nomeEmpresa;
    private String logoUrl;
    private String mensagemBoasVindas;
    private String corPrimaria;
    private String corSecundaria;
    private String corFundo;
    private String corTexto;
    private String corBotao;
    private String corBotaoTexto;
    private String chavePix;
    private String suporteEmail;
    private String suporteWhatsapp;
    private Segmento segmento;
    // Farmácia
    private Boolean moduloFarmaciaAtivo;
    private Boolean farmaciaLoteValidadeObrigatorio;
    private Boolean farmaciaControladosAtivo;
    private Boolean farmaciaAntimicrobianosAtivo;
    private Boolean farmaciaPmcAtivo;
    private String farmaciaPmcModo;
    // Informática
    private Boolean moduloInformaticaAtivo;
    // Fast Food / Totem
    private Boolean moduloFastFoodAtivo;
    private TipoEstabelecimentoFastFood tipoEstabelecimentoFastFood;
    private String cnpj;
    private String inscricaoMunicipal;
    private String telefoneComercial;
    private String fax;
    private String emailComercial;
    private String enderecoLinha1Os;
    private String cidadeUfOs;
    private String textoTermosOs;
}
