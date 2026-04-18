CREATE TABLE IF NOT EXISTS produto_lotes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    codigo_lote VARCHAR(255) NOT NULL,
    validade DATE NULL,
    quantidade_atual INT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NULL,
    INDEX idx_produto_lotes_company (company_id),
    CONSTRAINT fk_produto_lotes_company FOREIGN KEY (company_id) REFERENCES companies (id),
    CONSTRAINT fk_produto_lotes_product FOREIGN KEY (product_id) REFERENCES products (id)
);
