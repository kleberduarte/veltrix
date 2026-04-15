-- Renomeia enderecoOs para enderecoLinha1Os (alinha com o legado)
ALTER TABLE parametros_empresa
    CHANGE COLUMN endereco_os endereco_linha1_os TEXT NULL;

-- Novos campos do módulo Informática presentes no legado
ALTER TABLE parametros_empresa
    ADD COLUMN cidade_uf_os VARCHAR(200) NULL COMMENT 'Ex.: CARAPICUIBA - SP' AFTER endereco_linha1_os,
    ADD COLUMN inscricao_municipal VARCHAR(40) NULL AFTER cnpj,
    ADD COLUMN fax VARCHAR(40) NULL AFTER telefone_comercial;
