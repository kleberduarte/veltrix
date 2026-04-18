-- Campos PDV/cliente/pagamento em Order; V1 só tinha company_id, total, status, created_at (+ forma_pagamento via V9 Java).
ALTER TABLE orders
    ADD COLUMN usuario_id BIGINT NULL,
    ADD COLUMN nome_operador VARCHAR(255) NULL,
    ADD COLUMN cpf_cliente VARCHAR(255) NULL,
    ADD COLUMN cliente_id BIGINT NULL,
    ADD COLUMN subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN desconto DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN parcelas INT NOT NULL DEFAULT 1,
    ADD COLUMN chave_pix VARCHAR(255) NULL;
