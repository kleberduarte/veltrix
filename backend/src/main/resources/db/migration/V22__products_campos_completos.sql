-- Product evoluiu muito além do V1 (só name/price/stock/active); alinha com com.veltrix.model.Product
-- Idempotente: Hibernate (ddl-auto) pode já ter criado colunas.

SET @db := DATABASE();

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'products' AND COLUMN_NAME = 'codigo_produto');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE products ADD COLUMN codigo_produto VARCHAR(255) NULL');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'products' AND COLUMN_NAME = 'gtin_ean');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE products ADD COLUMN gtin_ean VARCHAR(255) NULL');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'products' AND COLUMN_NAME = 'descricao');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE products ADD COLUMN descricao TEXT NULL');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'products' AND COLUMN_NAME = 'categoria');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE products ADD COLUMN categoria VARCHAR(255) NULL');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'products' AND COLUMN_NAME = 'preco_promocional');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE products ADD COLUMN preco_promocional DECIMAL(10, 2) NULL');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'products' AND COLUMN_NAME = 'promocao_inicio');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE products ADD COLUMN promocao_inicio DATE NULL');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'products' AND COLUMN_NAME = 'promocao_fim');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE products ADD COLUMN promocao_fim DATE NULL');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'products' AND COLUMN_NAME = 'em_promocao');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE products ADD COLUMN em_promocao TINYINT(1) NOT NULL DEFAULT 0');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'products' AND COLUMN_NAME = 'promo_qtd_levar');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE products ADD COLUMN promo_qtd_levar INT NOT NULL DEFAULT 0');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'products' AND COLUMN_NAME = 'promo_qtd_pagar');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE products ADD COLUMN promo_qtd_pagar INT NOT NULL DEFAULT 0');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'products' AND COLUMN_NAME = 'estoque_minimo');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE products ADD COLUMN estoque_minimo INT NOT NULL DEFAULT 0');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'products' AND COLUMN_NAME = 'tipo');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE products ADD COLUMN tipo VARCHAR(20) NOT NULL DEFAULT ''UNIDADE''');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'products' AND COLUMN_NAME = 'tipo_controle');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE products ADD COLUMN tipo_controle VARCHAR(30) NOT NULL DEFAULT ''COMUM''');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'products' AND COLUMN_NAME = 'exige_receita');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE products ADD COLUMN exige_receita TINYINT(1) NOT NULL DEFAULT 0');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'products' AND COLUMN_NAME = 'exige_lote');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE products ADD COLUMN exige_lote TINYINT(1) NOT NULL DEFAULT 0');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'products' AND COLUMN_NAME = 'exige_validade');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE products ADD COLUMN exige_validade TINYINT(1) NOT NULL DEFAULT 0');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'products' AND COLUMN_NAME = 'registro_ms');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE products ADD COLUMN registro_ms VARCHAR(255) NULL');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'products' AND COLUMN_NAME = 'pmc');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE products ADD COLUMN pmc DECIMAL(10, 2) NULL');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'products' AND COLUMN_NAME = 'updated_at');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE products ADD COLUMN updated_at DATETIME(6) NULL');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
