-- Cadastro público com código PDV: senha definida depois em /primeiro-acesso
ALTER TABLE users ADD COLUMN invite_self_registration TINYINT(1) NOT NULL DEFAULT 0;
