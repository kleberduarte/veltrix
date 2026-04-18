-- V10 adiciona cep; em ambientes só com Flyway a tabela ainda não existia.
CREATE TABLE IF NOT EXISTS clientes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    telefone VARCHAR(255) NULL,
    cpf VARCHAR(255) NULL,
    endereco TEXT NULL,
    codigo_convite_pdv VARCHAR(255) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NULL,
    INDEX idx_clientes_company (company_id),
    CONSTRAINT fk_clientes_company FOREIGN KEY (company_id) REFERENCES companies (id)
);
