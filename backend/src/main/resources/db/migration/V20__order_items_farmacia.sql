-- Campos de rastreabilidade / receita / PMC (OrderItem); V1 só tinha quantity/price.
ALTER TABLE order_items
    ADD COLUMN lote_codigo VARCHAR(255) NULL,
    ADD COLUMN lote_validade VARCHAR(40) NULL,
    ADD COLUMN receita_tipo VARCHAR(80) NULL,
    ADD COLUMN receita_numero VARCHAR(80) NULL,
    ADD COLUMN receita_prescritor VARCHAR(255) NULL,
    ADD COLUMN receita_data VARCHAR(40) NULL,
    ADD COLUMN pmc_aplicado DECIMAL(10, 2) NULL,
    ADD COLUMN pmc_status VARCHAR(32) NULL;
