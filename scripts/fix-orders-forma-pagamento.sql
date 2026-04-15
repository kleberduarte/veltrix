-- Use se o ALTER ... MODIFY falhar com erro 1265 (dados NULL, ENUM legado, etc.).
-- Ou execute subindo o backend: a migração Flyway V9 (Java) faz o mesmo com segurança.

SET @db = DATABASE();

-- Remover coluna temporária de tentativa anterior
SET @q = (
  SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'orders' AND COLUMN_NAME = '_veltrix_fp') > 0,
    'ALTER TABLE orders DROP COLUMN _veltrix_fp',
    'SELECT 1'
  )
);
PREPARE s FROM @q; EXECUTE s; DEALLOCATE PREPARE s;

ALTER TABLE orders ADD COLUMN _veltrix_fp VARCHAR(20) NULL;

UPDATE orders SET _veltrix_fp = COALESCE(
  NULLIF(TRIM(CAST(forma_pagamento AS CHAR)), ''),
  'DINHEIRO'
);

UPDATE orders SET _veltrix_fp = 'DINHEIRO'
WHERE _veltrix_fp NOT IN ('DINHEIRO', 'DEBITO', 'CARTAO', 'PIX');

ALTER TABLE orders DROP COLUMN forma_pagamento;

ALTER TABLE orders CHANGE COLUMN _veltrix_fp forma_pagamento VARCHAR(20) NOT NULL DEFAULT 'DINHEIRO';
