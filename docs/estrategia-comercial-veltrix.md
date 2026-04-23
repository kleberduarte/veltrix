# Estratégia Comercial — Veltrix ERP+PDV

> Documento gerado em 20/04/2026. Consolida análise de produto, precificação, posicionamento e roadmap.

---

## Sumário

1. [Visão Geral do Produto](#1-visão-geral-do-produto)
2. [Modelo de Negócio](#2-modelo-de-negócio)
3. [Precificação](#3-precificação)
4. [Posicionamento de Mercado](#4-posicionamento-de-mercado)
5. [Análise Competitiva — Linx](#5-análise-competitiva--linx)
6. [Gaps vs Linx](#6-gaps-vs-linx)
7. [Roadmap de Implementação](#7-roadmap-de-implementação)
8. [Próximos Passos](#8-próximos-passos)

---

## 1. Visão Geral do Produto

O **Veltrix** é um SaaS de gestão comercial (ERP + PDV) desenvolvido para pequenos e médios negócios. Opera 100% na nuvem, acessível por qualquer navegador, sem instalação.

### Stack tecnológica

| Camada | Tecnologia |
|---|---|
| Backend | Java 17 + Spring Boot 3.2 + Spring Security + JWT + JPA/Hibernate + Flyway |
| Banco de dados | MySQL 8 |
| Frontend | Next.js 14 + React 18 + TypeScript + Tailwind CSS |
| Hospedagem | Railway (backend) + Vercel (frontend) |
| Segurança | JWT, multi-tenant (company_id em todas as entidades), HTTPS |

### Módulos disponíveis hoje

| Módulo | Status |
|---|---|
| PDV com múltiplas formas de pagamento | ✓ Implementado |
| Gestão de produtos e estoque | ✓ Implementado |
| Cadastro de clientes (CPF, CEP, convite) | ✓ Implementado |
| Fechamento de caixa diário | ✓ Implementado |
| Fluxo de caixa (entradas e saídas) | ✓ Implementado |
| Relatórios (diário e por período) | ✓ Implementado |
| Terminais PDV + Monitor em tempo real | ✓ Implementado |
| Gestão de usuários e perfis | ✓ Implementado |
| Módulo Farmácia (PMC, lotes, receitas) | ✓ Implementado |
| Módulo Fast Food + Totem de autoatendimento | ✓ Implementado |
| Módulo Informática (Ordens de Serviço) | ✓ Implementado |
| White-label (logo, cores, URL exclusiva) | ✓ Implementado |
| PWA (instalável como app) | ✓ Implementado |
| Multi-tenant (múltiplas empresas isoladas) | ✓ Implementado |

---

## 2. Modelo de Negócio

### Estratégia escolhida: Software + Suporte Pago

O software é vendido por um valor baixo (remove a barreira de entrada). A receita principal vem do **suporte contínuo** — o cliente paga pela tranquilidade de ter alguém disponível, não pelo acesso ao sistema.

**Por que funciona:**

- Clientes de pequeno comércio não têm TI interno — dependem do fornecedor para qualquer dúvida
- Churn muito menor: cliente que depende do suporte não troca de sistema facilmente
- Relacionamento próximo gera indicações orgânicas
- Escalável: até ~35 clientes sozinho; acima disso, contratar suporte júnior para planos básicos, reservar seu tempo para os Dedicados

**Receita adicional:**

- Taxa de implantação por novo cliente
- Horas excedentes de suporte (R$ 120–180/h)
- Treinamento presencial ou remoto avulso

---

## 3. Precificação

### Planos mensais

| Plano | Valor/mês | Suporte incluso |
|---|---|---|
| **Gratuito / Trial** | R$ 0 | Base de conhecimento (sem atendimento humano) |
| **Essencial** | R$ 39 | E-mail — resposta em até 48h úteis |
| **Suporte Básico** | R$ 89 | WhatsApp — resposta em 24h, 1h de atendimento/mês |
| **Suporte Prioritário** | R$ 169 | WhatsApp — resposta em 4h, 3h de atendimento/mês |
| **Suporte Dedicado** | R$ 299 | Atendimento direto, resposta em 1h, ilimitado + visita mensal |

### Taxa de implantação

| Item | Valor |
|---|---|
| Implantação padrão (onboarding + configuração + treinamento 2h) | R$ 297 |
| Migração de dados de sistema anterior | A combinar |
| Treinamento adicional (por hora) | R$ 120–180/h |

> A taxa de implantação pode ser isenta em contratos anuais.

### Plano anual

- **15% de desconto** sobre o valor mensal (equivale a ~2 meses grátis)
- Pagamento à vista ou parcelado em até 12× no cartão

### Horas excedentes

Clientes que ultrapassam o pacote de horas do plano pagam **R$ 120–180/h** adicional.

### Raciocínio dos valores

| Faixa | Lógica |
|---|---|
| R$ 39 | Abaixo do limiar psicológico de "caro" para MEI — concorre com planilha e nada |
| R$ 89 | Ponto onde o cliente percebe ROI claro (economiza 2h/semana do gerente) |
| R$ 169 | Compete com sistemas verticais; diferencial é tudo integrado + atendimento rápido |
| R$ 299 | Para quem precisa de garantia total — farmácia, restaurante, multi-loja |

---

## 4. Posicionamento de Mercado

### Onde o Veltrix compete hoje

| Concorrente | Preço médio/mês | Fraqueza deles |
|---|---|---|
| Bling ERP | R$ 79–199 | Foco em e-commerce, PDV fraco |
| ContaAzul | R$ 69–299 | Financeiro bom, PDV inexistente |
| Sistemas regionais | R$ 50–150 | Tecnologia antiga, sem nuvem |
| Planilhas + nada | R$ 0 | Sem controle real |

### Onde o Veltrix quer chegar (com roadmap completo)

| Concorrente | Preço médio/mês | Como superar |
|---|---|---|
| Linx POS / Degust | R$ 300–800+ | Preço, interface, setup rápido, suporte humano |
| Linx Farma | R$ 200–500 | Já tem módulo farmácia — precisa de NF-e |
| MegaSistemas OS | R$ 80–180 | Já tem módulo OS — interface muito superior |
| iFood Gestor | R$ 120–300 | Já tem fast food + totem — integração iFood pendente |

### Vantagens estruturais do Veltrix vs Linx

| Vantagem | Detalhe |
|---|---|
| Interface moderna | A Linx parece sistema dos anos 2000 — Veltrix é web, responsivo, bonito |
| Setup em horas | A Linx leva semanas para implantar — Veltrix leva 1 dia |
| Preço justo | R$ 169/mês vs R$ 800+/mês da Linx com contrato anual obrigatório |
| Suporte humano direto | A Linx tem call center genérico — você conhece o cliente pelo nome |
| White-label nativo | A Linx não oferece white-label para revendedores pequenos |
| Totem de autoatendimento | A Linx cobra módulo separado caro — já existe no Veltrix |
| SaaS nativo | Sem instalação, sem servidor local, atualização automática |

---

## 5. Análise Competitiva — Linx

A **Linx** (adquirida pela Stone em 2022 por R$ 6,8 bilhões) é a maior empresa de software de gestão para varejo do Brasil.

### Portfólio Linx

| Produto | Segmento |
|---|---|
| Linx POS / Degust | PDV para varejo, restaurantes, fast food |
| Linx Microvix | ERP para moda e vestuário |
| Linx Farma | Sistema específico para farmácias |
| Linx e-Commerce | Plataforma de loja virtual |
| Linx Pay | Solução de pagamentos integrada |
| Linx OMS | Gestão de pedidos omnichannel |

### Fraquezas da Linx (oportunidades para o Veltrix)

- Contratos anuais obrigatórios com multa rescisória
- Implantação lenta e cara (semanas, consultores)
- Interface legada e complexa — treinamento longo
- Suporte via call center com baixa personalização
- Preço inacessível para micro e pequeno comércio
- Sem opção white-label para revendedores pequenos
- Burocracia de grandes corporações (Stone/Totvs)

---

## 6. Gaps vs Linx

### Bloqueadores críticos — sem isso não é possível substituir a Linx

#### 1. NFC-e / NF-e — Nota Fiscal Eletrônica

**O maior gap.** No Brasil, qualquer PDV que substitua um sistema estabelecido precisa emitir nota fiscal. Sem isso, o cliente não pode legalmente desligar o sistema atual.

| Documento | Uso |
|---|---|
| NFC-e (Nota Fiscal ao Consumidor Eletrônica) | Emissão no caixa do varejo para consumidor final |
| NF-e (Nota Fiscal Eletrônica) | Vendas B2B, emissão para pessoa jurídica |
| SAT / MFE | Obrigatório em SP e CE (equipamento físico) |

**O que precisa ser implementado:**
- Integração com SEFAZ por UF
- Suporte a certificado digital A1 (arquivo) e A3 (token/cartão)
- Cálculo de tributos: ICMS, PIS, COFINS, CST, CFOP, CEST
- Contingência offline (emissão em modo offline + envio posterior)
- Cancelamento e carta de correção
- Rejeições e tratamento de erros SEFAZ

**Recomendação técnica:** Integrar com API fiscal pronta (Focus NFe, eNotas, NFe.io) em vez de implementar do zero. Custo: R$ 0,10–0,50 por nota emitida. Economiza meses de desenvolvimento.

---

#### 2. TEF — Integração com maquininha de cartão

Hoje o Veltrix registra a forma de pagamento como cartão, mas não se comunica com a maquininha. O operador precisa digitar o valor duas vezes (no sistema e na maquininha), gerando erros.

**O que precisa ser implementado:**
- Integração TEF com Stone, Cielo, Rede, GetNet
- Protocolo SITEF ou integração via SDK da adquirente
- Fluxo: sistema envia valor → operador aproxima/insere cartão → maquininha confirma → sistema registra resultado

---

#### 3. Entrada de mercadoria / Gestão de compras

Hoje o Veltrix só decrementa estoque nas vendas. O comerciante não consegue fechar o ciclo de compra.

**O que precisa ser implementado:**
- Cadastro de fornecedores
- Pedido de compra
- Entrada de mercadoria por XML da NF-e do fornecedor (leitura automática)
- Atualização de estoque na entrada
- Controle de preço de custo e cálculo de margem
- Histórico de compras por fornecedor

---

### Gaps importantes — diferenciam muito

#### 4. Contas a Pagar e a Receber

O fluxo de caixa atual é simples (entrada/saída imediata). Para fechar o ciclo financeiro:

- Lançamentos com data de vencimento futura
- Parcelamentos (3× no cartão = 3 recebíveis futuros)
- Visão de caixa projetado (próximos 30/60/90 dias)
- Conciliação bancária básica (OFX/extrato)
- Alertas de vencimento

#### 5. Programa de Fidelidade

- Acúmulo de pontos por compra
- Cashback em próximas compras
- Cupons de desconto
- Histórico de pontos por cliente

#### 6. Promoções Avançadas

O Veltrix tem "Leve X Pague Y" e preço por data. Faltam:
- Desconto por categoria inteira (ex: 10% em toda linha de bebidas)
- Combo de produtos (A + B por R$ X)
- Desconto progressivo por volume
- Cupom de desconto por código (ex: BEMVINDO10)
- Promoção por horário (happy hour)

#### 7. Impressão de Etiquetas de Preço

- Geração de etiqueta com código de barras (EAN-13), nome do produto e preço
- Suporte a impressoras de etiqueta (Zebra, Argox, Elgin)
- Templates configuráveis por tamanho

#### 8. Relatórios BI / Gerenciais

- Curva ABC de produtos (quais vendem mais, mais rentáveis)
- Ranking de vendedores por faturamento
- Análise de margem por produto e por categoria
- Comparativo de período (mês a mês, ano a ano)
- Ticket médio por hora do dia
- Produtos com estoque abaixo do mínimo

---

### Ecossistema futuro

#### 9. Integração com Delivery (iFood, Rappi, Uber Eats)
- Recebimento de pedidos direto no PDV/cozinha
- Gestão de status do pedido integrada

#### 10. Loja Virtual / E-commerce
- Catálogo online sincronizado com o estoque físico
- Pedidos online entrando no mesmo PDV

#### 11. App Mobile Nativo
- O PWA já funciona, mas um app nativo (React Native) oferece melhor experiência offline e notificações push

---

## 7. Roadmap de Implementação

### Fase 1 — Viabilidade Fiscal (3–6 meses)
**Objetivo:** Permitir que qualquer comércio abandone o sistema anterior legalmente.

- [ ] NFC-e via API fiscal (Focus NFe ou eNotas)
- [ ] NF-e para vendas B2B
- [ ] Entrada de mercadoria com leitura de XML
- [ ] Cadastro de fornecedores
- [ ] Preço de custo e margem por produto

**Resultado:** O Veltrix passa a ser legalmente viável como sistema principal.

---

### Fase 2 — Ciclo Financeiro Completo (3–4 meses)
**Objetivo:** Cliente fecha o mês inteiro dentro do Veltrix.

- [ ] Contas a pagar e a receber com vencimentos
- [ ] Fluxo de caixa projetado
- [ ] TEF (integração Stone/Cielo/Rede)
- [ ] Conciliação bancária básica

**Resultado:** O Veltrix substitui também o sistema financeiro do cliente.

---

### Fase 3 — Retenção e Diferenciação (2–3 meses)
**Objetivo:** Cliente não quer mais trocar — produto vira vantagem competitiva para ele.

- [ ] Programa de fidelidade (pontos + cashback)
- [ ] Promoções avançadas (combo, categoria, cupom)
- [ ] Impressão de etiquetas
- [ ] Relatórios BI (curva ABC, margem, comparativo)
- [ ] Sistema de planos no código (FREE/ESSENCIAL/PROFISSIONAL/COMPLETO)

**Resultado:** Produto completo, churn mínimo, diferencial claro vs concorrentes.

---

### Fase 4 — Ecossistema (contínuo)
**Objetivo:** Tornar-se plataforma — cliente vende mais usando o Veltrix.

- [ ] Integração iFood / Rappi / Uber Eats
- [ ] Loja virtual sincronizada
- [ ] App mobile nativo (React Native)
- [ ] Marketplace / integrações via API pública

---

## 8. Próximos Passos Imediatos

| Prioridade | Ação |
|---|---|
| 1 | Implementar NFC-e via API fiscal (Focus NFe, eNotas ou NFe.io) |
| 2 | Implementar sistema de planos no código para cobrar por tier |
| 3 | Criar landing page de vendas com os planos e CTA |
| 4 | Definir SLA formal por plano e publicar na proposta comercial |
| 5 | Estruturar base de conhecimento (tutoriais em vídeo) para reduzir tickets |

---

*Documento interno — Veltrix · Atualizado em 20/04/2026*
