-- Campos de rastreabilidade / receita / PMC (OrderItem); V1 só tinha quantity/price.
-- Idempotente: Hibernate (ddl-auto) ou execuções parciais podem já ter criado colunas.

SET @db := DATABASE();

-- lote_codigo
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'lote_codigo');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE order_items ADD COLUMN lote_codigo VARCHAR(255) NULL');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- lote_validade
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'lote_validade');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE order_items ADD COLUMN lote_validade VARCHAR(40) NULL');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- receita_tipo
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'receita_tipo');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE order_items ADD COLUMN receita_tipo VARCHAR(80) NULL');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- receita_numero
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'receita_numero');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE order_items ADD COLUMN receita_numero VARCHAR(80) NULL');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- receita_prescritor
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'receita_prescritor');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE order_items ADD COLUMN receita_prescritor VARCHAR(255) NULL');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- receita_data
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'receita_data');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE order_items ADD COLUMN receita_data VARCHAR(40) NULL');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- pmc_aplicado
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'pmc_aplicado');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE order_items ADD COLUMN pmc_aplicado DECIMAL(10, 2) NULL');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- pmc_status
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'pmc_status');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE order_items ADD COLUMN pmc_status VARCHAR(32) NULL');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
