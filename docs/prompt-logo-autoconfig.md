## Demanda: Configuração Rápida por Logo — Parâmetros da Empresa

### Contexto
No sistema Veltrix (Spring Boot + Next.js), a tela de parâmetros (`/parametros/page.tsx`)
permite configurar identidade visual e dados da empresa. O objetivo é adicionar uma seção
"Configuração Rápida por Logo" que, a partir do upload de um logo, preenche automaticamente
os campos de identidade visual e tenta extrair o nome da empresa via OCR.

---

### Stack
- Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS
- Backend: Spring Boot (Java)
- Sem dependências externas de IA — todo processamento roda no browser

---

### O que implementar

#### 1. Nova seção no topo de `/parametros/page.tsx`

Adicionar antes da seção `Identidade` uma seção colapsável "Configuração Rápida por Logo"
com fluxo de 3 passos:

**Passo 1 — Upload**
- Drop zone com `<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" />`
- Drag & drop funcional
- Limite: 10 MB
- Aviso de privacidade: processamento 100% local, sem envio externo

**Passo 2 — Análise (loading)**
- Progress bar + log de status em tempo real
- Dois processos paralelos:
  - Extração de cores via Canvas API (k-means)
  - OCR via `tesseract.js` (pacote npm `tesseract.js@^5`)

**Passo 3 — Revisão das sugestões**
- Lista de sugestões editáveis antes de aplicar
- Cada sugestão tem botão "Aceito / Ignorar"
- Campo CNPJ com botão "Buscar" (chama endpoint existente da Receita Federal)
- Botão "Aplicar sugestões" que preenche os campos do formulário principal

---

#### 2. Extração de cores — algoritmo k-means (rodar no browser)

```ts
// Implementar em: src/lib/colorExtractor.ts

export interface ExtractedPalette {
  primary: string      // hex — cor mais vívida/dominante
  secondary: string    // hex — segunda cor vívida, visualmente distinta da primária
  bg: string           // hex — cluster mais claro
  text: string         // hex — cluster mais escuro
  button: string       // hex — igual à primária
  buttonText: string   // hex — '#ffffff' ou '#111827' por contraste WCAG
}

export async function extractPaletteFromImage(dataUrl: string): Promise<ExtractedPalette>
```

Algoritmo:
1. Desenhar imagem em canvas 200×200
2. Coletar pixels com alpha > 100 (amostragem a cada 3 pixels)
3. K-means com k=8 e 12 iterações — centroide = média real dos pixels do cluster
4. Classificar clusters:
   - `primary`: cluster vívido mais frequente (saturação > 0.15, luminância 4–96%)
   - `secondary`: cluster vívido com distância euclidiana > 40 da primária
   - `bg`: cluster de maior luminância
   - `text`: cluster de menor luminância
   - `button`: igual a `primary`
   - `buttonText`: branco se luminância do botão < 0.5, senão `#111827`

---

#### 3. OCR para nome da empresa

```ts
// Implementar em: src/lib/logoOcr.ts
import { createWorker } from 'tesseract.js'

export async function extractTextFromLogo(
  dataUrl: string,
  onProgress: (msg: string, pct: number) => void
): Promise<string>
```

- Idiomas: `eng+por`
- Pós-processamento: pegar a primeira linha com > 50% de caracteres alfabéticos
- Limitar resultado a 80 caracteres
- Se nenhum texto detectado, retornar string vazia (campo fica em branco para preenchimento manual)

---

#### 4. Mapeamento das sugestões para o formulário

Ao clicar em "Aplicar sugestões", preencher via `setForm(prev => ({ ...prev, ... }))`:

| Sugestão            | Campo do formulário         |
|---------------------|-----------------------------|
| Nome detectado      | `nomeEmpresa`               |
| `primary`           | `corPrimaria`               |
| `secondary`         | `corSecundaria`             |
| `bg`                | `corFundo`                  |
| `text`              | `corTexto`                  |
| `button`            | `corBotao`                  |
| `buttonText`        | `corBotaoTexto`             |
| Nome detectado      | `mensagemBoasVindas` (prefill: `"Bem-vindo à {nome}!"`) |

---

#### 5. UX / Visual

- Seção com borda `border-blue-200 bg-blue-50/40` e badge roxo "IA" ao lado do título
- Step indicators (dots 1→2→3) com animação de transição
- Campos preenchidos automaticamente devem ter borda `border-green-300` e hint
  `"Preenchido automaticamente pelo logo"` em verde abaixo
- Badge `"✓ Cores extraídas do logo"` aparece no header da seção Aparência após aplicar
- A seção colapsa automaticamente após aplicar (ou mantém aberta com botão "Novo upload")

---

#### 6. Arquivos a modificar / criar

| Arquivo                                      | Ação        |
|----------------------------------------------|-------------|
| `src/lib/colorExtractor.ts`                  | Criar       |
| `src/lib/logoOcr.ts`                         | Criar       |
| `src/app/parametros/page.tsx`                | Modificar   |
| `package.json` (frontend)                    | Adicionar `tesseract.js@^5` |

---

#### 7. Restrições importantes

- **Nenhum dado** (imagem, pixel, texto) deve ser enviado ao backend nessa etapa
- O campo `logoUrl` continua sendo uma URL — o upload do arquivo para storage (se for o caso) é um fluxo separado já existente
- Toda a análise deve ser assíncrona e não bloquear a UI
- O usuário pode editar qualquer sugestão antes de aplicar — nunca sobrescrever sem confirmação
- Manter compatibilidade total com o formulário existente: `applyAll` apenas chama `setForm`, o usuário ainda precisa clicar em "Salvar parâmetros" para persistir

---

### Referência visual
Protótipo funcional disponível em: `docs/prototipo-logo-autoconfig.html`
Abrir no navegador para ver o fluxo completo interativo com upload real e extração de cores.
