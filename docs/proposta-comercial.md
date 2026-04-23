# Proposta Comercial — Veltrix ERP+PDV

> **Modelo de proposta.** Substitua os campos em `[colchetes]` antes de enviar ao cliente.

---

**Proposta nº:** [000/2026]
**Data:** [DD/MM/AAAA]
**Válida até:** [DD/MM/AAAA — 30 dias]

**Destinatário:**
Empresa: [Nome da Empresa]
Responsável: [Nome do Contato]
E-mail: [email@empresa.com.br]
Telefone: [+55 (XX) XXXXX-XXXX]

---

## 1. Sobre a Veltrix

A **Veltrix** é uma plataforma SaaS de gestão comercial desenvolvida para pequenos e médios negócios que precisam de um sistema completo, rápido e acessível — sem instalação, sem servidor próprio, sem manutenção técnica.

O sistema opera 100% na nuvem, acessível de qualquer dispositivo com navegador (computador, tablet, celular), e conta com módulos ativados conforme o segmento de cada cliente: varejo geral, farmácia, fast food/restaurante e informática/assistência técnica.

---

## 2. O Problema que Resolvemos

| Dor comum | Como a Veltrix resolve |
|---|---|
| PDV lento e difícil de usar | Interface otimizada para velocidade, atalhos de teclado, busca instantânea |
| Estoque desatualizado | Controle em tempo real: cada venda deduz automaticamente |
| Caixa fechado com diferença | Fechamento diário com conciliação por forma de pagamento e campo de valor declarado |
| Sem controle de clientes | Cadastro com CPF, histórico de compras e código de convite para auto-registro |
| Vários computadores, uma empresa | Multi-terminal com monitor de PDV em tempo real |
| Sistema diferente para cada segmento | Módulos ativados por tipo de negócio (farmácia, fast food, informática) |

---

## 3. Módulos e Funcionalidades

### 3.1 PDV — Ponto de Venda

O coração do sistema. Interface desenvolvida para ser operada com teclado ou touch.

- Venda rápida com busca de produto por nome, código ou EAN/GTIN
- Carrinho de compras com edição de quantidade e remoção de itens
- **Formas de pagamento:** Dinheiro, Cartão de Crédito (com parcelas), Débito, PIX (copia e cola automático) e Vale Refeição/Voucher
- Desconto por venda (valor absoluto)
- Associação de cliente à venda (CPF na nota, histórico)
- Impressão de cupom térmico (80mm) e cupom digital
- Suporte a múltiplos terminais simultaneamente

### 3.2 Gestão de Produtos e Estoque

- Cadastro completo: nome, código, EAN/GTIN, categoria, descrição, imagem
- Controle de estoque com alerta de estoque mínimo
- Tipos: Unidade ou Caixa
- **Precificação inteligente:**
  - Preço promocional com vigência por datas
  - Promoção "Leve X Pague Y" (ex: Leve 3, Pague 2)
- Upload de imagem do produto (JPEG, PNG, WebP, GIF — até 3 MB)
- Categorias para organização do cardápio/vitrine

### 3.3 Clientes

- Cadastro com validação de CPF (dígito verificador), CEP com busca automática de endereço (ViaCEP) e telefone
- Busca rápida por nome, e-mail ou CPF
- Código de convite para auto-cadastro via PDV (cliente se registra no sistema pelo próprio celular)
- Histórico de compras vinculado ao cliente

### 3.4 Caixa e Financeiro

- **Resumo do dia:** totais por forma de pagamento em tempo real
- **Fechamento de caixa diário:** uma vez por dia, com campo de valor declarado em dinheiro e cálculo automático de diferença/sobra
- **Fluxo de caixa:** registro manual de entradas e saídas além das vendas
- Histórico de fechamentos anteriores

### 3.5 Relatórios

- Relatório diário: total de vendas, quantidade de pedidos, ticket médio, saldo do caixa
- Relatório por período (até 366 dias): evolução de vendas, totais por forma de pagamento, entradas e saídas do fluxo de caixa
- Exportação visual para impressão

