# Inventário schema JPA vs Flyway (Veltrix)

Atualizado após auditoria: alinhar PRD (`ddl-auto=validate`) com migrations.

## Entidades (`@Table`)

| Tabela | Cobertura Flyway | Notas |
|--------|------------------|--------|
| `companies` | V1 + V3,V5,V6,V12,V13,V14 | OK |
| `users` | V1 + V2,V4,V15 + **V23** (telefone, must_change_password) | |
| `products` | V1 + **V22** (campos farmácia/promo/tipo) | V1 era mínimo |
| `orders` | V1 + V9 Java + **V21** + `Order.forma_pagamento` como VARCHAR | |
| `order_items` | V1 + **V20** | |
| `cash_flow` | V1 | OK (campos batem com entidade) |
| `pdv_terminais` | V4 | OK |
| `fechamentos_caixa` | V6_1 + V7 | OK |
| `clientes` | V9_1 + V10 | OK |
| `parametros_empresa` | V10_1 + V11 | OK |
| `ordens_servico` | V17 + `OrdemServico.status` VARCHAR | OK |
| `pmc_referencias` | V18 | OK |
| `produto_lotes` | V19 | OK |

## Migrations Java

- **V9** — `forma_pagamento` em `orders` (rebuild coluna).

## Risco DES local

Se `ddl-auto=update` já criou colunas, `ALTER TABLE ... ADD` pode falhar (duplicado). Nesse caso: base nova, ou remover colunas duplicadas com cuidado, ou `flyway repair` conforme caso.

## Próximos deploys

Com **V22** e **V23**, o validate deve cobrir **Product** e **User** por completo. Se ainda falhar, copiar a linha exata `Schema-validation: ...` do log.
