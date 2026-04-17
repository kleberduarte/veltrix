-- Preenche pdv_invite_code ausente (empresas legadas) para o cadastro de vendedor no login funcionar.
-- Valores únicos por id (8 caracteres hex em maiúsculas).
UPDATE companies
SET pdv_invite_code = UPPER(SUBSTRING(MD5(CONCAT(CAST(id AS CHAR), '-veltrix-pdv')), 1, 8))
WHERE pdv_invite_code IS NULL OR TRIM(IFNULL(pdv_invite_code, '')) = '';
