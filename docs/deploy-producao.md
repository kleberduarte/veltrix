# Deploy em produção — Railway (API + MySQL) e Vercel (frontend)

## Visão

| Camada    | Onde        | Papel |
|-----------|-------------|--------|
| Frontend  | Vercel      | Next.js; variável `NEXT_PUBLIC_API_URL` aponta para a API pública. |
| API       | Railway     | Spring Boot (Dockerfile em `backend/`). |
| Banco     | Railway     | Plugin MySQL; variáveis referenciadas pelo backend. |

O browser chama a API **diretamente** (CORS). Não é necessário proxy da API pelo Vercel, desde que o backend permita a origem do frontend.

---

## 1. Railway — MySQL

1. Crie ou use o plugin **MySQL** no mesmo projeto Railway.
2. Na aba **Variables** do MySQL, confira `MYSQLHOST`, `MYSQLPORT`, `MYSQLDATABASE`, `MYSQLUSER`, `MYSQL_ROOT_PASSWORD` (ou equivalentes expostos pelo template).

---

## 2. Railway — Backend (Java)

1. **Root directory / contexto de build**: configure o serviço para usar a pasta **`backend`** (ou o repositório com `Dockerfile` em `backend/Dockerfile`, conforme o `railway.json`).
2. **Variáveis** (serviço do backend → Variables). Use **Reference** para ligar ao MySQL quando possível.

   | Variável | Obrigatório | Notas |
   |----------|-------------|--------|
   | `DB_URL` | Sim | `jdbc:mysql://${MYSQLHOST}:${MYSQLPORT}/${MYSQLDATABASE}?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=America/Sao_Paulo` (ajuste se o plugin usar outros nomes). |
   | `DB_USER` | Sim | Ex.: `root` ou o usuário do plugin. |
   | `MYSQL_ROOT_PASSWORD` ou `DB_PASSWORD` | Sim | Senha com texto puro; **não** use `${MYSQLPASSWORD}` aninhado (comportamento estranho no Railway). |
   | `JWT_SECRET` | Sim | Mínimo 32 caracteres; ex.: `openssl rand -base64 48`. |
   | `CORS_ALLOWED_ORIGINS` | Sim | URL(s) do frontend Vercel, **sem barra final**. Várias origens: separadas por vírgula. Inclua domínio de produção e, se usar, `www`. |
   | `JPA_DDL_AUTO` | Recomendado | `validate` (Flyway aplica o schema). |
   | `PORT` | Não | Railway injeta automaticamente; o Spring usa `server.port=${PORT}`. |

   O **Dockerfile** define `SPRING_PROFILES_ACTIVE=prod` (carrega `application-prod.properties`). Você pode sobrescrever no painel se precisar.

3. **Domínio público**: em **Settings → Networking → Public Networking**, gere um domínio `*.up.railway.app` ou ligue um domínio próprio. Essa URL base é a da API (ex.: `https://veltrix-api.up.railway.app`).

4. **Healthcheck**: já configurado em `backend/railway.json` para `GET /actuator/health/liveness`.

5. **Primeiro deploy**: após o backend subir, o Flyway roda as migrações. Se existir migração falha no histórico, siga o fluxo de `flyway:repair` descrito em `backend/.env.railway.example`.

6. **Bootstrap admin global** (opcional): `GLOBAL_ADMIN_BOOTSTRAP_ENABLED`, `GLOBAL_ADMIN_EMAIL`, `GLOBAL_ADMIN_PASSWORD` — desligue o bootstrap após o primeiro acesso em produção.

---

## 3. Vercel — Frontend

### 3.1 Repositório monorepo (`backend/` + `frontend/`)

O app Next.js está em **`frontend/`**, não na raiz do Git.

### Configuração recomendada (evita erros de deploy)

1. Vercel → **Settings → General**:
   - **Root Directory** → `frontend` → **Save**.
   - **Output Directory** → **vazio** (se estiver `public`, apague).
2. **Redeploy**.

Com isso, a Vercel faz `npm install` e `npm run build` **dentro de `frontend/`** e usa o pipeline nativo do Next.

### Se deixar Root Directory vazio (raiz do repo)

O repositório inclui `vercel.json` na raiz com `framework: nextjs`, `installCommand` e `buildCommand` em `frontend/`, e o `package.json` da raiz roda `cd frontend && npm install && npm run build` para existir `node_modules` com o `next`.

Se aparecer **`next: command not found`**, a Vercel rodou `npm install` só na raiz — use **Root Directory = `frontend`** ou garanta o último commit com esse `package.json` / `vercel.json`.

### Erros conhecidos

- *“No Output Directory named public”* após build OK: geralmente **Output Directory** preenchido com `public` ou preset errado; deixe vazio e prefira **Root Directory = `frontend`**.
- **`404 NOT_FOUND`** no `/` ou no domínio Vercel: confira Root Directory, deploy **Ready** e logs de build.

### 3.2 Variáveis e build

1. **Environment Variables** (Production / Preview conforme necessário):

   | Variável | Valor |
   |----------|--------|
   | `NEXT_PUBLIC_API_URL` | URL pública do backend Railway, **sem barra final** (ex.: `https://seu-servico.up.railway.app`). |

2. **Redeploy** após alterar variáveis (elas são embutidas no build do Next).

3. **Deploys de preview** (branches/PR): cada URL `*.vercel.app` é uma origem diferente. O Spring **não** aceita curinga de subdomínio em CORS com `credentials`. Opções:
   - adicionar temporariamente a URL do preview em `CORS_ALLOWED_ORIGINS` no Railway, ou
   - testar só contra o deploy de **Production** com o domínio fixo.

### 3.3 Erro no browser (não é o app)

Mensagem do tipo *“A listener indicated an asynchronous response…”* costuma ser **extensão do Chrome**. Teste em aba anônima ou outro navegador.

---

## 4. Checklist rápido

- [ ] API responde: `GET https://<sua-api>/actuator/health`
- [ ] `CORS_ALLOWED_ORIGINS` inclui exatamente a origem do Vercel (protocolo + host, sem path)
- [ ] `NEXT_PUBLIC_API_URL` no Vercel = mesma base da API usada no browser
- [ ] `JWT_SECRET` forte e exclusivo de produção
- [ ] Bootstrap de admin desabilitado após uso (`GLOBAL_ADMIN_BOOTSTRAP_ENABLED=false`)

---

## Referência de variáveis

Exemplo comentado: `backend/.env.railway.example`.
