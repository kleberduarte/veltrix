# Guia de Implantação de NFC-e — Sistema Veltrix

**Data:** Abril de 2026  
**Versão do sistema:** Veltrix (Spring Boot 3.2 + Next.js 14)

---

## 1. Pré-requisitos Legais e Fiscais

Antes de qualquer desenvolvimento, os seguintes itens precisam estar resolvidos junto à empresa e à SEFAZ:

- **Credenciamento na SEFAZ estadual** para emissão de NFC-e (Nota Fiscal de Consumidor Eletrônica, modelo 65)
- **Certificado Digital A1** — arquivo `.pfx` emitido por uma AC credenciada (ex: Serasa, Certisign, Soluti)
- **CSC (Código de Segurança do Contribuinte)** — obtido no portal da SEFAZ do estado, necessário para geração do QR Code
- **Definição do ambiente:** homologação (testes) ou produção
- **Série da NFC-e** — geralmente série 001; confirmar com contador

> Cada empresa (tenant) no Veltrix terá seu próprio certificado e CSC. Esses dados devem ser armazenados de forma segura, por company_id.

---

## 2. Biblioteca Java Recomendada

A biblioteca mais madura e mantida para emissão de DF-e (NF-e / NFC-e) em Java é o projeto open source:

**Java_NFe — Samuel Oliveira**  
Repositório: https://github.com/Samuel-Oliveira/Java_NFe

### Adicionando ao `pom.xml`

```xml
<dependency>
    <groupId>com.github.samuel-oliveira</groupId>
    <artifactId>Java_NFe</artifactId>
    <version>1.0.7</version> <!-- verificar versão mais recente no repositório -->
</dependency>
```

