-- =============================================================================
-- Veltrix — limpar dados e manter APENAS o usuário adm.global@veltrix.local
-- =============================================================================
-- Uso: MySQL Workbench / mysql CLI — fazer BACKUP antes (especialmente em PRD).
-- Não altera flyway_schema_history.
--
-- Pré-requisito: deve existir um usuário com e-mail adm.global@veltrix.local.
-- Se não existir, NENHUM usuário será removido (proteção).
--
-- MySQL Workbench (safe update mode): permite DELETE sem WHERE em chave.
-- =============================================================================

SET SQL_SAFE_UPDATES = 0;

SET @adm_email := 'adm.global@veltrix.local';

SELECT id INTO @keep_uid FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM(@adm_email)) LIMIT 1;
SELECT company_id INTO @keep_cid FROM users WHERE id = @keep_uid LIMIT 1;

-- Se o adm global não existir, não apaga usuários (evita base sem login).
-- Ajuste o e-mail acima ou crie o usuário antes.

SET FOREIGN_KEY_CHECKS = 0;

/* Dados operacionais (ordem: filhos antes dos pais) */
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM produto_lotes;
DELETE FROM pmc_referencias;
DELETE FROM products;
DELETE FROM cash_flow;
DELETE FROM fechamentos_caixa;
DELETE FROM ordens_servico;
DELETE FROM clientes;
/* Mantém parametros da empresa do adm global (se existirem); remove só das outras empresas */
DELETE FROM parametros_empresa
WHERE @keep_cid IS NOT NULL AND company_id <> @keep_cid;
DELETE FROM pdv_terminais;

/* PDV vinculado ao usuário */
UPDATE users SET pdv_terminal_id = NULL;

/* Usuários: mantém só o adm global */
DELETE FROM users
WHERE @keep_uid IS NOT NULL
  AND id <> @keep_uid;

/* Empresas: remove todas exceto a do adm global */
DELETE FROM companies
WHERE @keep_cid IS NOT NULL
  AND id <> @keep_cid;

SET FOREIGN_KEY_CHECKS = 1;

SET SQL_SAFE_UPDATES = 1;

-- Verificação rápida (opcional):
-- SELECT id, email, role, company_id FROM users;
-- SELECT id, name FROM companies;
