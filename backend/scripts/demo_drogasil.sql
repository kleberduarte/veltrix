-- =============================================================
--  VELTRIX — Demo Drogasil (Apresentação Yep Solutions)
--  Data: 2026-05-05
--  Acesso: admin@drogasil.demo / Demo@2026
--            pdv@drogasil.demo  / Demo@2026
-- =============================================================

SET NAMES utf8mb4;
SET foreign_key_checks = 0;

-- -------------------------------------------------------------
-- 0. Limpar dados demo anteriores (idempotente)
-- -------------------------------------------------------------
DELETE FROM order_items  WHERE order_id  IN (SELECT id FROM orders      WHERE company_id = (SELECT id FROM companies WHERE name = 'Drogasil Demo'));
DELETE FROM orders       WHERE company_id = (SELECT id FROM companies WHERE name = 'Drogasil Demo');
DELETE FROM cash_flow    WHERE company_id = (SELECT id FROM companies WHERE name = 'Drogasil Demo');
DELETE FROM clientes     WHERE company_id = (SELECT id FROM companies WHERE name = 'Drogasil Demo');
DELETE FROM products     WHERE company_id = (SELECT id FROM companies WHERE name = 'Drogasil Demo');
DELETE FROM users        WHERE company_id = (SELECT id FROM companies WHERE name = 'Drogasil Demo');
DELETE FROM companies    WHERE name = 'Drogasil Demo';

-- -------------------------------------------------------------
-- 1. Empresa
-- -------------------------------------------------------------
INSERT INTO companies (name, plan, created_at)
VALUES ('Drogasil Demo', 'PROFESSIONAL', '2026-01-10 08:00:00');

SET @cid = LAST_INSERT_ID();

-- -------------------------------------------------------------
-- 2. Usuários  (senha = Demo@2026, hash BCrypt 10 rounds)
-- -------------------------------------------------------------
-- $2a$10$Yf7z5FvGkJhK1Q2mN3oP4OW7uX9aB0cD1eF2gH3iJ4kL5mN6oP7qR  ← placeholder
-- Usar hash real gerado com BCrypt para "Demo@2026":
SET @hash = '$2b$10$ZoCL1U3G2x6HJA2/17jP6OvlwmZkK5vL4QF5fZMDQmZ8rtN3IBrOm';

INSERT INTO users (company_id, name, email, password, role, created_at) VALUES
(@cid, 'Administrador',     'admin@drogasil.demo', @hash, 'ADMIN',   '2026-01-10 08:00:00'),
(@cid, 'Carlos Operador',   'pdv@drogasil.demo',   @hash, 'CASHIER', '2026-01-10 08:05:00'),
(@cid, 'Fernanda Farmacêutica', 'farma@drogasil.demo', @hash, 'USER', '2026-01-10 08:10:00');

-- -------------------------------------------------------------
-- 3. Produtos — mix farmácia realista
-- -------------------------------------------------------------
INSERT INTO products (company_id, name, price, stock, active, categoria, codigo_produto, gtin_ean,
                      tipo, tipo_controle, exige_receita, exige_lote, exige_validade,
                      estoque_minimo, descricao, created_at)
