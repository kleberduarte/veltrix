-- Módulo Fast Food / Totem + tipo de estabelecimento (idempotente)
-- Versão 26: a V25 já é a migration Java orders_forma_pagamento_ensure.

SET @db := DATABASE();

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'parametros_empresa' AND COLUMN_NAME = 'modulo_fast_food_ativo');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE parametros_empresa ADD COLUMN modulo_fast_food_ativo TINYINT(1) NOT NULL DEFAULT 0');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'parametros_empresa' AND COLUMN_NAME = 'tipo_estabelecimento_fast_food');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE parametros_empresa ADD COLUMN tipo_estabelecimento_fast_food VARCHAR(32) NULL');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
