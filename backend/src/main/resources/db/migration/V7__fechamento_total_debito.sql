ALTER TABLE fechamentos_caixa
    ADD COLUMN total_debito DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER total_cartao;