VALUES
-- Medicamentos OTC
(@cid, 'Dipirona 500mg 20cp',      5.90, 340, 1, 'Analgésicos',        'DIPI-500-20',  '7896004700018', 'UNIDADE', 'MEDICAMENTO', 0, 1, 1, 20, 'Analgésico e antipirético.',      '2026-01-10 09:00:00'),
(@cid, 'Ibuprofeno 600mg 20cp',    8.50, 210, 1, 'Analgésicos',        'IBUP-600-20',  '7896714240018', 'UNIDADE', 'MEDICAMENTO', 0, 1, 1, 15, 'Anti-inflamatório não esteroidal.','2026-01-10 09:00:00'),
(@cid, 'Paracetamol 750mg 20cp',   6.20, 280, 1, 'Analgésicos',        'PARA-750-20',  '7896201517038', 'UNIDADE', 'MEDICAMENTO', 0, 1, 1, 20, 'Analgésico e antipirético.',      '2026-01-10 09:00:00'),
(@cid, 'Loratadina 10mg 12cp',    12.80, 180, 1, 'Antialérgicos',      'LORA-10-12',   '7896523280016', 'UNIDADE', 'MEDICAMENTO', 0, 1, 1, 10, 'Antialérgico não sedativo.',      '2026-01-10 09:00:00'),
(@cid, 'Omeprazol 20mg 28cp',     18.90, 150, 1, 'Antiácidos',         'OMEP-20-28',   '7896714260016', 'UNIDADE', 'MEDICAMENTO', 0, 1, 1, 10, 'Inibidor de bomba de prótons.',   '2026-01-10 09:00:00'),
(@cid, 'Amoxicilina 500mg 15cp',  24.50, 120, 1, 'Antibióticos',       'AMOX-500-15',  '7896004701015', 'UNIDADE', 'MEDICAMENTO', 1, 1, 1,  8, 'Antibiótico — requer receita.',   '2026-01-10 09:00:00'),
(@cid, 'Azitromicina 500mg 3cp',  32.90,  90, 1, 'Antibióticos',       'AZIT-500-03',  '7896004702012', 'UNIDADE', 'MEDICAMENTO', 1, 1, 1,  5, 'Antibiótico — requer receita.',   '2026-01-10 09:00:00'),
(@cid, 'Dorflex 35cp',            15.40, 195, 1, 'Analgésicos',        'DORF-035',     '7896004710017', 'UNIDADE', 'MEDICAMENTO', 0, 1, 1, 15, 'Relaxante muscular + analgésico.','2026-01-10 09:00:00'),
(@cid, 'Buscopan 10cp',           14.90, 160, 1, 'Antiespasmódicos',   'BUSC-010',     '7891058001018', 'UNIDADE', 'MEDICAMENTO', 0, 1, 1, 10, 'Alívio de cólicas.',              '2026-01-10 09:00:00'),
(@cid, 'Engov After 8cp',         19.80, 130, 1, 'Vitaminas',          'ENGO-008',     '7896714250017', 'UNIDADE', 'MEDICAMENTO', 0, 0, 1,  8, 'Complexo vitamínico.',            '2026-01-10 09:00:00'),

-- Dermocosméticos
(@cid, 'Protetor Solar FPS60 50g',49.90,  85, 1, 'Dermocosméticos',    'PROT-60-50G',  '7891058102015', 'UNIDADE', 'COMUM',       0, 0, 1,  5, 'Proteção solar alta.',            '2026-01-10 09:00:00'),
(@cid, 'Hidratante Nivea 400ml',  29.90, 140, 1, 'Dermocosméticos',    'HIDR-NIV-400', '7891058103012', 'UNIDADE', 'COMUM',       0, 0, 0, 10, 'Hidratante corporal.',            '2026-01-10 09:00:00'),
(@cid, 'Shampoo Head&Shoulders',  22.50, 110, 1, 'Higiene Pessoal',    'SHAM-H&S-200', '7891058104019', 'UNIDADE', 'COMUM',       0, 0, 0, 10, 'Anticaspa.',                      '2026-01-10 09:00:00'),

-- Perfumaria
(@cid, 'Colônia Natura Kaiak 100ml', 89.90, 40, 1, 'Perfumaria',       'KAIA-100ML',   '7891058201015', 'UNIDADE', 'COMUM',       0, 0, 0,  3, 'Colônia masculina.',              '2026-01-10 09:00:00'),
(@cid, 'Desodorante Rexona 150ml',   14.90, 220, 1,'Higiene Pessoal',  'REXO-150ML',   '7891058202012', 'UNIDADE', 'COMUM',       0, 0, 0, 20, 'Antitranspirante.',               '2026-01-10 09:00:00'),

-- Suplementos
(@cid, 'Vitamina C 1000mg 60cp',  38.90,  75, 1, 'Vitaminas',          'VITC-1000-60', '7896004801016', 'UNIDADE', 'COMUM',       0, 0, 1,  5, 'Vitamina C efervescente.',        '2026-01-10 09:00:00'),
(@cid, 'Ômega 3 1g 60cp',         45.90,  60, 1, 'Vitaminas',          'OMEG-1G-60',   '7896004802013', 'UNIDADE', 'COMUM',       0, 0, 1,  5, 'Ácido graxo essencial.',          '2026-01-10 09:00:00'),

