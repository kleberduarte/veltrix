CREATE TABLE IF NOT EXISTS pmc_referencias (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT NOT NULL,
    product_id BIGINT NULL,
    registro_ms VARCHAR(255) NULL,
    gtin_ean VARCHAR(255) NULL,
    descricao VARCHAR(255) NULL,
    pmc DECIMAL(10, 2) NOT NULL,
    vigencia_inicio DATE NULL,
    vigencia_fim DATE NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_pmc_ref_company (company_id),
    CONSTRAINT fk_pmc_ref_company FOREIGN KEY (company_id) REFERENCES companies (id),
    CONSTRAINT fk_pmc_ref_product FOREIGN KEY (product_id) REFERENCES products (id)
);
