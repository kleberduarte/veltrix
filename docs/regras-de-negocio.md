# Regras de Negócio — Veltrix ERP+PDV

> Documento gerado em 2026-04-20. Reflete o estado atual do backend Spring Boot.

---

## Sumário

1. [Autenticação e Autorização](#1-autenticação-e-autorização)
2. [PDV — Ponto de Venda](#2-pdv--ponto-de-venda)
3. [Terminais PDV](#3-terminais-pdv)
4. [Produtos e Estoque](#4-produtos-e-estoque)
5. [Clientes](#5-clientes)
6. [Fechamento de Caixa](#6-fechamento-de-caixa)
7. [Fluxo de Caixa (Cash Flow)](#7-fluxo-de-caixa-cash-flow)
8. [Ordens de Serviço (Módulo Informática)](#8-ordens-de-serviço-módulo-informática)
9. [Módulo Farmácia](#9-módulo-farmácia)
10. [Módulo Fast Food / Totem](#10-módulo-fast-food--totem)
11. [Parâmetros da Empresa](#11-parâmetros-da-empresa)
12. [Multi-Tenancy](#12-multi-tenancy)
13. [Cálculos e Fórmulas](#13-cálculos-e-fórmulas)
14. [Segurança e Persistência](#14-segurança-e-persistência)
15. [Integrações entre Módulos](#15-integrações-entre-módulos)

---

## 1. Autenticação e Autorização

### 1.1 Perfis de Usuário (Role)

| Perfil | Descrição |
|---|---|
| `ADM` | Administrador Global — acesso total a todas as empresas |
| `ADMIN_EMPRESA` | Administrador de Empresa — gerencia o próprio tenant |
| `VENDEDOR` | Acesso ao PDV e rotinas de venda |
| `TOTEM` | Interface exclusiva de quiosque/fast food |

### 1.2 Restrições por Perfil

- `ADMIN_EMPRESA` **não pode** acessar a empresa reservada (systemDefault).
- `ADMIN_EMPRESA` só gerencia usuários da sua própria empresa.
- Apenas `ADM` pode criar outro `ADM`.
- `ADMIN_EMPRESA` **não pode** ser criado na empresa reservada.
- `VENDEDOR` e `TOTEM` não podem gerar código de convite PDV.
- `ADM` pode alternar entre empresas via `switchCompany`.

### 1.3 Regras de Senha

- Comprimento mínimo: **8 caracteres** (recomendado).
- Senha provisória gerada pelo sistema: 14 caracteres aleatórios.
- Código de convite: 8 caracteres alfanuméricos (A–Z, 2–9, excluindo I, O, L, 1).
- Email é **único globalmente** no sistema (trim + lowercase).

### 1.4 Fluxos de Acesso

| Fluxo | Regra |
|---|---|
| `register` | Exige código de convite PDV válido |
| `login` | Email + senha |
| `setupInitialPassword` | Valida senha provisória e define definitiva; `mustChangePassword=true` |
| `definirPrimeiraSenhaConvite` | Convite sem senha; `inviteSelfRegistration=true` |
| `changePassword` | Usuário autenticado altera própria senha |

### 1.5 Exclusão de Usuários

- Não é possível excluir **o próprio usuário**.
- Não é possível excluir o **único usuário do sistema**.
- Se o usuário tem vendas associadas, o histórico é reatribuído ao primeiro substituto encontrado (prioridade: `ADM`, depois menor ID).
- Fechamentos de caixa vinculados são desvinculados automaticamente.

### 1.6 Empresa Reservada (Default)

- Identificada por `systemDefault=true` ou nome normalizado "default" / "sistema".
- Não pode ser excluída.
- Serve como contexto administrativo global para o `ADM`.
- `ADMIN_EMPRESA` não pode acessar nem ser criado nela.

---

## 2. PDV — Ponto de Venda

### 2.1 Pedidos — Campos Obrigatórios

- Lista de itens: **não vazia**.
- Cada item: `productId` (@NotNull) e `quantity` (@NotNull, mínimo 1).
- Forma de pagamento: padrão `DINHEIRO` se não informada.

### 2.2 Formas de Pagamento

| Forma | Regra Especial |
|---|---|
| `DINHEIRO` | Padrão |
| `DÉBITO` | — |
| `CARTÃO` | Suporta múltiplas parcelas |
| `PIX` | Aceita chave Pix opcional |
| `VOUCHER` | **Só permitido** se módulo Fast Food ativo |

**Regra de parcelas:**
- Apenas `CARTÃO` suporta mais de 1 parcela.
- Qualquer outra forma: `parcelas` é forçado para `1`.

**Regra de VOUCHER:**
- Requer `parametroEmpresa.moduloFastFoodAtivo = true`.
- Caso contrário: erro *"Pagamento por vale refeição (voucher) só é permitido para empresas com módulo Fast Food ativo."*

### 2.3 Validação de Estoque

- Estoque verificado **antes** de processar o pedido.
- Se `product.stock < item.quantity`: erro *"Estoque insuficiente para: {nome_produto}"*.
- Estoque decrementado automaticamente ao confirmar a venda (transação atômica).

### 2.4 Preço Efetivo

- Se `emPromocao = true` **ou** data atual dentro de `[promocaoInicio, promocaoFim]`: usa `precoPromocional`.
- Promoção Leve X Pague Y: se `quantidade >= promoQtdLevar`, calcula unidades cobradas:
  ```
  grupos   = quantidade / levar
  restante = quantidade % levar
  unidades_cobradas = (grupos * pagar) + restante
  precoFinal = base × unidades_cobradas
  ```

### 2.5 Cálculo de Totais

```
subtotal = Σ (precoEfetivo(item) × quantity)
total    = max(subtotal - desconto, 0)
```

- `desconto`: valor absoluto, opcional, padrão `0`.
- `total` nunca é negativo.

### 2.6 Status do Pedido

- Status padrão ao criar: **`COMPLETED`** (venda finalizada imediatamente).

---

## 3. Terminais PDV

### 3.1 Campos e Restrições

- Código: **único por empresa**.
- Nome: obrigatório.
- Status do caixa: `LIVRE` (padrão) | `BLOQUEADO` | `EM_USO` | `FECHADO`.

### 3.2 Criação Automática de Terminais

| Caso | Código Gerado |
|---|---|
| Terminal pessoal de vendedor/totem | `V-{userId}` (sufixo `-1`, `-2` se já existir) |
| ADM operando em empresa diferente | `ADM-{userId}-E{companyId}` |

### 3.3 Vinculação Automática

- Se empresa tem **exatamente 1 terminal ativo**, o usuário é vinculado automaticamente.

### 3.4 Heartbeat

- `ultimoHeartbeat` e `ultimoOperador` atualizados a cada operação PDV.
- `statusCaixa` atualizado se informado.

---

## 4. Produtos e Estoque

### 4.1 Campos Obrigatórios

- `name`: @NotBlank
- `price`: @NotNull, mínimo `0.01`

### 4.2 Estoque

- `stock`: mínimo 0 (@Min(0)).
- `estoqueMinimo`: opcional (para alertas).
- Tipo: `UNIDADE` (padrão) ou `CAIXA`.

### 4.3 Exclusão Lógica

- Produtos não são deletados do banco; `active = false`.

### 4.4 Imagem

- URL HTTPS, comprimento máximo 2048 caracteres.
- Tamanho máximo no upload: **3 MB**.
- Formatos aceitos: JPEG, PNG, WebP, GIF.

### 4.5 Promoções

| Campo | Descrição |
|---|---|
| `emPromocao` | Flag booleana |
| `precoPromocional` | Valor alternativo |
| `promocaoInicio` / `promocaoFim` | Período inclusivo |
| `promoQtdLevar` | Quantidade para acionar Leve X Pague Y |
| `promoQtdPagar` | Quantidade efetivamente cobrada |

### 4.6 Módulo Farmácia (campos extras)

| Campo | Descrição |
|---|---|
| `tipoControle` | `COMUM`, `ANTIMICROBIANO`, `CONTROLADO` |
| `exigeReceita` | Receita obrigatória na venda |
| `exigeLote` | Lote obrigatório na venda |
| `exigeValidade` | Validade obrigatória na venda |
| `registroMs` | Registro no Ministério da Saúde |
| `pmc` | Preço Máximo ao Consumidor |

### 4.7 Lotes de Produtos

- `codigoLote`: obrigatório.
- `validade`: data opcional.
- `quantidadeAtual`: inteiro, padrão 0.
- Vinculados a `OrderItem` para rastreabilidade.

### 4.8 Validação de PMC

| Status | Condição |
|---|---|
| `OK` | Preço < PMC **ou** sem referência vigente |
| `AVISO` | Preço == PMC |
| `VIOLACAO` | Preço > PMC |

- Modo configurável por empresa: `ALERTA` (avisa) ou `BLOQUEIO` (impede a venda).
- Requer `parametroEmpresa.farmaciaPmcAtivo = true`.

---

## 5. Clientes

### 5.1 Validações de Cadastro

| Campo | Regra |
|---|---|
| Nome | @NotBlank, 3–200 caracteres |
| Email | @NotBlank, @Email, máx 255 chars, **único por empresa** |
| Telefone | @NotBlank, 8–20 caracteres |
| CPF | @NotBlank, **único por empresa**, dígito verificador validado |
| CEP | Opcional; se informado: exatamente 8 dígitos |
| Endereço | Vazio **ou** ≥ 10 caracteres (1–9 chars é inválido) |

### 5.2 Validação de CPF

- Remove caracteres não numéricos.
- Deve ter exatamente 11 dígitos.
- Algoritmo de dígito verificador executado.
- Erro: *"CPF deve conter 11 dígitos"* ou *"CPF inválido"*.

### 5.3 Normalização Automática

- Nome: trim + colapso de múltiplos espaços.
- Email: trim + lowercase.
- CPF: apenas dígitos.

### 5.4 Código de Convite PDV

- Gerado automaticamente: `UUID.substring(0, 8).toUpperCase()`.
- Pode ser regenerado manualmente.

---

## 6. Fechamento de Caixa

### 6.1 Regra Principal

- **Máximo 1 fechamento por dia por empresa.**
- Tentativa de segundo fechamento no mesmo dia: erro *"Caixa já foi fechado hoje"*.

### 6.2 Totalizações por Forma de Pagamento

- Total Dinheiro, Total Cartão, Total Débito, Total PIX, Total Voucher.
- Total Geral = soma de todos.
- Quantidade de Vendas = contagem do dia.

### 6.3 Divergência de Caixa

```
diferenca = valorInformadoDinheiro - totalDinheiroVendas
```

- `valorInformadoDinheiro`: declarado pelo operador no fechamento.

### 6.4 Campos Capturados

- `dataReferencia`: LocalDate (dia da operação).
- `dataFechamento`: LocalDateTime (momento exato do fechamento, automático).
- `terminalId`: opcional (associa a terminal específico).
- `nomeOperador`: extraído da autenticação.

---

## 7. Fluxo de Caixa (Cash Flow)

### 7.1 Tipos de Movimento

- `IN`: entrada.
- `OUT`: saída.

### 7.2 Registro Automático por Venda

- Cada pedido concluído gera automaticamente uma entrada `IN`.
- Descrição automática: *"Venda #{orderId}"*.

### 7.3 Lançamentos Manuais

- Usuários podem registrar movimentos IN/OUT manualmente via API.

---

## 8. Ordens de Serviço (Módulo Informática)

### 8.1 Ativação

- Requer `parametroEmpresa.moduloInformaticaAtivo = true`.
- Erro se desativado: *"Módulo de informática desativado para esta empresa."*
- A empresa reservada (Default) ignora essa validação.

### 8.2 Numeração

- Número único por empresa, auto-incrementado: `maxNumeroOs + 1`.

### 8.3 Financeiro da OS

```
valorTotal = max(valorServico - desconto, 0)
```

- `valorServico`: padrão ZERO.
- `desconto`: valor absoluto, padrão ZERO.

### 8.4 Fluxo de Status

```
ABERTA → EM_ANALISE → AGUARDANDO_APROVACAO → CONCLUIDA → ENTREGUE
  └─ CANCELADA (em qualquer etapa antes de ENTREGUE)
```

| Status | Transições Válidas |
|---|---|
| `ABERTA` | `EM_ANALISE`, `CANCELADA` |
| `EM_ANALISE` | `AGUARDANDO_APROVACAO`, `CANCELADA` |
| `AGUARDANDO_APROVACAO` | `CONCLUIDA`, `CANCELADA` |
| `CONCLUIDA` | `ENTREGUE`, `CANCELADA` |
| `ENTREGUE` | — (terminal) |
| `CANCELADA` | — (terminal) |

### 8.5 Datas Automáticas

| Data | Quando é setada |
|---|---|
| `dataAbertura` | Criação da OS |
| `dataConclusao` | Transição para `CONCLUIDA` |
| `dataEntrega` | Transição para `ENTREGUE` |
| `dataPrevisaoEntrega` | Informada na criação/edição |

### 8.6 Autocomplete

- Retorna até **40 sugestões** por campo.
- Busca case-insensitive (LIKE) em: nomeCliente, telefone, equipamento, marca, modelo, etc.

---

## 9. Módulo Farmácia

### 9.1 Flags de Ativação

| Flag | Descrição |
|---|---|
| `moduloFarmaciaAtivo` | Habilita o módulo (padrão: false) |
| `farmaciaLoteValidadeObrigatorio` | Exige lote+validade em todos os produtos |
| `farmaciaControladosAtivo` | Habilita tipo CONTROLADO |
| `farmaciaAntimicrobianosAtivo` | Habilita tipo ANTIMICROBIANO |
| `farmaciaPmcAtivo` | Ativa validação de PMC |
| `farmaciaPmcModo` | `ALERTA` (padrão) ou `BLOQUEIO` |

### 9.2 Validações na Venda

| Condição | Campo Obrigatório no Item |
|---|---|
| `produto.exigeReceita = true` | `receitaTipo`, `receitaNumero`, `receitaPrescritor`, `receitaData` |
| `produto.exigeLote = true` | `loteCodigo` |
| `produto.exigeValidade = true` | `loteValidade` |

---

## 10. Módulo Fast Food / Totem

### 10.1 Flags de Ativação

| Flag | Descrição |
|---|---|
| `moduloFastFoodAtivo` | Habilita o módulo (padrão: false) |
| `tipoEstabelecimentoFastFood` | `HAMBURGUERIA`, `PIZZARIA`, `RESTAURANTE`, `LANCHONETE`, `ACAI_SORVETERIA`, `OUTROS` |

### 10.2 Comportamentos Especiais

- Forma de pagamento `VOUCHER` habilitada apenas com módulo ativo.
- Role `TOTEM` criado automaticamente em convites de empresas Fast Food.
- `totalVoucher` agregado no Fechamento de Caixa.

---

## 11. Parâmetros da Empresa

### 11.1 Segmentos Disponíveis

- `GERAL` (padrão)
- `FARMACIA`
- `INFORMATICA`
- `FAST_FOOD`

### 11.2 Identidade Visual

- `nomeEmpresa`, `logoUrl`, `mensagemBoasVindas`.
- Cores: `corPrimaria`, `corSecundaria`, `corFundo`, `corTexto`, `corBotao`, `corBotaoTexto` (todos com defaults).

### 11.3 Tokens de Acesso da Empresa

| Token | Descrição |
|---|---|
| `onboardingToken` | Enviado ao criar empresa; invalidado após primeiro uso de `ADMIN_EMPRESA` |
| `accessToken` | URL exclusiva para branding no login (permanente) |
| `pdvInviteCode` | Código de convite público para auto-registro; regenerável |

---

## 12. Multi-Tenancy

### 12.1 Isolamento de Dados

- Todas as tabelas possuem `company_id`.
- Todas as queries filtram por `TenantContext.getCompanyId()`.
- Usuário acessa **apenas dados da sua empresa** (exceto `ADM`).

### 12.2 Cascata de Exclusão de Empresa

Ordem necessária para evitar violações de FK:

1. Desvincular usuários de terminais (seta NULL).
2. Deletar lotes, pedidos, fechamentos, fluxo de caixa, OS, referências PMC, clientes.
3. Deletar terminais.
4. Deletar produtos.
5. Deletar parâmetros da empresa.
6. Deletar usuários.
7. Deletar empresa.

---

## 13. Cálculos e Fórmulas

### Preço Efetivo de Item

```java
BigDecimal base = emPromocao ? precoPromocional : price;
if (levar > 0 && pagar > 0 && quantidade >= levar) {
    int grupos   = quantidade / levar;
    int restante = quantidade % levar;
    int cobrar   = grupos * pagar + restante;
    return base.multiply(BigDecimal.valueOf(cobrar));
}
return base.multiply(BigDecimal.valueOf(quantidade));
```

### Total do Pedido

```java
BigDecimal subtotal = items.stream().map(i -> i.price * i.quantity).sum();
BigDecimal total    = subtotal.subtract(desconto).max(BigDecimal.ZERO);
```

### Ticket Médio (Relatórios)

```java
BigDecimal ticketMedio = totalVendas / quantidadePedidos;  // 2 casas, HALF_UP
```

### Diferença de Caixa

```java
BigDecimal diferenca = valorInformadoDinheiro - totalDinheiroVendas;
```

---

## 14. Segurança e Persistência

### 14.1 Precisão Monetária

- Banco: `DECIMAL(10, 2)`.
- Java: `BigDecimal`, arredondamento `HALF_UP`.

### 14.2 Timestamps

- `createdAt`: NOT NULL, DEFAULT CURRENT_TIMESTAMP, imutável após criação.
- `updatedAt`: DEFAULT CURRENT_TIMESTAMP, atualizado via `@PreUpdate`.
- Precisão de microsegundos: `DATETIME(6)`.

### 14.3 Validações Gerais

| Campo | Regra |
|---|---|
| Nome de empresa | 2–255 caracteres |
| Imagem de produto | Máx 3 MB; JPEG, PNG, WebP, GIF |
| Período de relatório | Máx 366 dias; data final ≥ data inicial |
| Email | Trim + lowercase; único globalmente |

---

## 15. Integrações entre Módulos

| Evento | Efeito |
|---|---|
| Venda confirmada | Estoque decrementado atomicamente |
| Venda confirmada | Entrada `IN` criada em CashFlow |
| Venda do dia | Agregada por forma de pagamento no Fechamento de Caixa |
| Produto com lote | Lote vinculado ao OrderItem para rastreabilidade |
| OS criada/concluída | Campo `vendaId` opcional liga OS a pedido (fatura serviço + produtos juntos) |
| Usuário vinculado | Máximo 1 terminal por usuário; terminal pode ter múltiplos usuários |

---

*Fim do documento.*