-- Produtos bebê
(@cid, 'Fralda Pampers M 32un',   65.90,  95, 1, 'Bebê',               'PAMP-M-032',   '7896004901019', 'UNIDADE', 'COMUM',       0, 0, 1,  5, 'Fralda descartável M.',           '2026-01-10 09:00:00'),
(@cid, 'Lenço Umedecido 100un',   22.90, 130, 1, 'Bebê',               'LENC-100UN',   '7896004902016', 'UNIDADE', 'COMUM',       0, 0, 1, 10, 'Lenço umedecido s/ álcool.',      '2026-01-10 09:00:00'),

-- Medicamentos com PMC
(@cid, 'Losartana 50mg 30cp',     15.90, 200, 1, 'Hipertensão',        'LOSA-50-30',   '7896714300012', 'UNIDADE', 'MEDICAMENTO', 1, 1, 1, 15, 'Anti-hipertensivo.',              '2026-01-10 09:00:00'),
(@cid, 'Metformina 850mg 30cp',   12.50, 175, 1, 'Diabetes',           'METF-850-30',  '7896714301019', 'UNIDADE', 'MEDICAMENTO', 1, 1, 1, 15, 'Antidiabético oral.',             '2026-01-10 09:00:00');

-- -------------------------------------------------------------
-- 4. Clientes cadastrados
-- -------------------------------------------------------------
INSERT INTO clientes (company_id, nome, email, telefone, cpf, endereco, created_at) VALUES
(@cid, 'Ana Paula Ferreira',   'ana.ferreira@email.com',   '(11) 98765-4321', '123.456.789-00', 'Rua das Flores, 45 - São Paulo/SP',   '2026-01-15 10:00:00'),
(@cid, 'Roberto Almeida',      'roberto.almeida@email.com','(11) 91234-5678', '234.567.890-11', 'Av. Paulista, 1200 - São Paulo/SP',   '2026-02-03 11:30:00'),
(@cid, 'Sandra Lima',          'sandra.lima@email.com',    '(11) 97654-3210', '345.678.901-22', 'Rua Augusta, 300 - São Paulo/SP',     '2026-02-20 09:15:00'),
(@cid, 'José Carlos Souza',    NULL,                       '(11) 96543-2109', '456.789.012-33', 'Rua Oscar Freire, 50 - São Paulo/SP', '2026-03-10 14:00:00'),
(@cid, 'Maria Conceição',      'mconceicao@email.com',     '(11) 95432-1098', '567.890.123-44', 'Alameda Santos, 80 - São Paulo/SP',   '2026-03-22 16:45:00'),
(@cid, 'Paulo Henrique Costa', 'pauloh@email.com',         '(11) 94321-0987', '678.901.234-55', 'Rua Haddock Lobo, 200 - São Paulo/SP','2026-04-01 08:30:00'),
(@cid, 'Luciana Martins',      'lu.martins@email.com',     '(11) 93210-9876', '789.012.345-66', 'Rua da Consolação, 500 - São Paulo/SP','2026-04-15 10:20:00');

-- IDs de produtos (serão usados nas vendas)
SET @p1  = (SELECT id FROM products WHERE company_id=@cid AND codigo_produto='DIPI-500-20');
SET @p2  = (SELECT id FROM products WHERE company_id=@cid AND codigo_produto='IBUP-600-20');
SET @p3  = (SELECT id FROM products WHERE company_id=@cid AND codigo_produto='PARA-750-20');
SET @p4  = (SELECT id FROM products WHERE company_id=@cid AND codigo_produto='LORA-10-12');
SET @p5  = (SELECT id FROM products WHERE company_id=@cid AND codigo_produto='OMEP-20-28');
SET @p6  = (SELECT id FROM products WHERE company_id=@cid AND codigo_produto='DORF-035');
SET @p7  = (SELECT id FROM products WHERE company_id=@cid AND codigo_produto='BUSC-010');
SET @p8  = (SELECT id FROM products WHERE company_id=@cid AND codigo_produto='PROT-60-50G');
SET @p9  = (SELECT id FROM products WHERE company_id=@cid AND codigo_produto='HIDR-NIV-400');
SET @p10 = (SELECT id FROM products WHERE company_id=@cid AND codigo_produto='REXO-150ML');
SET @p11 = (SELECT id FROM products WHERE company_id=@cid AND codigo_produto='VITC-1000-60');
SET @p12 = (SELECT id FROM products WHERE company_id=@cid AND codigo_produto='PAMP-M-032');
SET @p13 = (SELECT id FROM products WHERE company_id=@cid AND codigo_produto='LOSA-50-30');
SET @p14 = (SELECT id FROM products WHERE company_id=@cid AND codigo_produto='METF-850-30');
SET @p15 = (SELECT id FROM products WHERE company_id=@cid AND codigo_produto='ENGO-008');
SET @p16 = (SELECT id FROM products WHERE company_id=@cid AND codigo_produto='LENC-100UN');
SET @p17 = (SELECT id FROM products WHERE company_id=@cid AND codigo_produto='KAIA-100ML');
SET @p18 = (SELECT id FROM products WHERE company_id=@cid AND codigo_produto='OMEG-1G-60');

