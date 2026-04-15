-- Empresa reservada "Default": administradores de empresa (ADMIN_EMPRESA) não podem usar esse tenant.
ALTER TABLE companies
    ADD COLUMN system_default TINYINT(1) NOT NULL DEFAULT 0;
UPDATE companies SET system_default = 1 WHERE LOWER(TRIM(name)) = 'default';