> Alternativa: **NFe4j** (https://github.com/nfe4j/nfe4j) — menos ativa, porém funcional.

---

## 3. Estrutura a Criar no Backend (`com.veltrix`)

### 3.1 Migração Flyway — `V29__nfce.sql`

```sql
CREATE TABLE nfce_documentos (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id     BIGINT NOT NULL,
    order_id       BIGINT NOT NULL,
    numero         INT NOT NULL,
    serie          VARCHAR(3) NOT NULL DEFAULT '001',
    chave_acesso   VARCHAR(44),
    status         VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
    xml_enviado    LONGTEXT,
    xml_retorno    LONGTEXT,
    protocolo      VARCHAR(50),
    ambiente       VARCHAR(1) NOT NULL DEFAULT '2', -- 1=Producao, 2=Homologacao
    criado_em      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em  DATETIME ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_nfce_company  FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_nfce_order    FOREIGN KEY (order_id)   REFERENCES orders(id)
);

-- Contador de numeração por empresa/série
CREATE TABLE nfce_numeracao (
    company_id   BIGINT NOT NULL,
    serie        VARCHAR(3) NOT NULL DEFAULT '001',
    ultimo_numero INT NOT NULL DEFAULT 0,
    PRIMARY KEY (company_id, serie)
);
```

---

### 3.2 Entidade — `model/NfceDocumento.java`

```java
@Entity
@Table(name = "nfce_documentos")
public class NfceDocumento {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    private Integer numero;
    private String serie;
    private String chaveAcesso;

    @Enumerated(EnumType.STRING)
    private StatusNfce status;

    @Column(columnDefinition = "LONGTEXT")
    private String xmlEnviado;

    @Column(columnDefinition = "LONGTEXT")
    private String xmlRetorno;

    private String protocolo;
    private String ambiente;

    private LocalDateTime criadoEm;
    private LocalDateTime atualizadoEm;
}
```

---

### 3.3 Enum — `model/enums/StatusNfce.java`

```java
public enum StatusNfce {
    PENDENTE,
    AUTORIZADA,
    REJEITADA,
    CANCELADA,
    CONTINGENCIA
}
```

---

### 3.4 Service — `service/NfceService.java` (estrutura)

```java
@Service
@RequiredArgsConstructor
public class NfceService {

    private final NfceDocumentoRepository nfceRepository;
    private final OrderRepository orderRepository;
    private final ParametroEmpresaRepository parametroRepository;

    public NfceResponse emitir(Long orderId) {
        Long companyId = TenantContext.getCompanyId();
        Order order = orderRepository.findById(orderId).orElseThrow();

        // 1. Buscar parâmetros da empresa (certificado, CSC, ambiente)
        ParametroEmpresa params = parametroRepository.findByCompanyId(companyId).orElseThrow();

        // 2. Montar objeto NFC-e com dados do pedido
        NFe nfe = montarNfce(order, params);

        // 3. Assinar XML com certificado .pfx
        // 4. Transmitir ao WebService da SEFAZ
        // 5. Processar retorno e salvar no banco
        // 6. Retornar chave de acesso e status
    }

    public void cancelar(Long nfceId, String motivo) {
        // Emitir evento de cancelamento à SEFAZ
    }

    public byte[] gerarDanfe(Long nfceId) {
        // Gerar PDF do DANFE com QR Code
    }

    private NFe montarNfce(Order order, ParametroEmpresa params) {
        // Construir XML conforme layout NFC-e 4.00
        // Layout: https://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=ONdfJqlFCQo=
    }
}
```

---

### 3.5 Controller — `controller/NfceController.java`

```java
@RestController
@RequestMapping("/nfce")
@RequiredArgsConstructor
public class NfceController {

    private final NfceService nfceService;

    @PostMapping("/emitir/{orderId}")
    public ResponseEntity<NfceResponse> emitir(@PathVariable Long orderId) {
        return ResponseEntity.ok(nfceService.emitir(orderId));
    }

    @GetMapping("/{id}/danfe")
    public ResponseEntity<byte[]> danfe(@PathVariable Long id) {
        byte[] pdf = nfceService.gerarDanfe(id);
        return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .body(pdf);
    }

    @PostMapping("/{id}/cancelar")
    public ResponseEntity<Void> cancelar(@PathVariable Long id,
                                         @RequestParam String motivo) {
        nfceService.cancelar(id, motivo);
        return ResponseEntity.ok().build();
    }
}
```

---

### 3.6 Configurações por Empresa (`ParametroEmpresa`)

Adicionar os seguintes campos (ou tabela separada `nfce_config`):

| Campo | Tipo | Descrição |
|---|---|---|
| `nfce_csc` | VARCHAR | Código de Segurança do Contribuinte |
| `nfce_csc_id` | VARCHAR | ID do CSC |
| `nfce_ambiente` | CHAR(1) | `1` = Produção, `2` = Homologação |
| `nfce_serie` | VARCHAR(3) | Série da nota (ex: 001) |
| `certificado_pfx` | LONGBLOB | Bytes do certificado A1 |
| `certificado_senha` | VARCHAR | Senha do certificado (criptografada) |
| `uf_codigo` | VARCHAR(2) | Código IBGE do estado (ex: 35 = SP) |

> A senha do certificado deve ser armazenada **criptografada** (ex: AES-256 com chave de ambiente).

---

## 4. Estrutura a Criar no Frontend (`/frontend/src`)

### 4.1 Botão no PDV

Após fechar a venda (`POST /orders`), exibir botão **"Emitir NFC-e"** que chama `POST /nfce/emitir/{orderId}`.

```tsx
// Em components/pdv/BotoesVenda.tsx
<button onClick={() => emitirNfce(order.id)}>
  Emitir NFC-e
</button>
```

### 4.2 Modal de resultado

Após emissão bem-sucedida, exibir:
- Chave de acesso
- Botão para abrir/imprimir o DANFE (`GET /nfce/{id}/danfe`)
- Botão para enviar por email (opcional)

---

## 5. Fluxo Técnico Completo

```
[PDV - Frontend]
  → Usuário finaliza venda
  → Clique em "Emitir NFC-e"
  → POST /nfce/emitir/{orderId}

[Backend - NfceService]
  → Busca Order + itens + cliente
  → Busca ParametroEmpresa (CSC, certificado, UF)
  → Monta XML conforme layout NFC-e 4.00
  → Assina XML com certificado .pfx (Java Security / Bouncy Castle)
  → Envia ao WebService SEFAZ do estado (HTTPS mútuo)
  → Recebe retorno (cStat 100 = Autorizado)
  → Salva XML assinado + protocolo no banco
  → Retorna chave de acesso ao frontend

[Frontend]
  → Exibe QR Code / chave de acesso
  → Abre DANFE em nova aba (PDF)
```

---

## 6. Endpoints SEFAZ por Ambiente

| UF | Homologação (NFC-e) | Produção (NFC-e) |
|---|---|---|
| SP | https://homologacao.nfce.fazenda.sp.gov.br/ws/... | https://nfce.fazenda.sp.gov.br/ws/... |
| MG | https://hnfce.fazenda.mg.gov.br/... | https://nfce.fazenda.mg.gov.br/... |
| RS | https://nfce-homologacao.sefazrs.rs.gov.br/... | https://nfce.sefazrs.rs.gov.br/... |
| RJ | https://nfce.fazenda.rj.gov.br/... | — |

> Consultar lista completa de WebServices: https://www.nfe.fazenda.gov.br/portal/webServices.aspx

---

## 7. Estimativa de Esforço

| Tarefa | Esforço estimado |
|---|---|
| Configuração biblioteca + certificado | 2–3 dias |
| Migração Flyway + entidades | 1 dia |
| NfceService (montar XML + transmitir) | 3–5 dias |
| Tratamento de rejeições e erros SEFAZ | 1–2 dias |
| Contingência offline (NFC-e em contingência) | 2 dias |
| DANFE em PDF com QR Code | 1–2 dias |
| Frontend (botão PDV + modal resultado) | 1 dia |
| Testes em homologação | 2–3 dias |
| **Total estimado** | **~13–19 dias úteis** |

---

## 8. Referências

- Layout XML NFC-e 4.00: https://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=ONdfJqlFCQo=
- Biblioteca Java_NFe: https://github.com/Samuel-Oliveira/Java_NFe
- Portal NF-e Nacional: https://www.nfe.fazenda.gov.br
- Nota Técnica 2021.001 (QR Code NFC-e): disponível no portal acima

---

*Documento gerado em abril de 2026 para o sistema Veltrix.*
