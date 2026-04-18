-- Versões antigas desta migration usavam ADD COLUMN IF NOT EXISTS (podia falhar ou ficar "failed" no histórico).
-- A garantia da coluna passou para V25 (Java, idempotente). Este passo mantém o número de versão 24.
SELECT 1;
