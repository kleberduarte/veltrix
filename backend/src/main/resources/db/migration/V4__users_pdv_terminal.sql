-- PDV exclusivo do usuário (opcional), alinhado ao sistema-cadastro
ALTER TABLE users
    ADD COLUMN pdv_terminal_id BIGINT NULL,
    ADD CONSTRAINT fk_users_pdv_terminal FOREIGN KEY (pdv_terminal_id) REFERENCES pdv_terminais (id);
