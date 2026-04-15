-- O schema V1 usava role VARCHAR DEFAULT 'USER'; o app usa ADM, ADMIN_EMPRESA, VENDEDOR.
-- Sem isso o Hibernate falha ao alterar a coluna para ENUM com dados incompatíveis.

UPDATE users SET role = 'ADMIN_EMPRESA' WHERE role = 'USER' OR UPPER(TRIM(role)) = 'USER';

UPDATE users SET role = 'ADMIN_EMPRESA' WHERE role IS NULL OR TRIM(role) = '';

-- Qualquer valor fora do enum esperado vira admin de empresa (seguro para dev / legado)
UPDATE users SET role = 'ADMIN_EMPRESA' WHERE role NOT IN ('ADM', 'ADMIN_EMPRESA', 'VENDEDOR');

-- Evita que o MySQL use tipo ENUM nativo; Hibernate mapeia como VARCHAR
ALTER TABLE users MODIFY COLUMN role VARCHAR(32) NOT NULL;
