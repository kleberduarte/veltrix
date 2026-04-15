-- Veltrix Database Schema
-- Multi-tenant SaaS: all tables include company_id

CREATE TABLE IF NOT EXISTS companies (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    plan       VARCHAR(50)  NOT NULL DEFAULT 'FREE',
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT       NOT NULL,
    name       VARCHAR(255) NOT NULL,
    email      VARCHAR(255) NOT NULL,
    password   VARCHAR(255) NOT NULL,
    role       VARCHAR(50)  NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_users_email (email),
    CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies (id)
);

CREATE TABLE IF NOT EXISTS products (
    id         BIGINT         AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT         NOT NULL,
    name       VARCHAR(255)   NOT NULL,
    price      DECIMAL(10, 2) NOT NULL,
    stock      INT            NOT NULL DEFAULT 0,
    active     TINYINT(1)     NOT NULL DEFAULT 1,
    created_at TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_products_company (company_id),
    CONSTRAINT fk_products_company FOREIGN KEY (company_id) REFERENCES companies (id)
);

CREATE TABLE IF NOT EXISTS orders (
    id         BIGINT         AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT         NOT NULL,
    total      DECIMAL(10, 2) NOT NULL,
    status     VARCHAR(50)    NOT NULL DEFAULT 'COMPLETED',
    created_at TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_orders_company (company_id),
    INDEX idx_orders_created_at (created_at),
    CONSTRAINT fk_orders_company FOREIGN KEY (company_id) REFERENCES companies (id)
);

CREATE TABLE IF NOT EXISTS order_items (
    id         BIGINT         AUTO_INCREMENT PRIMARY KEY,
    order_id   BIGINT         NOT NULL,
    product_id BIGINT         NOT NULL,
    quantity   INT            NOT NULL,
    price      DECIMAL(10, 2) NOT NULL,
    CONSTRAINT fk_order_items_order   FOREIGN KEY (order_id)   REFERENCES orders (id),
    CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products (id)
);

CREATE TABLE IF NOT EXISTS cash_flow (
    id         BIGINT         AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT         NOT NULL,
    type       VARCHAR(10)    NOT NULL COMMENT 'IN or OUT',
    amount     DECIMAL(10, 2) NOT NULL,
    description VARCHAR(255)  NULL,
    created_at TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_cash_flow_company (company_id),
    INDEX idx_cash_flow_created_at (created_at),
    CONSTRAINT fk_cash_flow_company FOREIGN KEY (company_id) REFERENCES companies (id)
);
