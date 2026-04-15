package com.veltrix.model;

import com.veltrix.model.enums.Segmento;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "parametros_empresa")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ParametroEmpresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false, unique = true)
    private Long companyId;

    @Column(name = "nome_empresa")
    private String nomeEmpresa;

    @Column(name = "logo_url", columnDefinition = "TEXT")
    private String logoUrl;

    @Column(name = "mensagem_boas_vindas")
    private String mensagemBoasVindas;

    // Cores
    @Column(name = "cor_primaria")
    @Builder.Default
    private String corPrimaria = "#2563eb";

    @Column(name = "cor_secundaria")
    @Builder.Default
    private String corSecundaria = "#1e3a8a";

    @Column(name = "cor_fundo")
    @Builder.Default
    private String corFundo = "#f9fafb";

    @Column(name = "cor_texto")
    @Builder.Default
    private String corTexto = "#111827";

    @Column(name = "cor_botao")
    @Builder.Default
    private String corBotao = "#2563eb";

    @Column(name = "cor_botao_texto")
    @Builder.Default
    private String corBotaoTexto = "#ffffff";

    // Contato
    @Column(name = "chave_pix")
    private String chavePix;

    @Column(name = "suporte_email")
    private String suporteEmail;

    @Column(name = "suporte_whatsapp")
    private String suporteWhatsapp;

    // Segmento e módulos
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private Segmento segmento = Segmento.GERAL;

    // Módulo Farmácia
    @Column(name = "modulo_farmacia_ativo")
    @Builder.Default
    private Boolean moduloFarmaciaAtivo = false;

    @Column(name = "farmacia_lote_validade_obrigatorio")
    @Builder.Default
    private Boolean farmaciaLoteValidadeObrigatorio = false;

    @Column(name = "farmacia_controlados_ativo")
    @Builder.Default
    private Boolean farmaciaControladosAtivo = false;

    @Column(name = "farmacia_antimicrobianos_ativo")
    @Builder.Default
    private Boolean farmaciaAntimicrobianosAtivo = false;

    @Column(name = "farmacia_pmc_ativo")
    @Builder.Default
    private Boolean farmaciaPmcAtivo = false;

    @Column(name = "farmacia_pmc_modo")
    @Builder.Default
    private String farmaciaPmcModo = "ALERTA"; // ALERTA ou BLOQUEIO

    // Módulo Informática / OS
    @Column(name = "modulo_informatica_ativo")
    @Builder.Default
    private Boolean moduloInformaticaAtivo = false;

    @Column(name = "cnpj")
    private String cnpj;

    @Column(name = "telefone_comercial")
    private String telefoneComercial;

    @Column(name = "email_comercial")
    private String emailComercial;

    @Column(name = "endereco_linha1_os", columnDefinition = "TEXT")
    private String enderecoLinha1Os;

    @Column(name = "cidade_uf_os", length = 200)
    private String cidadeUfOs;

    @Column(name = "inscricao_municipal", length = 40)
    private String inscricaoMunicipal;

    @Column(name = "fax", length = 40)
    private String fax;

    @Column(name = "texto_termos_os", columnDefinition = "TEXT")
    private String textoTermosOs;

    @Column(nullable = false)
    @Builder.Default
    private Boolean ativo = true;
}
