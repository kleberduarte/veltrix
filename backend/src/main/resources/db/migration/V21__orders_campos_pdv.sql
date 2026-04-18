-- Campos PDV/cliente/pagamento em Order; V1 só tinha company_id, total, status, created_at (+ forma_pagamento via V9 Java).
-- Idempotente: Hibernate (ddl-auto) pode já ter criado colunas.

SET @db := DATABASE();

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'usuario_id');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE orders ADD COLUMN usuario_id BIGINT NULL');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'nome_operador');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE orders ADD COLUMN nome_operador VARCHAR(255) NULL');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'cpf_cliente');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE orders ADD COLUMN cpf_cliente VARCHAR(255) NULL');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'cliente_id');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE orders ADD COLUMN cliente_id BIGINT NULL');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'subtotal');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE orders ADD COLUMN subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'desconto');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE orders ADD COLUMN desconto DECIMAL(10, 2) NOT NULL DEFAULT 0');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'parcelas');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE orders ADD COLUMN parcelas INT NOT NULL DEFAULT 1');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'chave_pix');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE orders ADD COLUMN chave_pix VARCHAR(255) NULL');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