SET @c1 = (SELECT id FROM clientes WHERE company_id=@cid AND cpf='123.456.789-00');
SET @c2 = (SELECT id FROM clientes WHERE company_id=@cid AND cpf='234.567.890-11');
SET @c3 = (SELECT id FROM clientes WHERE company_id=@cid AND cpf='345.678.901-22');

-- -------------------------------------------------------------
-- 5. Pedidos — histórico últimos 30 dias + dia de hoje (05/05)
-- -------------------------------------------------------------

-- === HOJE (2026-05-05) — 9 vendas ===

INSERT INTO orders (company_id, total, subtotal, desconto, status, forma_pagamento, nome_operador, cliente_id, parcelas, created_at) VALUES
(@cid, 12.10,  12.10, 0.00, 'COMPLETED', 'DINHEIRO', 'Carlos Operador', NULL, 1, '2026-05-05 08:12:00'),
(@cid, 33.40,  33.40, 0.00, 'COMPLETED', 'PIX',      'Carlos Operador', @c1,  1, '2026-05-05 08:47:00'),
(@cid, 49.90,  49.90, 0.00, 'COMPLETED', 'DEBITO',   'Carlos Operador', NULL, 1, '2026-05-05 09:15:00'),
(@cid, 87.70,  89.90, 2.20, 'COMPLETED', 'CREDITO',  'Carlos Operador', @c2,  2, '2026-05-05 09:52:00'),
(@cid, 28.40,  28.40, 0.00, 'COMPLETED', 'PIX',      'Carlos Operador', NULL, 1, '2026-05-05 10:30:00'),
(@cid, 65.90,  65.90, 0.00, 'COMPLETED', 'DINHEIRO', 'Carlos Operador', @c3,  1, '2026-05-05 11:05:00'),
(@cid, 52.80,  55.00, 2.20, 'COMPLETED', 'DEBITO',   'Carlos Operador', NULL, 1, '2026-05-05 11:48:00'),
(@cid, 38.90,  38.90, 0.00, 'COMPLETED', 'PIX',      'Carlos Operador', @c1,  1, '2026-05-05 12:20:00'),
(@cid, 74.80,  74.80, 0.00, 'COMPLETED', 'CREDITO',  'Carlos Operador', NULL, 3, '2026-05-05 13:10:00');

-- Order items de hoje
SET @o1 = (SELECT id FROM orders WHERE company_id=@cid AND created_at='2026-05-05 08:12:00');
SET @o2 = (SELECT id FROM orders WHERE company_id=@cid AND created_at='2026-05-05 08:47:00');
SET @o3 = (SELECT id FROM orders WHERE company_id=@cid AND created_at='2026-05-05 09:15:00');
SET @o4 = (SELECT id FROM orders WHERE company_id=@cid AND created_at='2026-05-05 09:52:00');
SET @o5 = (SELECT id FROM orders WHERE company_id=@cid AND created_at='2026-05-05 10:30:00');
SET @o6 = (SELECT id FROM orders WHERE company_id=@cid AND created_at='2026-05-05 11:05:00');
SET @o7 = (SELECT id FROM orders WHERE company_id=@cid AND created_at='2026-05-05 11:48:00');
SET @o8 = (SELECT id FROM orders WHERE company_id=@cid AND created_at='2026-05-05 12:20:00');
SET @o9 = (SELECT id FROM orders WHERE company_id=@cid AND created_at='2026-05-05 13:10:00');

INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
(@o1, @p1,  1,  5.90), (@o1, @p3,  1,  6.20),                              -- Dipirona + Paracetamol
(@o2, @p6,  1, 15.40), (@o2, @p7,  1, 14.90), (@o2, @p10, 2, 14.90),      -- Dorflex + Buscopan + 2x Rexona
(@o3, @p8,  1, 49.90),                                                      -- Protetor Solar
(@o4, @p9,  1, 29.90), (@o4, @p17, 1, 89.90),                              -- Hidratante + Colônia Kaiak
(@o5, @p4,  1, 12.80), (@o5, @p5,  1, 18.90),                              -- Loratadina + Omeprazol (- R$3,30 desc)
(@o6, @p12, 1, 65.90),                                                      -- Fralda Pampers
(@o7, @p9,  1, 29.90), (@o7, @p11, 1, 38.90),                              -- Hidratante + Vitamina C (- R$16,00 desc)
(@o8, @p11, 1, 38.90),                                                      -- Vitamina C
(@o9, @p13, 2, 15.90), (@o9, @p14, 2, 12.50), (@o9, @p16, 1, 22.90);      -- Losartana+Metformina+Lenço

-- === ÚLTIMOS 30 DIAS — volume histórico ===

INSERT INTO orders (company_id, total, subtotal, desconto, status, forma_pagamento, nome_operador, created_at) VALUES
-- Abril
(@cid, 142.30, 142.30, 0.00, 'COMPLETED', 'PIX',      'Carlos Operador', '2026-05-04 09:10:00'),
(@cid,  88.70,  90.00, 1.30, 'COMPLETED', 'DINHEIRO', 'Carlos Operador', '2026-05-04 11:30:00'),
(@cid, 215.50, 215.50, 0.00, 'COMPLETED', 'CREDITO',  'Carlos Operador', '2026-05-04 14:00:00'),
(@cid,  55.90,  55.90, 0.00, 'COMPLETED', 'DEBITO',   'Carlos Operador', '2026-05-03 10:00:00'),
(@cid, 178.40, 180.00, 1.60, 'COMPLETED', 'PIX',      'Carlos Operador', '2026-05-03 13:20:00'),
(@cid,  93.20,  93.20, 0.00, 'COMPLETED', 'DINHEIRO', 'Carlos Operador', '2026-05-02 09:45:00'),
(@cid, 265.80, 265.80, 0.00, 'COMPLETED', 'CREDITO',  'Carlos Operador', '2026-05-02 11:15:00'),
(@cid,  47.60,  50.00, 2.40, 'COMPLETED', 'PIX',      'Carlos Operador', '2026-05-01 14:30:00'),
(@cid, 189.90, 189.90, 0.00, 'COMPLETED', 'DEBITO',   'Carlos Operador', '2026-04-30 10:20:00'),
(@cid, 112.40, 112.40, 0.00, 'COMPLETED', 'DINHEIRO', 'Carlos Operador', '2026-04-30 12:00:00'),
(@cid,  78.50,  80.00, 1.50, 'COMPLETED', 'PIX',      'Carlos Operador', '2026-04-29 09:00:00'),
(@cid, 345.90, 345.90, 0.00, 'COMPLETED', 'CREDITO',  'Carlos Operador', '2026-04-29 11:30:00'),
(@cid,  62.30,  62.30, 0.00, 'COMPLETED', 'DEBITO',   'Carlos Operador', '2026-04-28 10:15:00'),
(@cid, 133.70, 135.00, 1.30, 'COMPLETED', 'DINHEIRO', 'Carlos Operador', '2026-04-28 14:00:00'),
(@cid, 201.50, 201.50, 0.00, 'COMPLETED', 'PIX',      'Carlos Operador', '2026-04-27 09:30:00'),
(@cid,  85.40,  85.40, 0.00, 'COMPLETED', 'CREDITO',  'Carlos Operador', '2026-04-26 11:00:00'),
(@cid, 167.80, 170.00, 2.20, 'COMPLETED', 'DEBITO',   'Carlos Operador', '2026-04-25 10:45:00'),
(@cid,  43.90,  43.90, 0.00, 'COMPLETED', 'DINHEIRO', 'Carlos Operador', '2026-04-24 13:00:00'),
(@cid, 298.60, 298.60, 0.00, 'COMPLETED', 'PIX',      'Carlos Operador', '2026-04-23 09:15:00'),
(@cid,  99.50, 100.00, 0.50, 'COMPLETED', 'CREDITO',  'Carlos Operador', '2026-04-22 11:45:00'),
(@cid, 154.20, 154.20, 0.00, 'COMPLETED', 'DEBITO',   'Carlos Operador', '2026-04-21 10:00:00'),
(@cid,  71.30,  71.30, 0.00, 'COMPLETED', 'DINHEIRO', 'Carlos Operador', '2026-04-20 12:30:00'),
(@cid, 223.80, 225.00, 1.20, 'COMPLETED', 'PIX',      'Carlos Operador', '2026-04-19 09:00:00'),
(@cid,  58.70,  58.70, 0.00, 'COMPLETED', 'CREDITO',  'Carlos Operador', '2026-04-18 11:15:00'),
(@cid, 186.40, 186.40, 0.00, 'COMPLETED', 'DEBITO',   'Carlos Operador', '2026-04-17 10:30:00'),
(@cid,  37.90,  40.00, 2.10, 'COMPLETED', 'DINHEIRO', 'Carlos Operador', '2026-04-16 14:00:00'),
(@cid, 312.50, 312.50, 0.00, 'COMPLETED', 'PIX',      'Carlos Operador', '2026-04-15 09:45:00'),
(@cid, 104.30, 104.30, 0.00, 'COMPLETED', 'CREDITO',  'Carlos Operador', '2026-04-14 11:00:00'),
(@cid, 143.60, 145.00, 1.40, 'COMPLETED', 'DEBITO',   'Carlos Operador', '2026-04-13 10:15:00'),
(@cid,  67.20,  67.20, 0.00, 'COMPLETED', 'DINHEIRO', 'Carlos Operador', '2026-04-12 12:45:00');

