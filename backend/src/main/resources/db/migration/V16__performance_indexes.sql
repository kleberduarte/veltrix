-- Performance: índice composto para consultas de vendas por empresa + período
-- Usado em: OrderService.findByDateRange e ReportService.dailyReport
SET @idx_exists := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'orders'
    AND index_name = 'idx_orders_company_date'
);
SET @sql := IF(
  @idx_exists = 0,
  'CREATE INDEX idx_orders_company_date ON orders (company_id, created_at)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Performance: índice composto para cash_flow por empresa + período
SET @idx_exists := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'cash_flow'
    AND index_name = 'idx_cash_company_date'
);
SET @sql := IF(
  @idx_exists = 0,
  'CREATE INDEX idx_cash_company_date ON cash_flow (company_id, created_at)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Performance: índice composto para fechamentos_caixa por empresa + data referência
SET @idx_exists := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'fechamentos_caixa'
    AND index_name = 'idx_fechamento_company_data'
);
SET @sql := IF(
  @idx_exists = 0,
  'CREATE INDEX idx_fechamento_company_data ON fechamentos_caixa (company_id, data_referencia)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
