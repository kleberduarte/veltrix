-- =============================================================================
-- Veltrix (MySQL) — Apaga dados de todas as tabelas de negócio e mantém
-- apenas o usuário com e-mail: adm.global@veltrix.local
--
-- NÃO altera a tabela flyway_schema_history (histórico de migrações).
-- Faça backup completo antes (ex.: mysqldump veltrix > backup.sql).
--
-- Se aparecer Error 1175 (safe update mode), este script já desativa
-- SQL_SAFE_UPDATES só durante a execução.
-- =============================================================================

USE veltrix;

START TRANSACTION;

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_SAFE_UPDATES = 0;

-- Filhos primeiro (FKs internas)
DELETE FROM order_items;
DELETE FROM orders;

DELETE FROM produto_lotes;
DELETE FROM pmc_referencias;
DELETE FROM products;

DELETE FROM ordens_servico;
DELETE FROM fechamentos_caixa;
DELETE FROM cash_flow;
DELETE FROM clientes;
DELETE FROM parametros_empresa;

-- Terminal PDV referenciado em users.pdv_terminal_id
UPDATE users SET pdv_terminal_id = NULL;

DELETE FROM pdv_terminais;

-- Mantém somente o Adm Global (ajuste o e-mail se o seu for outro)
DELETE FROM users
WHERE LOWER(TRIM(email)) <> 'adm.global@veltrix.local';

-- Empresas sem usuário restante são removidas; a empresa do adm global permanece
DELETE FROM companies
WHERE id NOT IN (SELECT company_id FROM users);

SET FOREIGN_KEY_CHECKS = 1;
SET SQL_SAFE_UPDATES = 1;

COMMIT;

-- Opcional: conferir
-- SELECT id, email, company_id, role FROM users;
-- SELECT * FROM companies;
