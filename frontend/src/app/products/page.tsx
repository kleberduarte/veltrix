'use client'
import { useEffect, useState } from 'react'
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
        <div className="flex justify-between items-center">
          <p className="text-gray-500">{products.length} produto(s) cadastrado(s)</p>
          <button onClick={openCreate} className="btn-primary">+ Novo Produto</button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Carregando...</div>
        ) : products.length === 0 ? (
          <div className="card text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📦</p>
            <p>Nenhum produto cadastrado ainda.</p>
            <button onClick={openCreate} className="btn-primary mt-4">Cadastrar primeiro produto</button>
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Produto', 'Código', 'Preço', 'Estoque', ...(isFarmacia ? ['Controle'] : []), 'Ações'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {p.name}
                      {p.exigeReceita && <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">Receita</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm font-mono">{p.codigoProduto || p.gtinEan || '—'}</td>
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
