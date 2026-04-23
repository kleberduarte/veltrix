# Relatório Comparativo — Veltrix vs Linx
**Data:** Abril de 2026  
**Objetivo:** Mapear o que falta implantar no Veltrix para competir com a Linx no segmento de pequenos negócios

---

## 1. Panorama Atual — O que o Veltrix já tem

| Módulo | Status |
|---|---|
| Autenticação JWT + multi-tenancy | ✅ Completo |
| PDV (ponto de venda) com carrinho | ✅ Completo |
| Cadastro de produtos + promoções | ✅ Completo |
| Controle de estoque | ✅ Completo |
| Cadastro de clientes com CPF | ✅ Completo |
| Fechamento de caixa diário | ✅ Completo |
| Fluxo de caixa (IN/OUT) | ✅ Completo |
| Relatório diário (vendas, ticket médio) | ✅ Completo |
| Módulo Farmácia (lote, receita, PMC) | ✅ Completo |
| Módulo Fast Food / Totem (voucher, imagens) | ✅ Completo |
| Módulo Informática (OS com fluxo de status) | ✅ Completo |
| Perfis de usuário por role (ADM, ADMIN, VENDEDOR, TOTEM) | ✅ Completo |
| Identidade visual por empresa (white-label, cores, logo) | ✅ Completo |
| Multi-empresa com isolamento total por company_id | ✅ Completo |

---

## 2. O que a Linx tem e o Veltrix ainda não tem

### 2.1 Bloqueadores Críticos — sem isso o Veltrix não fecha negócio

| # | Feature | Impacto |
|---|---|---|
| 1 | **NFC-e / NF-e** (emissão de nota fiscal eletrônica) | Obrigatório por lei para varejo |
| 2 | **TEF** (integração com maquininha) | PDV sem TEF = atrito no balcão |
| 3 | **Entrada de mercadoria** (XML de NF-e, fornecedores) | Sem isso o estoque nunca bate |

### 2.2 Gaps Importantes — deixam o Veltrix abaixo da Linx

| # | Feature | Impacto |
|---|---|---|
| 4 | **Contas a pagar e receber** | Gestão financeira incompleta |
| 5 | **Programa de fidelidade** (pontos, cashback, cupons) | Retenção de clientes |
| 6 | **Promoções avançadas** (combos, desconto progressivo, cupons) | Competitividade no varejo |
| 7 | **Impressão de etiquetas** (código de barras, preço) | Operação básica de estoque |
| 8 | **Relatórios BI** (curva ABC, margem, ranking vendedores) | Tomada de decisão gerencial |

### 2.3 Ecossistema Futuro — diferencial competitivo

| # | Feature | Impacto |
|---|---|---|
| 9 | **Integração iFood / delivery** | Indispensável para fast food |
| 10 | **Marketplace** | Canal extra de venda |
| 11 | **App mobile nativo** | Gestão fora do balcão |

---

## 3. Vantagens do Veltrix sobre a Linx (já hoje)

| Vantagem | Linx | Veltrix |
|---|---|---|
| Preço | R$ 300–800+/mês + contrato anual | R$ 39–299/mês, sem fidelidade |
| Setup | Dias/semanas com consultor | Horas, auto-onboarding |
| Interface | Pesada, legado anos 90–2000 | Moderna, responsiva |
| White-label | Não disponível | Nativo (cores, logo, domínio) |
| Suporte humano | Call center genérico | Direto com o desenvolvedor |
| Multi-segmento | Módulos separados caros | Farmácia, Fast Food, Informática incluídos |
| Multi-empresa SaaS | Não | Nativo desde o início |

---

## 4. Roadmap de Implantação — Passo a Passo

### FASE 1 — Viabilidade Fiscal (3–6 meses)
> Sem esta fase, o Veltrix não pode ser usado em nenhum comércio formal.

#### 4.1 NFC-e / NF-e

