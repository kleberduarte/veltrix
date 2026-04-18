-- Tabela usada antes só via Hibernate em alguns ambientes; V7 adiciona total_debito.
CREATE TABLE IF NOT EXISTS fechamentos_caixa (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT NOT NULL,
    terminal_id BIGINT NULL,
    usuario_id BIGINT NULL,
    nome_operador VARCHAR(255) NULL,
    data_referencia DATE NOT NULL,
    quantidade_vendas BIGINT NOT NULL DEFAULT 0,
    total_dinheiro DECIMAL(10, 2) NULL DEFAULT 0,
    total_cartao DECIMAL(10, 2) NULL DEFAULT 0,
    total_pix DECIMAL(10, 2) NULL DEFAULT 0,
    total_geral DECIMAL(10, 2) NULL DEFAULT 0,
    valor_informado_dinheiro DECIMAL(10, 2) NULL,
    diferenca_dinheiro DECIMAL(10, 2) NULL,
    data_fechamento DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_fechamentos_caixa_company (company_id),
    CONSTRAINT fk_fechamentos_caixa_company FOREIGN KEY (company_id) REFERENCES companies (id)
);
