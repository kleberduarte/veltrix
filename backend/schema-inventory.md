# Inventário schema JPA vs Flyway (Veltrix)

Atualizado após auditoria: alinhar PRD (`ddl-auto=validate`) com migrations.

**MySQL 9 (Railway):** o `pom.xml` fixa `flyway.version` ≥ **11.15** (o BOM do Spring Boot 3.2 trazia Flyway 9.x, que só declara suporte até MySQL 8.0). Sem isso, o migrate no servidor pode falhar ou ficar instável no MySQL 9.4.

## Entidades (`@Table`)

| Tabela | Cobertura Flyway | Notas |
|--------|------------------|--------|
| `companies` | V1 + V3,V5,V6,V12,V13,V14 | OK |
| `users` | V1 + V2,V4,V15 + **V23** (telefone, must_change_password) | |
| `products` | V1 + **V22** (campos farmácia/promo/tipo) | V1 era mínimo |
| `orders` | V1 + V9 Java + **V21** + **V24** (no-op; histórico) + **V25** (Java: garante `forma_pagamento`) + `Order.forma_pagamento` VARCHAR | V9 Java faz *no-op* se a coluna não existia; V24 antigo com SQL problemático foi substituído por no-op + V25 |
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
- **V25** — garante coluna `forma_pagamento` se ainda não existir (idempotente).

## Flyway "failed" / checksum (Railway)

Se aparecer `Detected failed migration to version 24` ou checksum de V24: o backend executa `repair()` antes de `migrate()` (configurável). Migração **V24** no repo é um no-op; a coluna é criada na **V25** (Java).

## Risco DES local

Se `ddl-auto=update` já criou colunas, `ALTER TABLE ... ADD` pode falhar (duplicado). Nesse caso: base nova, ou remover colunas duplicadas com cuidado, ou `flyway repair` conforme caso.

## Verificação antes de deploy (recomendado)

Com Docker ativo, no diretório `backend`:

```bash
mvn verify
```

O teste `SchemaValidationIT` sobe um MySQL 8 (Testcontainers), aplica **todas** as migrations Flyway e inicia o contexto com `ddl-auto=validate` (igual à produção). Se houver divergência entidade ↔ tabela, o build falha antes do deploy.

## Próximos deploys

Com migrations até **V24**, o validate cobre **Order.forma_pagamento** em bases onde a V9 Java não criou a coluna. Se ainda falhar, copiar a linha exata `Schema-validation: ...` do log.
