-- Totais por vale refeição (voucher) no fechamento de caixa
ALTER TABLE fechamentos_caixa
    ADD COLUMN total_voucher DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER total_pix;
