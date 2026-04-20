-- =============================================================================
-- Veltrix — consultas rápidas às tabelas (MySQL)
-- =============================================================================
-- Rode no Workbench após escolher o schema (ex.: railway / veltrix).
-- =============================================================================

/* Contagem por tabela (visão geral) */
SELECT 'companies' AS tabela, COUNT(*) AS qtd FROM companies
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'orders', COUNT(*) FROM orders
UNION ALL SELECT 'order_items', COUNT(*) FROM order_items
UNION ALL SELECT 'cash_flow', COUNT(*) FROM cash_flow
UNION ALL SELECT 'pdv_terminais', COUNT(*) FROM pdv_terminais
UNION ALL SELECT 'fechamentos_caixa', COUNT(*) FROM fechamentos_caixa
UNION ALL SELECT 'clientes', COUNT(*) FROM clientes
UNION ALL SELECT 'parametros_empresa', COUNT(*) FROM parametros_empresa
UNION ALL SELECT 'ordens_servico', COUNT(*) FROM ordens_servico
UNION ALL SELECT 'produto_lotes', COUNT(*) FROM produto_lotes
UNION ALL SELECT 'pmc_referencias', COUNT(*) FROM pmc_referencias
UNION ALL SELECT 'flyway_schema_history', COUNT(*) FROM flyway_schema_history;

-- -----------------------------------------------------------------------------
-- Empresas
-- -----------------------------------------------------------------------------
SELECT id, name, plan, system_default, pdv_invite_code,
       LEFT(onboarding_token, 12) AS onboarding_prefix,
       LEFT(access_token, 12) AS access_prefix,
       created_at
FROM companies
ORDER BY id;

-- -----------------------------------------------------------------------------
-- Usuários (sem senha)
-- -----------------------------------------------------------------------------
SELECT id, company_id, name, email, role, telefone, must_change_password,
       invite_self_registration, pdv_terminal_id, created_at
FROM users
ORDER BY id;

-- -----------------------------------------------------------------------------
-- Produtos (amostra)
-- -----------------------------------------------------------------------------
SELECT id, company_id, name, codigo_produto, price, stock, active, categoria, tipo
FROM products
ORDER BY id
LIMIT 50;

-- -----------------------------------------------------------------------------
-- Pedidos e itens (amostra)
-- -----------------------------------------------------------------------------
SELECT id, company_id, total, status, forma_pagamento, created_at
FROM orders
ORDER BY id DESC
LIMIT 20;

SELECT oi.id, oi.order_id, oi.product_id, oi.quantity, oi.price
FROM order_items oi
ORDER BY oi.id DESC
LIMIT 30;

-- -----------------------------------------------------------------------------
-- Caixa e fechamentos
-- -----------------------------------------------------------------------------
SELECT id, company_id, type, amount, description, created_at
FROM cash_flow
ORDER BY id DESC
LIMIT 20;

SELECT id, company_id, terminal_id, usuario_id, data_referencia, total_geral, data_fechamento
FROM fechamentos_caixa
ORDER BY id DESC
LIMIT 20;

-- -----------------------------------------------------------------------------
-- PDV, clientes, parâmetros, OS, lotes, PMC
-- -----------------------------------------------------------------------------
SELECT id, company_id, codigo, nome, ativo, status_caixa, ultimo_heartbeat
FROM pdv_terminais
ORDER BY id;

SELECT id, company_id, nome, email, telefone, cpf, created_at
FROM clientes
ORDER BY id
LIMIT 30;

SELECT id, company_id, nome_empresa, segmento, ativo
FROM parametros_empresa
ORDER BY id;

SELECT id, company_id, numero_os, nome_cliente, status, data_abertura
FROM ordens_servico
ORDER BY id DESC
LIMIT 20;

SELECT id, company_id, product_id, codigo_lote, validade, quantidade_atual
FROM produto_lotes
ORDER BY id DESC
LIMIT 20;

SELECT id, company_id, product_id, registro_ms, gtin_ean, pmc, vigencia_inicio
FROM pmc_referencias
ORDER BY id DESC
LIMIT 20;

-- -----------------------------------------------------------------------------
-- Flyway (versão das migrações aplicadas)
-- -----------------------------------------------------------------------------
SELECT installed_rank, version, description, success, installed_on
FROM flyway_schema_history
ORDER BY installed_rank;