### 3.6 Monitor de PDV

- Painel em tempo real para gestores acompanharem o movimento de todos os terminais
- Status de cada caixa: Livre, Em Uso, Bloqueado, Fechado
- Último operador e horário do último heartbeat

### 3.7 Gestão de Usuários e Perfis

| Perfil | Acesso |
|---|---|
| Administrador da Empresa | Configurações, usuários, relatórios, todos os módulos |
| Vendedor | PDV, clientes, fechamento de caixa |
| Totem | Interface de autoatendimento (fast food) |

- Convite por código ou e-mail
- Senha provisória com troca obrigatória no primeiro acesso
- Isolamento total de dados entre empresas (multi-tenant)

### 3.8 Configurações da Empresa

- Identidade visual: logo, cores primária/secundária, fundo, botões (white-label)
- Chave PIX para pagamentos
- Dados fiscais: CNPJ, inscrição municipal
- Contato de suporte personalizado (e-mail e WhatsApp)
- URL de acesso exclusiva da empresa

---

## 4. Módulos Especializados por Segmento

### 4.1 Módulo Fast Food / Restaurante

Ativado para lanchonetes, hamburguerias, pizzarias, restaurantes e açaís.

- Interface **Totem de Autoatendimento** para pedidos sem operador
- Forma de pagamento **Vale Refeição / Voucher** habilitada
- Tipos de estabelecimento: Hamburgueria, Pizzaria, Restaurante, Lanchonete, Açaí/Sorveteria, Outros
- Cardápio digital com imagens dos produtos
- Relatório de vendas por forma de pagamento com totalização de voucher

### 4.2 Módulo Farmácia / Drogaria

Ativado para farmácias, drogarias e similares.

- Controle de **PMC (Preço Máximo ao Consumidor):** alerta ou bloqueio quando o preço excede a tabela vigente
- Controle de **lotes e validade** por produto
- Produtos por tipo de controle: Comum, Antimicrobiano, Controlado
- Campos por produto: Registro MS, PMC, exige receita, exige lote, exige validade
- Rastreabilidade completa de receitas no item da venda: tipo, número, prescritor, data
- Tabela de referências PMC com vigência por período

### 4.3 Módulo Informática / Assistência Técnica

Ativado para assistências técnicas, lojas de informática e similares.

- **Ordens de Serviço** com numeração sequencial automática por empresa
- Fluxo de status: Aberta → Em Análise → Aguardando Aprovação → Concluída → Entregue (com cancelamento disponível em qualquer etapa)
- Campos de equipamento: marca, modelo, número de série, acessórios
- Campos técnicos: defeito relatado, diagnóstico, serviço executado, técnico responsável
- Financeiro da OS: valor de serviço + desconto = total
- Datas automáticas: abertura, conclusão, entrega e previsão de entrega
- Impressão de documento de OS
- Autocomplete inteligente com histórico de clientes, equipamentos e técnicos

---

## 5. Infraestrutura e Segurança

| Item | Detalhes |
|---|---|
| **Hospedagem** | Nuvem (Railway + Vercel) — sem servidor próprio para o cliente |
| **Banco de dados** | MySQL gerenciado, com backups automáticos |
| **Autenticação** | JWT com expiração, isolamento por empresa (multi-tenant) |
| **Acesso** | Navegador moderno (Chrome, Edge, Firefox, Safari) — sem instalação |
| **PWA** | Instalável como app no celular/tablet (Progressive Web App) |
| **HTTPS** | Tráfego 100% criptografado |
| **Isolamento** | Cada empresa acessa apenas os seus próprios dados |
| **Disponibilidade** | SLA 99,9% (infraestrutura Railway) |

---

## 6. Planos e Preços

> Os valores abaixo são referências. Adapte conforme sua estratégia comercial.

### Plano Essencial — R$ [XX]/mês

