package com.veltrix.model.enums;

public enum Role {
    /** Adm Global — acesso completo a todas as rotinas e empresas. */
    ADM,
    /** Adm Empresa — gestão do tenant; não pode acessar empresa reservada (Default). */
    ADMIN_EMPRESA,
    /** Vendedor — PDV e rotinas relacionadas (vendas, caixa, terminais, clientes). */
    VENDEDOR,
    /** Totem — apenas interface de venda em quiosque (fluxo PDV dedicado). */
    TOTEM
}
