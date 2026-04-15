ALTER TABLE clientes
    ADD COLUMN cep VARCHAR(8) NULL COMMENT 'Somente 8 digitos' AFTER cpf;
