-- =============================================================================
-- Veltrix (MySQL) — Redefine os contadores AUTO_INCREMENT de todas as tabelas
-- de negócio.
--
-- Tabela vazia: próximo INSERT tende a usar id = 1.
-- Tabela com dados: o InnoDB ignora valores abaixo do maior id existente e
-- define o próximo como MAX(id) + 1 (comportamento normal; não “volta” a 1).
--
-- Não altera flyway_schema_history.
-- =============================================================================

USE veltrix;

-- Ordem alfabética; não há dependência entre ALTER TABLE ... AUTO_INCREMENT
ALTER TABLE cash_flow           AUTO_INCREMENT = 1;
ALTER TABLE clientes            AUTO_INCREMENT = 1;
ALTER TABLE companies           AUTO_INCREMENT = 1;
ALTER TABLE fechamentos_caixa   AUTO_INCREMENT = 1;
ALTER TABLE ordens_servico      AUTO_INCREMENT = 1;
ALTER TABLE order_items         AUTO_INCREMENT = 1;
ALTER TABLE orders              AUTO_INCREMENT = 1;
ALTER TABLE parametros_empresa  AUTO_INCREMENT = 1;
ALTER TABLE pdv_terminais       AUTO_INCREMENT = 1;
ALTER TABLE pmc_referencias     AUTO_INCREMENT = 1;
ALTER TABLE produto_lotes       AUTO_INCREMENT = 1;
ALTER TABLE products            AUTO_INCREMENT = 1;
ALTER TABLE users               AUTO_INCREMENT = 1;

-- Opcional: conferir próximos valores (MySQL 8+)
-- SELECT TABLE_NAME, AUTO_INCREMENT FROM information_schema.TABLES
-- WHERE TABLE_SCHEMA = 'veltrix' AND TABLE_TYPE = 'BASE TABLE'
-- ORDER BY TABLE_NAME;
