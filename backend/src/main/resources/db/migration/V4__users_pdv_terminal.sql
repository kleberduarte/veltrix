-- Tabela PDV (obrigatória antes do FK em users; o app usa com.veltrix.model.PdvTerminal)
CREATE TABLE pdv_terminais (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT NOT NULL,
    codigo VARCHAR(255) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    ultimo_operador VARCHAR(255) NULL,
    ultimo_heartbeat DATETIME(6) NULL,
    status_caixa VARCHAR(20) NOT NULL DEFAULT 'LIVRE',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_pdv_terminais_company (company_id),
    CONSTRAINT fk_pdv_terminais_company FOREIGN KEY (company_id) REFERENCES companies (id)
);

-- PDV exclusivo do usuário (opcional), alinhado ao sistema-cadastro
ALTER TABLE users
    ADD COLUMN pdv_terminal_id BIGINT NULL,
    ADD CONSTRAINT fk_users_pdv_terminal FOREIGN KEY (pdv_terminal_id) REFERENCES pdv_terminais (id);