**O que fazer:**
1. Escolher API fiscal: **Focus NFe** (foco.nfe.io) ou **eNotas** (enotas.io) — terceirizam comunicação com SEFAZ
   - Alternativa avançada: biblioteca Java open source [Java_NFe (Samuel Oliveira)](https://github.com/Samuel-Oliveira/Java_NFe)
2. Criar migração Flyway `V29__nfce.sql` com tabelas `nfce_documentos` e `nfce_numeracao`
3. Criar entidade `NfceDocumento` com campos: numero, serie, chave_acesso, status, xml_enviado, xml_retorno, protocolo, ambiente
4. Criar enum `StatusNfce`: PENDENTE, AUTORIZADA, REJEITADA, CANCELADA, CONTINGENCIA
5. Adicionar campos fiscais em `ParametroEmpresa`: CSC, CSC_ID, serie, ambiente, certificado PFX, UF
6. Implementar `NfceService`: montar XML → assinar → transmitir → salvar retorno
7. Criar `NfceController` com endpoints: `POST /nfce/emitir/{orderId}`, `GET /nfce/{id}/danfe`, `POST /nfce/{id}/cancelar`
8. No frontend: botão "Emitir NFC-e" no PDV após fechar venda + modal com chave de acesso + link DANFE

**Esforço estimado:** 13–19 dias úteis

---

#### 4.2 Entrada de Mercadoria

**O que fazer:**
1. Criar tabela `fornecedores` (razão social, CNPJ, telefone, email, endereço)
2. Criar tabela `entradas_mercadoria` (fornecedor, data, número NF, total)
3. Criar tabela `entradas_itens` (produto, quantidade, custo unitário, lote, validade)
4. Implementar upload e parse de XML de NF-e do fornecedor
5. Ao confirmar entrada: atualizar `products.stock` e `products.costPrice` automaticamente
6. Criar tela frontend: listagem de entradas + formulário manual + upload XML

**Esforço estimado:** 8–12 dias úteis

---

### FASE 2 — Ciclo Financeiro Completo (3–4 meses após Fase 1)

#### 4.3 Contas a Pagar e Receber

**O que fazer:**
1. Criar tabela `contas` (tipo: PAGAR/RECEBER, valor, vencimento, parcelas, status, categoria)
2. Criar tabela `parcelas_conta` (numero, valor, vencimento, status: ABERTA/PAGA/ATRASADA)
3. Geração automática de contas a receber ao fechar uma venda parcelada no cartão
4. Geração automática de contas a pagar ao registrar uma entrada de mercadoria
5. Tela de fluxo de caixa projetado (calendário de vencimentos)
6. Conciliação básica: marcar parcela como paga + registrar no CashFlow

**Esforço estimado:** 10–15 dias úteis

---

#### 4.4 TEF — Integração com Maquininha

**O que fazer:**
1. Escolher provedor: **Stone** (melhor API para devs), **Cielo** ou **GetNet**
2. Integrar SDK do provedor no backend (Spring Boot)
3. Fluxo: PDV envia valor → backend chama API da maquininha → aguarda aprovação → confirma venda
4. Tratar respostas: aprovado, recusado, timeout, cancelamento
5. No frontend: tela de aguarde ("Aguardando pagamento na maquininha...") com cancelar

**Esforço estimado:** 8–12 dias úteis

---

### FASE 3 — Retenção de Clientes (2–3 meses após Fase 2)

#### 4.5 Programa de Fidelidade

**O que fazer:**
1. Criar tabela `fidelidade_config` (pontos por real, meta de resgate, valor do cashback)
2. Criar tabela `fidelidade_extrato` (cliente, tipo: CREDITO/DEBITO, pontos, venda vinculada)
3. A cada venda: creditar pontos automaticamente no extrato do cliente
4. Criar endpoint de resgate: valida saldo, cria DÉBITO, aplica desconto na venda
5. Tela frontend: saldo de pontos visível no PDV ao identificar cliente + botão resgatar

**Esforço estimado:** 6–8 dias úteis

---

#### 4.6 Promoções Avançadas

**O que fazer:**
1. Criar tabela `campanhas_promocionais` (nome, tipo, período, regras em JSON)
2. Tipos a implementar:
   - Desconto por categoria de produto
   - Combo (produto A + produto B = desconto)
   - Desconto progressivo (a partir de X itens, Y% de desconto)
   - Cupom por código (ex: `PROMO10`)
3. Engine de promoções: ao montar carrinho, avaliar campanhas ativas e aplicar a mais vantajosa
4. Tela de gestão de campanhas no frontend

**Esforço estimado:** 10–14 dias úteis

---

#### 4.7 Impressão de Etiquetas

**O que fazer:**
1. Integrar biblioteca de geração de código de barras (ex: ZXing para Java)
2. Criar endpoint `GET /products/{id}/etiqueta?formato=pdf` que gera PDF da etiqueta
3. Suportar impressão em lote: `POST /products/etiquetas` com lista de IDs e quantidades
4. Formatos sugeridos: 50×25mm, 100×50mm (Zebra / térmica comum)
5. Tela frontend: selecionar produtos + quantidade + imprimir

**Esforço estimado:** 4–6 dias úteis

---

#### 4.8 Relatórios BI

**O que fazer:**
1. Curva ABC de produtos (por faturamento: A=80%, B=15%, C=5%)
2. Ranking de vendedores (total vendido, ticket médio, qtd de vendas)
3. Margem por produto (`(precoVenda - custoProduto) / precoVenda * 100`)
4. Comparativo mensal (gráfico de barras: mês a mês nos últimos 12 meses)
5. Exportação em CSV/Excel para os 4 relatórios
6. Tela frontend com filtros de período e gráficos (biblioteca: Recharts ou Chart.js)

**Esforço estimado:** 8–12 dias úteis

---

### FASE 4 — Ecossistema (contínuo, pós Fase 3)

#### 4.9 Integração iFood / Delivery

- Webhook de pedidos iFood → criar Order automaticamente no Veltrix
- Status de preparo sincronizado (aceito, em preparo, pronto, saiu)
- Requer módulo Fast Food ativo

#### 4.10 Marketplace

- Catálogo público por empresa (URL única)
- Carrinho de compras online → Order no Veltrix
- Integração com gateway de pagamento (Stripe, Mercado Pago)

#### 4.11 App Mobile Nativo

- React Native reutilizando a API existente
- Dashboard, PDV simplificado, alertas de estoque mínimo

---

## 5. Resumo Executivo — Prioridade × Impacto

| Prioridade | Feature | Motivo |
|---|---|---|
| 🔴 1 | NFC-e | Obrigação legal — sem isso perde 100% dos clientes formais |
| 🔴 2 | Entrada de mercadoria | Estoque real exige entrada por NF |
| 🔴 3 | Contas a pagar/receber | Ciclo financeiro completo |
| 🟡 4 | TEF | Comodidade no balcão — client pode usar maquininha externa por ora |
| 🟡 5 | Relatórios BI | Diferencial gerencial |
| 🟡 6 | Promoções avançadas | Retenção de clientes |
| 🟢 7 | Fidelidade | Retenção — complementa promoções |
| 🟢 8 | Etiquetas | Qualidade de vida operacional |
| ⚪ 9+ | Ecossistema | Crescimento futuro |

---

## 6. Estimativa Total de Esforço

| Fase | Features | Esforço |
|---|---|---|
| Fase 1 | NFC-e + Entrada de mercadoria | ~21–31 dias úteis |
| Fase 2 | Contas a pagar/receber + TEF | ~18–27 dias úteis |
| Fase 3 | Fidelidade + Promoções + BI + Etiquetas | ~28–40 dias úteis |
| **Total Fases 1–3** | | **~67–98 dias úteis (~4–5 meses)** |

> Trabalhando em ritmo consistente (8–10 dias úteis/mês com outras demandas), o Veltrix estaria
> em condições de competir de frente com a Linx em aproximadamente **6–8 meses**.

---

## 7. Próximo Passo Imediato

**Começar pela NFC-e — Fase 1, item 1.**

Decisão chave a tomar antes de codar:

| Opção | Vantagem | Desvantagem |
|---|---|---|
| **API terceirizada** (Focus NFe, eNotas) | Rápida de integrar, cuida da SEFAZ | Custo mensal por empresa (~R$30–80/empresa) |
| **Biblioteca Java_NFe** (open source) | Zero custo por emissão | Complexidade: gerenciar certificados, webservices, contingência |

**Recomendação:** Começar com API terceirizada (Focus NFe) para ter a feature funcionando rápido,
e depois avaliar se migrar para biblioteca Java quando a base de clientes justificar o custo.

---

*Documento gerado em abril de 2026 — Sistema Veltrix ERP+PDV*