Ideal para: lojas de varejo, comércios em geral com 1 caixa.

- ✓ PDV completo (1 terminal)
- ✓ Gestão de produtos e estoque
- ✓ Clientes
- ✓ Caixa e fechamento diário
- ✓ Relatórios básicos
- ✓ 2 usuários (1 Admin + 1 Vendedor)
- ✓ Suporte por e-mail

### Plano Profissional — R$ [XX]/mês

Ideal para: comércios com equipe, múltiplos caixas.

Tudo do Essencial, mais:
- ✓ Terminais ilimitados
- ✓ Usuários ilimitados
- ✓ Monitor de PDV em tempo real
- ✓ Relatórios avançados por período
- ✓ Fluxo de caixa manual
- ✓ Suporte via WhatsApp

### Plano Especializado — R$ [XX]/mês

Ideal para: farmácias, restaurantes, assistências técnicas.

Tudo do Profissional, mais:
- ✓ **1 módulo especializado à escolha:** Farmácia, Fast Food ou Informática
- ✓ Configurações de identidade visual (white-label)
- ✓ URL de acesso exclusiva
- ✓ Suporte prioritário

### Plano Completo — R$ [XX]/mês

Ideal para: negócios que precisam de todos os recursos.

- ✓ **Todos os módulos ativados**
- ✓ Todos os recursos dos planos anteriores
- ✓ Totem de autoatendimento
- ✓ Onboarding assistido
- ✓ Suporte dedicado

---

### Tabela Comparativa de Planos

| Recurso | Essencial | Profissional | Especializado | Completo |
|---|:---:|:---:|:---:|:---:|
| PDV | ✓ | ✓ | ✓ | ✓ |
| Estoque e produtos | ✓ | ✓ | ✓ | ✓ |
| Clientes | ✓ | ✓ | ✓ | ✓ |
| Fechamento de caixa | ✓ | ✓ | ✓ | ✓ |
| Terminais ilimitados | — | ✓ | ✓ | ✓ |
| Monitor de PDV | — | ✓ | ✓ | ✓ |
| Relatórios por período | — | ✓ | ✓ | ✓ |
| Módulo Farmácia | — | — | ✓ | ✓ |
| Módulo Fast Food | — | — | ✓ | ✓ |
| Módulo Informática (OS) | — | — | ✓ | ✓ |
| Totem de autoatendimento | — | — | — | ✓ |
| White-label / URL exclusiva | — | — | ✓ | ✓ |
| Usuários | 2 | Ilimitado | Ilimitado | Ilimitado |

---

## 7. Condições Comerciais

### Implantação

| Item | Valor |
|---|---|
| Taxa de implantação (cadastro inicial, configuração e treinamento) | R$ [XXX] |
| Migração de dados de sistema anterior | R$ [XXX] |
| Treinamento presencial (por sessão) | R$ [XXX] |

> A taxa de implantação pode ser **isenta** em contratos anuais.

### Forma de Pagamento

- **Mensalidade:** Boleto, PIX ou cartão de crédito (até 12×)
- **Anual:** Desconto de [15]% no valor total (pagamento à vista)
- **Sem fidelidade mínima** nos planos mensais

### Política de Cancelamento

- Cancelamento a qualquer momento, sem multa
- Dados exportáveis em até 30 dias após o cancelamento
- Sem cobrança de taxa de saída

---

## 8. Cronograma de Implantação

| Etapa | Prazo | Descrição |
|---|---|---|
| Onboarding | Dia 1 | Criação da conta, configuração da empresa, logo e cores |
| Cadastro de produtos | Dias 1–3 | Import via CSV ou cadastro manual assistido |
| Configuração de usuários | Dia 2 | Criação de perfis e convites para a equipe |
| Treinamento operacional | Dia 3 | PDV, fechamento de caixa, relatórios |
| Treinamento gerencial | Dia 4 | Parâmetros, módulos especializados, monitor |
| Go-live | Dia 5 | Sistema em produção com suporte intensivo por 7 dias |

