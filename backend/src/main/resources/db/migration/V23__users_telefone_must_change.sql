-- Campos presentes em User.java mas nunca incluídos nas migrations iniciais
ALTER TABLE users
    ADD COLUMN telefone VARCHAR(255) NULL,
    ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0;
