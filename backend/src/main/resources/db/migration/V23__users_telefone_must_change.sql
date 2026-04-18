-- Campos presentes em User.java mas nunca incluídos nas migrations iniciais
-- Idempotente: Hibernate (ddl-auto) pode já ter criado colunas.

SET @db := DATABASE();

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'users' AND COLUMN_NAME = 'telefone');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE users ADD COLUMN telefone VARCHAR(255) NULL');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'users' AND COLUMN_NAME = 'must_change_password');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE users ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
