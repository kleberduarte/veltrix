-- URL da foto do produto para cardápio / totem (mesmo padrão do logo da empresa: https...)

SET @db := DATABASE();

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'products' AND COLUMN_NAME = 'imagem_url');
SET @s := IF(@c > 0, 'SELECT 1', 'ALTER TABLE products ADD COLUMN imagem_url VARCHAR(2048) NULL');
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