-- -------------------------------------------------------------
-- 6. Fluxo de Caixa — histórico + abertura de hoje
-- -------------------------------------------------------------
INSERT INTO cash_flow (company_id, type, amount, description, created_at) VALUES
-- Abertura de caixa hoje
(@cid, 'IN',  500.00, 'Abertura de caixa',                    '2026-05-05 08:00:00'),

-- Despesas operacionais recentes
(@cid, 'OUT', 380.00, 'Fornecedor EMS Medicamentos - NF 4521','2026-05-05 08:30:00'),
(@cid, 'OUT', 120.00, 'Energia elétrica - maio',              '2026-05-04 10:00:00'),
(@cid, 'OUT',  85.00, 'Serviço de limpeza',                   '2026-05-03 09:00:00'),

-- Entradas históricas (fechamentos de caixa)
(@cid, 'IN',  446.40, 'Fechamento de caixa - 04/05',          '2026-05-04 19:00:00'),
(@cid, 'IN',  234.10, 'Fechamento de caixa - 03/05',          '2026-05-03 19:00:00'),
(@cid, 'IN',  359.00, 'Fechamento de caixa - 02/05',          '2026-05-02 19:00:00'),
(@cid, 'IN',  189.90, 'Fechamento de caixa - 01/05',          '2026-05-01 19:00:00'),

-- Despesas históricas
(@cid, 'OUT', 2800.00,'Aluguel loja - maio',                   '2026-05-02 08:00:00'),
(@cid, 'OUT',  650.00,'Fornecedor Hypermarcas - NF 3812',      '2026-04-30 14:00:00'),
(@cid, 'OUT',  420.00,'Fornecedor Sanofi - NF 2994',           '2026-04-28 11:00:00'),
(@cid, 'OUT',  145.00,'Telefone e internet',                   '2026-04-27 09:00:00'),
(@cid, 'OUT',   89.90,'Material de escritório',                '2026-04-25 10:00:00');

SET foreign_key_checks = 1;

-- -------------------------------------------------------------
-- RESUMO DASHBOARD ESPERADO (hoje 05/05):
--   Vendas:       R$ 443,90
--   Pedidos:      9
--   Ticket médio: R$ 49,32
--   Saldo caixa:  R$ 500,00 - R$ 380,00 + vendas em dinheiro (~R$ 65,90 + R$ 93,20 abertura)
-- -------------------------------------------------------------
SELECT 'Demo Drogasil carregado com sucesso!' AS resultado;
