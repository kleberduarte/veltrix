'use client'
import { useEffect, useRef, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { productService, ProductPayload } from '@/services/productService'
import { produtoLoteService, ProdutoLotePayload } from '@/services/produtoLoteService'
import { parametrosEmpresaService } from '@/services/parametrosEmpresaService'
import { Product, ProdutoLote, ParametroEmpresa, TipoControle } from '@/types'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import { appConfirm } from '@/lib/dialogs'

function fmt(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

type FormState = {
  name: string
  codigoProduto: string
  gtinEan: string
  descricao: string
  categoria: string
  price: string
  estoqueMinimo: string
  stock: string
  tipoControle: TipoControle
  exigeReceita: boolean
  exigeLote: boolean
  exigeValidade: boolean
  registroMs: string
  pmc: string
}

type ImportProgress = {
  total: number
  processed: number
  success: number
  failed: number
  currentName: string
}

type CsvRow = Record<string, string>

const emptyForm: FormState = {
  name: '',
  codigoProduto: '',
  gtinEan: '',
  descricao: '',
  categoria: '',
  price: '',
  estoqueMinimo: '0',
  stock: '',
  tipoControle: 'COMUM',
  exigeReceita: false,
  exigeLote: false,
  exigeValidade: false,
  registroMs: '',
  pmc: '',
}

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [parametro, setParametro] = useState<ParametroEmpresa | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [editing, setEditing] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [importRows, setImportRows] = useState<ProductPayload[]>([])
  const [importFileName, setImportFileName] = useState('')
  const [importError, setImportError] = useState('')
  const [importRunning, setImportRunning] = useState(false)
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const barcodeBufferRef = useRef('')
  const barcodeLastKeyTimeRef = useRef(0)

  const [loteProduct, setLoteProduct] = useState<Product | null>(null)
  const [lotes, setLotes] = useState<ProdutoLote[]>([])
  const [loteLoading, setLoteLoading] = useState(false)
  const [loteForm, setLoteForm] = useState<ProdutoLotePayload>({ productId: 0, codigoLote: '', quantidadeAtual: 0, validade: undefined })
  const [loteEditing, setLoteEditing] = useState<ProdutoLote | null>(null)
  const [loteSaving, setLoteSaving] = useState(false)
  const [loteError, setLoteError] = useState('')

  const isFarmacia = !!parametro?.moduloFarmaciaAtivo

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return }
    loadAll()
  }, [router])

  async function loadAll() {
    setLoading(true)
    try {
      const [prods, params] = await Promise.all([
        productService.getAll(),
        parametrosEmpresaService.get(),
      ])
      setProducts(prods)
      setParametro(params)
    } finally {
      setLoading(false)
    }
  }

  async function load() {
    try { setProducts(await productService.getAll()) } catch {}
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setError('')
    setShowModal(true)
  }

  function openEdit(p: Product) {
    setEditing(p)
    setForm({
      name: p.name,
      codigoProduto: p.codigoProduto ?? '',
      gtinEan: p.gtinEan ?? '',
      descricao: p.descricao ?? '',
      categoria: p.categoria ?? '',
      price: String(p.price),
      estoqueMinimo: String(p.estoqueMinimo ?? 0),
      stock: String(p.stock),
      tipoControle: p.tipoControle ?? 'COMUM',
      exigeReceita: p.exigeReceita ?? false,
      exigeLote: p.exigeLote ?? false,
      exigeValidade: p.exigeValidade ?? false,
      registroMs: p.registroMs ?? '',
      pmc: p.pmc != null ? String(p.pmc) : '',
    })
    setError('')
    setShowModal(true)
  }

  async function handleDelete(p: Product) {
    if (!(await appConfirm(`Remover "${p.name}"?`, 'Excluir produto'))) return
    await productService.remove(p.id)
    await load()
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload: ProductPayload = {
        name: form.name,
        price: Number(form.price),
        stock: Number(form.stock),
        codigoProduto: form.codigoProduto || undefined,
        gtinEan: form.gtinEan || undefined,
        descricao: form.descricao || undefined,
        categoria: form.categoria || undefined,
        estoqueMinimo: Number(form.estoqueMinimo) || 0,
        ...(isFarmacia && {
          tipoControle: form.tipoControle,
          exigeReceita: form.exigeReceita,
          exigeLote: form.exigeLote,
          exigeValidade: form.exigeValidade,
          registroMs: form.registroMs || undefined,
          pmc: form.pmc ? Number(form.pmc) : null,
        }),
      }
      if (editing) {
        await productService.update(editing.id, payload)
      } else {
        await productService.create(payload)
      }
      setShowModal(false)
      await load()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } }
      setError(ax.response?.data?.error || 'Erro ao salvar produto')
    } finally {
      setSaving(false)
    }
  }

  function normalizeHeader(value: string) {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
  }

  function parseCsvLine(line: string, separator: string) {
    const values: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i]
      const next = line[i + 1]

      if (char === '"') {
        if (inQuotes && next === '"') {
          current += '"'
          i += 1
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === separator && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }

    values.push(current.trim())
    return values
  }

  function parseCsv(content: string): CsvRow[] {
    const lines = content
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)

    if (lines.length < 2) return []
    const separator = lines[0].includes(';') ? ';' : ','
    const headers = parseCsvLine(lines[0], separator).map(normalizeHeader)

    return lines.slice(1).map((line) => {
      const values = parseCsvLine(line, separator)
      return headers.reduce<CsvRow>((acc, header, index) => {
        acc[header] = (values[index] || '').replace(/^"|"$/g, '').trim()
        return acc
      }, {})
    })
  }

  function rowValue(row: CsvRow, keys: string[]) {
    for (const key of keys) {
      if (row[key]) return row[key]
    }
    return ''
  }

  function parseNumber(raw: string) {
    if (!raw) return 0
    const normalized = raw.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : 0
  }

  function mapRowToProductPayload(row: CsvRow): ProductPayload | null {
    const name = rowValue(row, ['name', 'nome', 'produto'])
    const price = parseNumber(rowValue(row, ['price', 'preco', 'valor']))
    const stock = parseNumber(rowValue(row, ['stock', 'estoque', 'quantidade', 'qtd']))

    if (!name || price <= 0) return null

    const payload: ProductPayload = {
      name,
      price,
      stock: stock >= 0 ? stock : 0,
      codigoProduto: rowValue(row, ['codigoproduto', 'codigo', 'sku']) || undefined,
      gtinEan: rowValue(row, ['gtinean', 'ean', 'gtin']) || undefined,
      categoria: rowValue(row, ['categoria']) || undefined,
      descricao: rowValue(row, ['descricao', 'descricao']) || undefined,
      estoqueMinimo: parseNumber(rowValue(row, ['estoqueminimo', 'minimo'])) || 0,
    }

    if (isFarmacia) {
      const tipoRaw = rowValue(row, ['tipocontrole', 'controle']).toUpperCase()
      const tipoControle: TipoControle =
        tipoRaw === 'CONTROLADO' || tipoRaw === 'ANTIMICROBIANO' ? tipoRaw : 'COMUM'

      payload.tipoControle = tipoControle
      payload.exigeReceita = ['1', 'sim', 'true', 's'].includes(rowValue(row, ['exigereceita', 'receita']).toLowerCase())
      payload.exigeLote = ['1', 'sim', 'true', 's'].includes(rowValue(row, ['exigelote', 'lote']).toLowerCase())
      payload.exigeValidade = ['1', 'sim', 'true', 's'].includes(rowValue(row, ['exigevalidade', 'validade']).toLowerCase())
      payload.registroMs = rowValue(row, ['registroms', 'ms']) || undefined
      const pmc = parseNumber(rowValue(row, ['pmc']))
      payload.pmc = pmc > 0 ? pmc : null
    }

    return payload
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setImportError('')
    setImportProgress(null)
    setImportRows([])
    setImportFileName(file.name)

    try {
      const content = await file.text()
      const rows = parseCsv(content)
      const mapped = rows.map(mapRowToProductPayload).filter((item): item is ProductPayload => item !== null)

      if (mapped.length === 0) {
        setImportError('Arquivo sem produtos validos. Use colunas como nome, preco e estoque.')
        return
      }

      setImportRows(mapped)
      setImportProgress({
        total: mapped.length,
        processed: 0,
        success: 0,
        failed: 0,
        currentName: '',
      })
    } catch {
      setImportError('Nao foi possivel ler o arquivo. Verifique se o CSV esta valido.')
    }
  }

  async function startImportProducts() {
    if (!importRows.length || importRunning) return

    setImportRunning(true)
    setImportError('')

    let success = 0
    let failed = 0

    for (let index = 0; index < importRows.length; index += 1) {
      const row = importRows[index]
      try {
        setImportProgress({
          total: importRows.length,
          processed: index,
          success,
          failed,
          currentName: row.name,
        })
        await productService.create(row)
        success += 1
      } catch {
        failed += 1
      }

      setImportProgress({
        total: importRows.length,
        processed: index + 1,
        success,
        failed,
        currentName: row.name,
      })
    }

    setImportRunning(false)
    await load()
  }

  function resetImportState() {
    setImportRows([])
    setImportFileName('')
    setImportError('')
    setImportProgress(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function applyBarcodeToSearch(code: string) {
    const barcode = code.trim()
    if (!barcode) return
    setSearch(barcode)
    searchInputRef.current?.focus()
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (showModal || !!loteProduct) return

      const now = Date.now()
      const delta = now - barcodeLastKeyTimeRef.current
      barcodeLastKeyTimeRef.current = now

      if (delta > 90) {
        barcodeBufferRef.current = ''
      }

      if (event.key === 'Enter') {
        const candidate = barcodeBufferRef.current.trim()
        if (candidate.length >= 6) {
          applyBarcodeToSearch(candidate)
          barcodeBufferRef.current = ''
          event.preventDefault()
        }
        return
      }

      if (event.key.length === 1) {
        barcodeBufferRef.current += event.key
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [loteProduct, showModal])

  const normalizedSearch = search
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

  const filteredProducts = products.filter((p) => {
    if (!normalizedSearch) return true
    const haystack = [p.name, p.codigoProduto, p.gtinEan, p.categoria, p.descricao]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

    return haystack.includes(normalizedSearch)
  })

  // ── Lotes ──────────────────────────────────────────────────────────────────

  async function openLotes(p: Product) {
    setLoteProduct(p)
    setLoteEditing(null)
    setLoteForm({ productId: p.id, codigoLote: '', quantidadeAtual: 0, validade: undefined })
    setLoteError('')
    setLoteLoading(true)
    try {
      setLotes(await produtoLoteService.findByProduto(p.id))
    } finally {
      setLoteLoading(false)
    }
  }

  function closeLotes() {
    setLoteProduct(null)
    setLotes([])
    setLoteEditing(null)
    setLoteError('')
  }

  function startEditLote(l: ProdutoLote) {
    setLoteEditing(l)
    setLoteForm({
      productId: l.productId,
      codigoLote: l.codigoLote,
      quantidadeAtual: l.quantidadeAtual,
      validade: l.validade ?? undefined,
    })
  }

  async function saveLote(e: React.FormEvent) {
    e.preventDefault()
    if (!loteProduct) return
    setLoteSaving(true)
    setLoteError('')
    try {
      const payload = { ...loteForm, productId: loteProduct.id }
      if (loteEditing) await produtoLoteService.update(loteEditing.id, payload)
      else await produtoLoteService.create(payload)
      setLoteEditing(null)
      setLoteForm({ productId: loteProduct.id, codigoLote: '', quantidadeAtual: 0, validade: undefined })
      setLotes(await produtoLoteService.findByProduto(loteProduct.id))
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } }
      setLoteError(ax.response?.data?.error || 'Erro ao salvar lote')
    } finally {
      setLoteSaving(false)
    }
  }

  async function deleteLote(l: ProdutoLote) {
    if (!(await appConfirm(`Remover lote ${l.codigoLote}?`, 'Excluir lote'))) return
    await produtoLoteService.remove(l.id)
    if (loteProduct) setLotes(await produtoLoteService.findByProduto(loteProduct.id))
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AppLayout title="Produtos">
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-gray-500">{products.length} produto(s) cadastrado(s)</p>
            <div className="relative w-full max-w-xl">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
              <input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, codigo, EAN, categoria ou descricao..."
                className="w-full rounded-xl border border-gray-200 bg-white/90 pl-11 pr-36 py-3 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
                  aria-label="Limpar busca"
                >
                  &times;
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-gradient-to-r from-primary-50 to-white text-primary-700 px-4 py-2.5 font-semibold shadow-sm hover:shadow transition"
            >
              <span>Importar CSV</span>
            </button>
            <button onClick={openCreate} className="btn-primary">+ Novo Produto</button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleImportFile}
          className="hidden"
        />

        {(importFileName || importError || importProgress) && (
          <div className="card border border-primary-100 bg-gradient-to-br from-white via-primary-50/40 to-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Importacao de produtos</p>
                <p className="text-xs text-gray-500">CSV com colunas: nome, preco, estoque, codigoProduto, categoria, descricao</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary py-2 px-4">
                  Trocar arquivo
                </button>
                <button type="button" onClick={resetImportState} className="btn-secondary py-2 px-4">
                  Limpar
                </button>
              </div>
            </div>

            {importFileName && (
              <p className="mt-3 text-sm text-gray-700">
                Arquivo: <span className="font-medium">{importFileName}</span>
              </p>
            )}

            {importError && <div className="mt-3 bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{importError}</div>}

            {importProgress && (
              <div className="mt-4 space-y-3">
                <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-700 transition-all duration-300"
                    style={{ width: `${Math.min((importProgress.processed / importProgress.total) * 100, 100)}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div className="rounded-lg bg-gray-50 px-3 py-2"><span className="text-gray-500">Total:</span> <span className="font-semibold">{importProgress.total}</span></div>
                  <div className="rounded-lg bg-blue-50 px-3 py-2"><span className="text-gray-500">Processados:</span> <span className="font-semibold">{importProgress.processed}</span></div>
                  <div className="rounded-lg bg-green-50 px-3 py-2"><span className="text-gray-500">Sucesso:</span> <span className="font-semibold text-green-700">{importProgress.success}</span></div>
                  <div className="rounded-lg bg-red-50 px-3 py-2"><span className="text-gray-500">Falhas:</span> <span className="font-semibold text-red-700">{importProgress.failed}</span></div>
                </div>
                <p className="text-xs text-gray-500 min-h-4">
                  {importRunning
                    ? `Importando: ${importProgress.currentName || 'iniciando...'}`
                    : importProgress.processed > 0
                      ? 'Importacao finalizada.'
                      : `Pronto para importar ${importRows.length} produto(s).`}
                </p>
                <button
                  type="button"
                  onClick={startImportProducts}
                  disabled={importRunning || importRows.length === 0}
                  className="btn-primary py-2 px-4"
                >
                  {importRunning ? 'Importando produtos...' : `Iniciar importacao (${importRows.length})`}
                </button>
              </div>
            )}
          </div>
        )}

        {!loading && (
          <div className="flex items-center justify-between text-sm">
            <p className="text-gray-500">
              {search
                ? `${filteredProducts.length} resultado(s) para "${search}"`
                : `Exibindo ${filteredProducts.length} produto(s)`}
            </p>
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-primary-700 hover:text-primary-800 font-medium"
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-400">Carregando...</div>
        ) : products.length === 0 ? (
          <div className="card text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📦</p>
            <p>Nenhum produto cadastrado ainda.</p>
            <button onClick={openCreate} className="btn-primary mt-4">Cadastrar primeiro produto</button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="card text-center py-14 text-gray-500">
            <p className="text-3xl mb-2">🔍</p>
            <p className="font-medium text-gray-700">Nenhum produto encontrado</p>
            <p className="text-sm mt-1">Tente ajustar o termo da busca para encontrar mais resultados.</p>
            <button type="button" onClick={() => setSearch('')} className="btn-secondary mt-4">
              Limpar busca
            </button>
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            <div className="max-h-[68vh] overflow-auto">
              <table className="w-full">
                <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Código', 'Produto', 'Preço', 'Estoque', ...(isFarmacia ? ['Controle'] : []), 'Ações'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-500 text-sm font-mono">{p.codigoProduto || p.gtinEan || '—'}</td>
                      <td className="px-6 py-4 font-medium text-gray-800">
                        {p.name}
                        {p.exigeReceita && <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">Receita</span>}
                      </td>
                      <td className="px-6 py-4 text-gray-700">{fmt(p.price)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${p.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {p.stock} unid.
                        </span>
                      </td>
                      {isFarmacia && (
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {p.tipoControle === 'CONTROLADO' && <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs font-medium">Controlado</span>}
                          {p.tipoControle === 'ANTIMICROBIANO' && <span className="inline-flex items-center px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 text-xs font-medium">Antimicrobiano</span>}
                          {(!p.tipoControle || p.tipoControle === 'COMUM') && <span className="text-gray-400 text-xs">Comum</span>}
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => openLotes(p)} className="text-amber-700 hover:text-amber-900 text-sm font-medium">Lotes</button>
                          <button type="button" onClick={() => openEdit(p)} className="text-primary-600 hover:text-primary-800 text-sm font-medium">Editar</button>
                          <button type="button" onClick={() => handleDelete(p)} className="text-red-500 hover:text-red-700 text-sm font-medium">Remover</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal Lotes ─────────────────────────────────────────────────────── */}
      {loteProduct && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg my-8">
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Lotes — {loteProduct.name}</h3>
              <button type="button" onClick={closeLotes} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              {loteLoading ? (
                <p className="text-gray-400 text-center py-8">Carregando lotes...</p>
              ) : (
                <>
                  <form onSubmit={saveLote} className="space-y-3 border-b border-gray-100 pb-4">
                    <p className="text-sm font-medium text-gray-700">{loteEditing ? 'Editar lote' : 'Novo lote'}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="block text-xs text-gray-600 mb-1">Código do lote</label>
                        <input value={loteForm.codigoLote} onChange={e => setLoteForm({ ...loteForm, codigoLote: e.target.value })} required className="input-field" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Validade</label>
                        <input type="date" value={loteForm.validade?.slice(0, 10) ?? ''} onChange={e => setLoteForm({ ...loteForm, validade: e.target.value || undefined })} className="input-field" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Qtd. atual</label>
                        <input type="number" min={0} value={loteForm.quantidadeAtual} onChange={e => setLoteForm({ ...loteForm, quantidadeAtual: Number(e.target.value) })} required className="input-field" />
                      </div>
                    </div>
                    {loteError && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{loteError}</div>}
                    <div className="flex gap-2">
                      {loteEditing && (
                        <button type="button" onClick={() => { setLoteEditing(null); setLoteForm({ productId: loteProduct.id, codigoLote: '', quantidadeAtual: 0, validade: undefined }) }} className="btn-secondary flex-1">Cancelar edição</button>
                      )}
                      <button type="submit" disabled={loteSaving} className="btn-primary flex-1">{loteSaving ? 'Salvando...' : 'Salvar lote'}</button>
                    </div>
                  </form>
                  {lotes.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">Nenhum lote cadastrado.</p>
                  ) : (
                    <ul className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                      {lotes.map(l => (
                        <li key={l.id} className="py-3 flex justify-between items-center gap-2 text-sm">
                          <div>
                            <span className="font-mono font-medium">{l.codigoLote}</span>
                            <span className="text-gray-500 ml-2">Qtd: {l.quantidadeAtual}</span>
                            {l.validade && <span className="text-gray-500 ml-2">Val: {new Date(l.validade).toLocaleDateString('pt-BR')}</span>}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button type="button" onClick={() => startEditLote(l)} className="text-primary-600 text-xs font-medium">Editar</button>
                            <button type="button" onClick={() => deleteLote(l)} className="text-red-500 text-xs font-medium">Excluir</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Produto ────────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg my-8">
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">{editing ? 'Editar Produto' : 'Novo Produto'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">

              {/* Identificação */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do produto <span className="text-red-500">*</span></label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="input-field" placeholder="Ex: Paracetamol 750mg" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código interno</label>
                  <input value={form.codigoProduto} onChange={e => setForm({ ...form, codigoProduto: e.target.value })} className="input-field" placeholder="000001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GTIN / EAN</label>
                  <input value={form.gtinEan} onChange={e => setForm({ ...form, gtinEan: e.target.value })} className="input-field" placeholder="7891234567890" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <input value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} className="input-field" placeholder="Ex: Analgésicos" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estoque mínimo</label>
                  <input type="number" min="0" value={form.estoqueMinimo} onChange={e => setForm({ ...form, estoqueMinimo: e.target.value })} className="input-field" placeholder="0" />
                </div>
              </div>

              {/* Preço / Estoque */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$) <span className="text-red-500">*</span></label>
                  <input type="number" step="0.01" min="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required className="input-field" placeholder="0,00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estoque <span className="text-red-500">*</span></label>
                  <input type="number" min="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} required className="input-field" placeholder="0" />
                </div>
              </div>

              {/* ── Seção Farmácia ────────────────────────────────────────────── */}
              {isFarmacia && (
                <div className="border border-blue-200 rounded-lg p-4 space-y-4 bg-blue-50">
                  <p className="text-sm font-semibold text-blue-700">Dados Farmácia</p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Registro MS</label>
                      <input value={form.registroMs} onChange={e => setForm({ ...form, registroMs: e.target.value })} className="input-field" placeholder="Ex: 1.0370.0182.001-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">PMC (R$)</label>
                      <input type="number" step="0.01" min="0" value={form.pmc} onChange={e => setForm({ ...form, pmc: e.target.value })} className="input-field" placeholder="0,00" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de controle</label>
                    <select value={form.tipoControle} onChange={e => setForm({ ...form, tipoControle: e.target.value as TipoControle })} className="input-field">
                      <option value="COMUM">Comum</option>
                      <option value="CONTROLADO">Controlado (tarja preta / vermelha)</option>
                      <option value="ANTIMICROBIANO">Antimicrobiano (receita especial)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.exigeReceita} onChange={e => setForm({ ...form, exigeReceita: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                      <span className="text-sm text-gray-700">Exige receita médica para venda</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.exigeLote} onChange={e => setForm({ ...form, exigeLote: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                      <span className="text-sm text-gray-700">Exige controle de lote</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.exigeValidade} onChange={e => setForm({ ...form, exigeValidade: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                      <span className="text-sm text-gray-700">Exige controle de validade</span>
                    </label>
                  </div>
                </div>
              )}

              {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
