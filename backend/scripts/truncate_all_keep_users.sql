-- ─────────────────────────────────────────────────────────────────────────────
-- Limpa TODOS os dados do banco, mantendo apenas os registros de `users`.
-- Execute conectado ao banco correto: USE veltrix;
-- ─────────────────────────────────────────────────────────────────────────────

SET FOREIGN_KEY_CHECKS = 0;

-- Tabelas filhas (dependem de outras)
TRUNCATE TABLE cash_flow;
TRUNCATE TABLE fechamentos_caixa;
TRUNCATE TABLE pmc_referencias;
TRUNCATE TABLE produto_lotes;
TRUNCATE TABLE order_items;
TRUNCATE TABLE orders;
TRUNCATE TABLE ordens_servico;
TRUNCATE TABLE clientes;
TRUNCATE TABLE products;
TRUNCATE TABLE pdv_terminais;
TRUNCATE TABLE parametros_empresa;

-- Tabelas pai
-- ATENÇÃO: limpar companies quebra a FK company_id dos users existentes.
-- Após rodar este script, execute o bloco abaixo para recriar as empresas referenciadas:
--
--   INSERT INTO companies (id, name, access_token, pdv_invite_code)
--   SELECT u.company_id, 'Sistema', REPLACE(UUID(),'-',''), LEFT(REPLACE(UUID(),'-',''),8)
--   FROM users u WHERE u.company_id IS NOT NULL GROUP BY u.company_id;
--
TRUNCATE TABLE companies;

SET FOREIGN_KEY_CHECKS = 1;

-- Confirma o que sobrou
SELECT 'users' AS tabela, COUNT(*) AS registros FROM users
UNION ALL SELECT 'companies', COUNT(*) FROM companies
UNION ALL SELECT 'products',  COUNT(*) FROM products
UNION ALL SELECT 'orders',    COUNT(*) FROM orders
UNION ALL SELECT 'clientes',  COUNT(*) FROM clientes;
