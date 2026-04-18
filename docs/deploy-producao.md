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

**Obrigatório:** na Vercel, o app Next.js **não está na raiz do Git**. O build precisa rodar **dentro de `frontend/`**.

1. Vercel → projeto → **Settings → General**:
   - **Root Directory** → `frontend` → **Save** (não deixe vazio).
   - **Framework Preset** → **Next.js** (ou detecção automática a partir da pasta).
   - **Output Directory** → deixe **vazio** (padrão do Next na Vercel). Se estiver `public`, apague — isso causa o erro *“No Output Directory named public found”* após um `next build` bem-sucedido.
2. **Redeploy** (Deployments → ⋮ → Redeploy).

**Por quê:** `buildCommand` na raiz (`cd frontend && npm run build`) até compila o Next, mas a etapa de deploy da Vercel não associa o output a `.next` como em um projeto Next nativo; o preset na raiz vira “site estático” e ela procura `public/`. Com **Root Directory = `frontend`**, a Vercel usa o pipeline correto do Next.

O `package.json` na raiz do repo é só conveniência local (`npm run build` delegando ao `frontend`); **o deploy na Vercel deve usar Root Directory = `frontend`**.

Se aparecer **`404 NOT_FOUND`** no `/`, confira Root Directory, deploy **Ready** e logs de build.

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