---

## 9. Diferenciais Competitivos

**Por que escolher a Veltrix?**

1. **Sem instalação.** Funciona no navegador de qualquer computador, tablet ou celular. Nada para instalar ou atualizar.

2. **White-label nativo.** Sua empresa com sua logo, suas cores e sua URL — o cliente vê a sua marca.

3. **Módulos sob demanda.** Pague apenas pelo que você usa. Ative farmácia, fast food ou informática conforme crescer.

4. **Multiempresa.** Um único contrato para gerenciar filiais ou clientes diferentes (para revendedores).

5. **PDV sem complexidade.** Interface pensada para o operador de caixa, não para o técnico de TI. Treinamento em horas.

6. **Totem de autoatendimento.** Reduza filas sem contratar mais pessoas.

7. **Dados 100% seus.** Exportação disponível a qualquer momento. Sem aprisionamento de dados.

8. **Preço justo.** Tecnologia de qualidade enterprise acessível para o pequeno negócio.

---

## 10. Cases de Uso por Segmento

### Varejo Geral
> Loja de roupas, calçados, pet shop, papelaria, distribuidora

Cadastre produtos com preços promocionais sazonais, gerencie estoque em tempo real, atenda múltiplos caixas simultaneamente e feche o dia com um clique.

### Farmácia / Drogaria
> Drogaria, farmácia de manipulação, distribuidora de medicamentos

Controle preços máximos ao consumidor, registre receitas controladas diretamente na venda, rastreie lotes e validades e mantenha histórico de clientes com CPF.

### Fast Food / Restaurante
> Hamburgueria, pizzaria, restaurante por quilo, lanchonete, açaí

Permita que clientes façam pedidos no totem de autoatendimento, aceite vale refeição (Alelo, Sodexo, VR, etc.) e controle o movimento do dia por tipo de pagamento.

### Informática / Assistência Técnica
> Assistência técnica de celular, notebook, eletrônicos; revenda de equipamentos

Abra e gerencie ordens de serviço com fluxo de aprovação, registre diagnóstico e serviço executado, imprima o documento da OS para o cliente e vincule o serviço a uma venda de peças.

---

## 11. Garantia e Suporte

- **Período de teste gratuito:** [15] dias sem cobrança, sem cartão de crédito
- **SLA de atendimento:** até [4h] em dias úteis para planos Essencial e Profissional; até [2h] para Especializado e Completo
- **Canais de suporte:** E-mail, WhatsApp e base de conhecimento online
- **Atualizações:** inclusas em todos os planos, sem custo adicional

---

## 12. Próximos Passos

Para contratar ou tirar dúvidas:

1. **Responda a este e-mail** confirmando o plano de interesse
2. **Agende uma demonstração ao vivo** — [link do calendário ou contato]
3. Enviaremos o contrato digital para assinatura em até [1 dia útil]
4. Após a assinatura, a conta é criada em até [2 horas]

---

## 13. Aceite da Proposta

Ao assinar abaixo, o contratante declara ter lido, compreendido e aceito os termos desta proposta comercial.

|  |  |
|---|---|
| **Empresa contratante** | [Nome da Empresa] |
| **Responsável legal** | [Nome] |
| **CPF/CNPJ** | [Documento] |
| **Plano contratado** | [Essencial / Profissional / Especializado / Completo] |
| **Valor mensal** | R$ [XXX,XX] |
| **Vigência** | A partir de [DD/MM/AAAA] |

**Assinatura:** ___________________________________
**Data:** _____ / _____ / _______

---

**Veltrix — Gestão simples para negócios reais.**

[site] · [email@veltrix.com.br] · [WhatsApp: (XX) XXXXX-XXXX]

---

*Este documento é confidencial e destinado exclusivamente ao destinatário indicado.*
*Proposta gerada em [DD/MM/AAAA]. Válida por 30 dias.*
