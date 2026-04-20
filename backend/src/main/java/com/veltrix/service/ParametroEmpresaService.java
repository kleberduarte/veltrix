package com.veltrix.service;

import com.veltrix.dto.parametroempresa.*;
import com.veltrix.exception.ValidationException;
import com.veltrix.model.ParametroEmpresa;
import com.veltrix.repository.ParametroEmpresaRepository;
import com.veltrix.security.TenantContext;
import com.veltrix.util.CnpjValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ParametroEmpresaService {

    private static final Pattern HEX6 = Pattern.compile("^#([0-9A-Fa-f]{6})$");
    private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final int NOME_MIN = 3;
    private static final int NOME_MAX = 200;
    private static final int MSG_MAX = 500;
    private static final int URL_MAX = 2048;
    private static final int PIX_MAX = 77;
    private static final int END_OS_MAX = 2000;
    private static final int TERMOS_MAX = 20000;

    private final ParametroEmpresaRepository repository;

    public ParametroEmpresaResponse get() {
        return repository.findByCompanyId(TenantContext.getCompanyId())
                .map(this::toResponse)
                .orElse(null);
    }

    @Transactional
    public ParametroEmpresaResponse save(ParametroEmpresaRequest request) {
        Map<String, String> err = validar(request);
        if (!err.isEmpty()) {
            throw new ValidationException("Corrija os campos destacados.", err);
        }

        Long companyId = TenantContext.getCompanyId();
        ParametroEmpresa pe = repository.findByCompanyId(companyId)
                .orElse(ParametroEmpresa.builder().companyId(companyId).build());

        aplicar(request, pe);
        return toResponse(repository.save(pe));
    }

    /** Regras alinhadas ao cadastro legado: tamanhos, hex #RRGGBB, e-mail, telefone BR, CNPJ, PMC, PIX. */
    private Map<String, String> validar(ParametroEmpresaRequest req) {
        Map<String, String> e = new LinkedHashMap<>();

        {
            String nome = req.getNomeEmpresa() == null ? "" : normalizarNome(req.getNomeEmpresa());
            if (nome.length() < NOME_MIN || nome.length() > NOME_MAX) {
                e.put("nomeEmpresa", "Nome da empresa deve ter entre " + NOME_MIN + " e " + NOME_MAX + " caracteres.");
            }
        }

        if (req.getLogoUrl() != null && !req.getLogoUrl().isBlank()) {
            urlHttpOpcional("logoUrl", req.getLogoUrl().trim(), e);
        }

        if (req.getMensagemBoasVindas() != null && req.getMensagemBoasVindas().length() > MSG_MAX) {
            e.put("mensagemBoasVindas", "Mensagem de boas-vindas: no máximo " + MSG_MAX + " caracteres.");
        }

        corHex("corPrimaria", req.getCorPrimaria(), e);
        corHex("corSecundaria", req.getCorSecundaria(), e);
        corHex("corFundo", req.getCorFundo(), e);
        corHex("corTexto", req.getCorTexto(), e);
        corHex("corBotao", req.getCorBotao(), e);
        corHex("corBotaoTexto", req.getCorBotaoTexto(), e);

        if (req.getChavePix() != null) {
            String pix = req.getChavePix().trim();
            if (pix.length() > PIX_MAX) {
                e.put("chavePix", "Chave PIX deve ter no máximo " + PIX_MAX + " caracteres.");
            }
        }

        emailOpcional("suporteEmail", req.getSuporteEmail(), e);
        emailOpcional("emailComercial", req.getEmailComercial(), e);

        // suporteWhatsapp: texto livre, máx 32 chars (regra do legado)
        String wa = req.getSuporteWhatsapp();
        if (wa != null && !wa.trim().isEmpty() && wa.trim().length() > 32) {
            e.put("suporteWhatsapp", "WhatsApp de suporte: máximo 32 caracteres.");
        }
        telefoneBrOpcional("telefoneComercial", req.getTelefoneComercial(), e);

        boolean farmacia = Boolean.TRUE.equals(req.getModuloFarmaciaAtivo());
        if (farmacia && Boolean.TRUE.equals(req.getFarmaciaPmcAtivo())) {
            String modo = req.getFarmaciaPmcModo();
            if (modo != null && !modo.isBlank()) {
                String m = modo.trim().toUpperCase();
                if (!"ALERTA".equals(m) && !"BLOQUEIO".equals(m)) {
                    e.put("farmaciaPmcModo", "Modo PMC deve ser ALERTA ou BLOQUEIO.");
                }
            }
        }

        if (req.getCnpj() != null && !req.getCnpj().isBlank()) {
            String c = CnpjValidator.apenasDigitos(req.getCnpj());
            if (c.length() != 14 || !CnpjValidator.valido(c)) {
                e.put("cnpj", "CNPJ inválido. Informe 14 dígitos com dígitos verificadores válidos.");
            }
        }

        if (req.getEnderecoLinha1Os() != null && req.getEnderecoLinha1Os().length() > END_OS_MAX) {
            e.put("enderecoLinha1Os", "Endereço (OS) deve ter no máximo " + END_OS_MAX + " caracteres.");
        }
        if (req.getTextoTermosOs() != null && req.getTextoTermosOs().length() > TERMOS_MAX) {
            e.put("textoTermosOs", "Texto de termos (OS) deve ter no máximo " + TERMOS_MAX + " caracteres.");
        }

        return e;
    }

    private static String normalizarNome(String nome) {
        if (nome == null) return "";
        return nome.trim().replaceAll("\\s+", " ");
    }

    private static void corHex(String campo, String val, Map<String, String> e) {
        if (val == null || val.isBlank()) return;
        String v = val.trim();
        if (!HEX6.matcher(v).matches()) {
            e.put(campo, "Use cor em hexadecimal no formato #RRGGBB (ex.: #2563eb).");
        }
    }

    private static void urlHttpOpcional(String campo, String url, Map<String, String> e) {
        if (url.length() > URL_MAX) {
            e.put(campo, "URL muito longa (máx. " + URL_MAX + " caracteres).");
            return;
        }
        try {
            URI uri = URI.create(url);
            String scheme = uri.getScheme();
            if (scheme == null || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))) {
                e.put(campo, "Informe uma URL http ou https válida.");
            }
        } catch (IllegalArgumentException ex) {
            e.put(campo, "URL do logo inválida.");
        }
    }

    private static void emailOpcional(String campo, String val, Map<String, String> e) {
        if (val == null || val.isBlank()) return;
        String s = val.trim();
        if (s.length() > 255) {
            e.put(campo, "E-mail deve ter no máximo 255 caracteres.");
            return;
        }
        if (!EMAIL.matcher(s).matches()) {
            e.put(campo, "E-mail inválido.");
        }
    }

    /** Telefone BR: 10–11 dígitos (DDD+número) ou 13 dígitos começando em 55. */
    private static void telefoneBrOpcional(String campo, String tel, Map<String, String> e) {
        if (tel == null || tel.isBlank()) return;
        String d = tel.replaceAll("\\D", "");
        if (d.length() == 13 && d.startsWith("55")) {
            d = d.substring(2);
        }
        if (d.length() < 10 || d.length() > 11) {
            e.put(campo, "Telefone deve ter 10 ou 11 dígitos (DDD + número), ou +55 com DDD.");
        }
    }

    private void aplicar(ParametroEmpresaRequest request, ParametroEmpresa pe) {
        if (request.getNomeEmpresa() != null) {
            pe.setNomeEmpresa(normalizarNome(request.getNomeEmpresa()));
        }
        if (request.getLogoUrl() != null) {
            String u = request.getLogoUrl().trim();
            pe.setLogoUrl(u.isEmpty() ? null : u);
        }
        if (request.getMensagemBoasVindas() != null) {
            String m = request.getMensagemBoasVindas().trim();
            pe.setMensagemBoasVindas(m.isEmpty() ? null : m);
        }
        if (request.getCorPrimaria() != null) {
            String c = request.getCorPrimaria().trim();
            if (!c.isEmpty()) pe.setCorPrimaria(c);
        }
        if (request.getCorSecundaria() != null) {
            String c = request.getCorSecundaria().trim();
            if (!c.isEmpty()) pe.setCorSecundaria(c);
        }
        if (request.getCorFundo() != null) {
            String c = request.getCorFundo().trim();
            if (!c.isEmpty()) pe.setCorFundo(c);
        }
        if (request.getCorTexto() != null) {
            String c = request.getCorTexto().trim();
            if (!c.isEmpty()) pe.setCorTexto(c);
        }
        if (request.getCorBotao() != null) {
            String c = request.getCorBotao().trim();
            if (!c.isEmpty()) pe.setCorBotao(c);
        }
        if (request.getCorBotaoTexto() != null) {
            String c = request.getCorBotaoTexto().trim();
            if (!c.isEmpty()) pe.setCorBotaoTexto(c);
        }
        if (request.getChavePix() != null) {
            String p = request.getChavePix().trim();
            pe.setChavePix(p.isEmpty() ? null : p);
        }
        if (request.getSuporteEmail() != null) {
            String s = request.getSuporteEmail().trim();
            pe.setSuporteEmail(s.isEmpty() ? null : s.toLowerCase());
        }
        if (request.getSuporteWhatsapp() != null) {
            String s = request.getSuporteWhatsapp().trim();
            pe.setSuporteWhatsapp(s.isEmpty() ? null : s);
        }
        if (request.getSegmento() != null) {
            pe.setSegmento(request.getSegmento());
        }
        if (request.getModuloFarmaciaAtivo() != null) {
            pe.setModuloFarmaciaAtivo(request.getModuloFarmaciaAtivo());
        }
        if (request.getFarmaciaLoteValidadeObrigatorio() != null) {
            pe.setFarmaciaLoteValidadeObrigatorio(request.getFarmaciaLoteValidadeObrigatorio());
        }
        if (request.getFarmaciaControladosAtivo() != null) {
            pe.setFarmaciaControladosAtivo(request.getFarmaciaControladosAtivo());
        }
        if (request.getFarmaciaAntimicrobianosAtivo() != null) {
            pe.setFarmaciaAntimicrobianosAtivo(request.getFarmaciaAntimicrobianosAtivo());
        }
        if (request.getFarmaciaPmcAtivo() != null) {
            pe.setFarmaciaPmcAtivo(request.getFarmaciaPmcAtivo());
        }
        if (request.getFarmaciaPmcModo() != null) {
            String modo = request.getFarmaciaPmcModo().trim();
            if (modo.isEmpty()) {
                pe.setFarmaciaPmcModo("ALERTA");
            } else {
                pe.setFarmaciaPmcModo(modo.toUpperCase());
            }
        }
        if (request.getModuloInformaticaAtivo() != null) {
            pe.setModuloInformaticaAtivo(request.getModuloInformaticaAtivo());
        }
        if (request.getModuloFastFoodAtivo() != null) {
            pe.setModuloFastFoodAtivo(request.getModuloFastFoodAtivo());
        }
        if (request.getTipoEstabelecimentoFastFood() != null) {
            pe.setTipoEstabelecimentoFastFood(request.getTipoEstabelecimentoFastFood());
        }
        if (request.getCnpj() != null) {
            String c = CnpjValidator.apenasDigitos(request.getCnpj());
            pe.setCnpj(c.isEmpty() ? null : c);
        }
        if (request.getTelefoneComercial() != null) {
            String t = request.getTelefoneComercial().trim();
            pe.setTelefoneComercial(t.isEmpty() ? null : t);
        }
        if (request.getEmailComercial() != null) {
            String em = request.getEmailComercial().trim();
            pe.setEmailComercial(em.isEmpty() ? null : em.toLowerCase());
        }
        if (request.getEnderecoLinha1Os() != null) {
            String s = request.getEnderecoLinha1Os().trim();
            pe.setEnderecoLinha1Os(s.isEmpty() ? null : s);
        }
        if (request.getCidadeUfOs() != null) {
            String s = request.getCidadeUfOs().trim();
            pe.setCidadeUfOs(s.isEmpty() ? null : s);
        }
        if (request.getInscricaoMunicipal() != null) {
            String s = request.getInscricaoMunicipal().trim();
            pe.setInscricaoMunicipal(s.isEmpty() ? null : s);
        }
        if (request.getFax() != null) {
            String s = request.getFax().trim();
            pe.setFax(s.isEmpty() ? null : s);
        }
        if (request.getTextoTermosOs() != null) {
            String s = request.getTextoTermosOs().trim();
            pe.setTextoTermosOs(s.isEmpty() ? null : s);
        }
    }

    private ParametroEmpresaResponse toResponse(ParametroEmpresa pe) {
        ParametroEmpresaResponse r = new ParametroEmpresaResponse();
        r.setId(pe.getId()); r.setCompanyId(pe.getCompanyId());
        r.setNomeEmpresa(pe.getNomeEmpresa()); r.setLogoUrl(pe.getLogoUrl());
        r.setMensagemBoasVindas(pe.getMensagemBoasVindas());
        r.setCorPrimaria(pe.getCorPrimaria()); r.setCorSecundaria(pe.getCorSecundaria());
        r.setCorFundo(pe.getCorFundo()); r.setCorTexto(pe.getCorTexto());
        r.setCorBotao(pe.getCorBotao()); r.setCorBotaoTexto(pe.getCorBotaoTexto());
        r.setChavePix(pe.getChavePix()); r.setSuporteEmail(pe.getSuporteEmail());
        r.setSuporteWhatsapp(pe.getSuporteWhatsapp()); r.setSegmento(pe.getSegmento());
        r.setModuloFarmaciaAtivo(pe.getModuloFarmaciaAtivo());
        r.setFarmaciaLoteValidadeObrigatorio(pe.getFarmaciaLoteValidadeObrigatorio());
        r.setFarmaciaControladosAtivo(pe.getFarmaciaControladosAtivo());
        r.setFarmaciaAntimicrobianosAtivo(pe.getFarmaciaAntimicrobianosAtivo());
        r.setFarmaciaPmcAtivo(pe.getFarmaciaPmcAtivo()); r.setFarmaciaPmcModo(pe.getFarmaciaPmcModo());
        r.setModuloInformaticaAtivo(pe.getModuloInformaticaAtivo());
        r.setModuloFastFoodAtivo(pe.getModuloFastFoodAtivo());
        r.setTipoEstabelecimentoFastFood(pe.getTipoEstabelecimentoFastFood());
        r.setCnpj(pe.getCnpj());
        r.setTelefoneComercial(pe.getTelefoneComercial()); r.setEmailComercial(pe.getEmailComercial());
        r.setEnderecoLinha1Os(pe.getEnderecoLinha1Os()); r.setCidadeUfOs(pe.getCidadeUfOs());
        r.setInscricaoMunicipal(pe.getInscricaoMunicipal()); r.setFax(pe.getFax());
        r.setTextoTermosOs(pe.getTextoTermosOs());
        return r;
    }
}
