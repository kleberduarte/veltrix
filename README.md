# Veltrix — ERP & PDV SaaS

Sistema web de gestão para restaurantes, delivery e pequenos comércios (retaguarda + PDV), alinhado aos fluxos do legado **sistema-cadastro**.

## Stack

- **Backend**: Java 17 + Spring Boot 3 + Spring Security + JWT
- **Banco**: MySQL 8
- **Frontend**: Next.js 14 + React 18 + Tailwind CSS

## Branches

- **`main`**: linha estável.
- **`develop`**: integração do dia a dia; mudanças seguem para `main` via pull request.

## Deploy produção (Railway + Vercel)

Backend e MySQL no **Railway** (Docker em `backend/Dockerfile`), frontend no **Vercel**. No painel da Vercel, defina **Root Directory** = `frontend` e **Output Directory** vazio (veja `docs/deploy-producao.md` se aparecer erro de `public`). Checklist, variáveis e CORS: [**docs/deploy-producao.md**](docs/deploy-producao.md). Env Railway: `backend/.env.railway.example`.

---

## Pré-requisitos

- Java 17+
- Maven 3.8+
- Node.js 18+
- MySQL 8 (porta 3306)

---

## Configuração

### Banco de dados

Edite `backend/src/main/resources/application.properties`:

- `spring.datasource.username` / `spring.datasource.password`
- **Flyway** roda antes do Hibernate e aplica `db/migration` (inclui correção de `users.role` legado `USER` → `ADMIN_EMPRESA`). Em seguida o **Hibernate** ajusta o schema (`spring.jpa.hibernate.ddl-auto=update`).

### Usuário administrador (desenvolvimento)

Na primeira subida do backend, se o e-mail ainda não existir, é criada uma empresa **Veltrix** e o admin:

| Campo | Valor padrão |
|--------|----------------|
| E-mail | `admin@veltrix.local` |
| Senha | `admin123` |

Definidos em `backend/src/main/resources/application.properties` (`veltrix.admin.*`). Em produção, **troque a senha** e considere `veltrix.admin.bootstrap.enabled=false` depois do primeiro deploy.

### Frontend

Copie `frontend/.env.example` para `frontend/.env.local` e ajuste:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## Como rodar

### Backend

```bash
cd backend
mvn spring-boot:run
```

API: `http://localhost:8080`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:3000`

### Porta 8080 em uso

Se o backend não subir com *Port 8080 was already in use*, encerre o processo anterior ou altere em `application.properties`:

```properties
server.port=8081
```

No PowerShell: `Get-NetTCPConnection -LocalPort 8080` e `Stop-Process -Id <PID> -Force` (ou Gerenciador de Tarefas).

---

## Segurança da API

- Rotas **públicas**: apenas `POST /auth/register` e `POST /auth/login`.
- Todas as demais rotas (incluindo `GET /auth/me`, `POST /auth/trocar-senha`, `GET/POST /auth/users`, etc.) exigem **Bearer JWT** no header `Authorization`.

---

## Endpoints principais

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /auth/register | Criar empresa + usuário admin |
| POST | /auth/login | Login, retorna JWT |
| GET | /auth/me | Usuário atual (JWT) |
| POST | /auth/trocar-senha | Trocar senha |
| GET | /auth/users | Listar usuários da empresa |
| POST | /auth/users | Criar usuário |
| DELETE | /auth/users/{id} | Remover usuário |
| GET | /products | Produtos |
| GET | /orders | Pedidos (opcional `?from=&to=` datas ISO) |
| POST | /orders | Finalizar venda (PDV) |
| GET | /reports/daily | Resumo do dia |
| GET | /reports/period | Resumo entre `from` e `to` |
| GET | /cash | Lançamentos de caixa |
| GET | /clientes | Clientes |
| GET | /parametros-empresa | Parâmetros da empresa |
| GET | /pdv-terminais | Terminais PDV |
| POST | /pdv-terminais/{id}/heartbeat | Heartbeat do terminal |
| GET | /fechamentos-caixa/resumo-hoje | Resumo para fechamento |
| POST | /fechamentos-caixa/fechar | Fechar caixa do dia |
| GET | /ordens-servico | Ordens de serviço |
| GET | /produto-lotes/produto/{id} | Lotes do produto |

---

## Frontend — telas

- Dashboard, PDV (pagamento, cliente, terminal, lotes farmácia, F7 últimas vendas), produtos + lotes, caixa + fechamento, relatórios (dia + período + CSV), clientes, OS, terminais, monitor PDV, parâmetros, usuários, suporte, primeiro acesso (troca de senha obrigatória), redirect `/vendas` → `/pdv`.

---

## Exemplo: login e venda

### Login

```json
POST /auth/login
{ "email": "joao@restaurante.com", "password": "123456" }
```

### Criar pedido (PDV)

```json
POST /orders
Authorization: Bearer <token>
{
  "items": [{ "productId": 1, "quantity": 2 }],
  "formaPagamento": "PIX",
  "desconto": 0,
  "clienteId": 1
}
```
