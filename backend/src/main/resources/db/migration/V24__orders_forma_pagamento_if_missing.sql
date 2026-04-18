-- V9 (Java) só altera forma_pagamento se a coluna já existisse (legado). Bases criadas só pelo V1 nunca a têm.
-- MySQL 8.0.12+: IF NOT EXISTS evita erro se V9 já tiver criado a coluna.
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS forma_pagamento VARCHAR(20) NOT NULL DEFAULT 'DINHEIRO';
