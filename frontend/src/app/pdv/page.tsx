'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PdvCupomThermal from '@/components/pdv/PdvCupomThermal'
import PdvModalBuscaProduto from '@/components/pdv/PdvModalBuscaProduto'
import PdvModalQuantidade from '@/components/pdv/PdvModalQuantidade'
import PdvModalFechamentoCaixa from '@/components/pdv/PdvModalFechamentoCaixa'
import PdvModalCliente from '@/components/pdv/PdvModalCliente'
import { productService } from '@/services/productService'
import { orderService } from '@/services/orderService'
import { clienteService } from '@/services/clienteService'
import { pdvTerminalService } from '@/services/pdvTerminalService'
import { parametrosEmpresaService } from '@/services/parametrosEmpresaService'
import { Cliente, CartItem, FormaPagamento, Order, PdvTerminal, Product } from '@/types'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { getAuth, isAuthenticated, removeAuth } from '@/lib/auth'
import { appAlert, appConfirm } from '@/lib/dialogs'
import QRCode from 'qrcode'
import { buildPixCopiaECola, isPixKeyPlaceholder } from '@/lib/pixCopiaECola'
import { printThermalReceipt, type ThermalReceiptExtras } from '@/lib/printThermalReceipt'

function fmt(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const FORMAS: { value: FormaPagamento; label: string }[] = [
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'DEBITO', label: 'Débito' },
  { value: 'PIX', label: 'Pix' },
  { value: 'CARTAO', label: 'Cartão' },
]

function iconFormaPagamento(f: FormaPagamento) {
  if (f === 'DINHEIRO') return '💵'
  if (f === 'DEBITO') return '🪪'
  if (f === 'PIX') return '📱'
  return '💳'
}

/** Estados do caixa como no sistema-cadastro (bloqueia venda quando ≠ LIVRE) */
type CaixaVisual = 'LIVRE' | 'PAUSADO' | 'FECHADO'

export default function PdvPage() {
  const router = useRouter()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const pedidoInputRef = useRef<HTMLInputElement>(null)
  const cpfPagamentoRef = useRef<HTMLInputElement>(null)
  const clienteModalInputRef = useRef<HTMLInputElement>(null)
  const cartLenRef = useRef(0)
  const lastPrintedOrderRef = useRef<Order | null>(null)
  const lastPrintedExtrasRef = useRef<ThermalReceiptExtras | null>(null)
  const uiRef = useRef({
    showPagamentoModal: false,
    showBuscaProduto: false,
    showQtdModal: false,
    showFechamentoModal: false,
    showClienteModal: false,
    showUltimas: false,
  })
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [finishing, setFinishing] = useState(false)
  const [success, setSuccess] = useState(false)

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [lineQty, setLineQty] = useState(1)

  const [forma, setForma] = useState<FormaPagamento>('DINHEIRO')
  const [parcelas, setParcelas] = useState(1)
  const [desconto, setDesconto] = useState('')
  const [cpfCliente, setCpfCliente] = useState('')
  const [chavePix, setChavePix] = useState('')
  const [chavePixEmpresa, setChavePixEmpresa] = useState('')
  const [pixQrDataUrl, setPixQrDataUrl] = useState<string | null>(null)
  const [pixPayload, setPixPayload] = useState<string | null>(null)
  const [pixQrError, setPixQrError] = useState<string | null>(null)
  const [clienteId, setClienteId] = useState<number | undefined>(undefined)
  const [clienteBusca, setClienteBusca] = useState('')
  const [clientesOpts, setClientesOpts] = useState<Cliente[]>([])
  const [terminais, setTerminais] = useState<PdvTerminal[]>([])
  const [terminalId, setTerminalId] = useState<number | ''>('')
  const [farmacia, setFarmacia] = useState(false)
  const [showFarmLines, setShowFarmLines] = useState(false)
  const [ultimas, setUltimas] = useState<Order[]>([])
  const [showUltimas, setShowUltimas] = useState(false)
  const [nomeEmpresa, setNomeEmpresa] = useState('Veltrix')
  const [pedidoCodigo, setPedidoCodigo] = useState('')
  const [caixaStatus, setCaixaStatus] = useState<CaixaVisual>('LIVRE')
  const [showPagamentoModal, setShowPagamentoModal] = useState(false)
  const [showBuscaProduto, setShowBuscaProduto] = useState(false)
  const [showQtdModal, setShowQtdModal] = useState(false)
  const [showFechamentoModal, setShowFechamentoModal] = useState(false)
  const [showClienteModal, setShowClienteModal] = useState(false)

  const auth = useMemo(() => getAuth(), [])
  const isVendedor = auth?.role === 'VENDEDOR'

  function sairDoPdv() {
    if (isVendedor) {
      removeAuth()
      router.replace('/login')
      return
    }
    router.push('/dashboard')
  }

  useEffect(() => {
    uiRef.current = {
      showPagamentoModal,
      showBuscaProduto,
      showQtdModal,
      showFechamentoModal,
      showClienteModal,
      showUltimas,
    }
  }, [showPagamentoModal, showBuscaProduto, showQtdModal, showFechamentoModal, showClienteModal, showUltimas])

  useEffect(() => {
    cartLenRef.current = cart.length
  }, [cart.length])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return []
    return products.filter(p => p.name.toLowerCase().includes(query))
  }, [products, search])

  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedProduct(null)
      return
    }
    const q = search.trim()
    if (q === '') {
      setSelectedProduct(prev => {
        if (prev && filtered.some(p => p.id === prev.id)) return prev
        return null
      })
      return
    }
    setSelectedProduct(prev => {
      if (prev && filtered.some(p => p.id === prev.id)) return prev
      return filtered[0]
    })
  }, [filtered, search])

  const loadBasics = useCallback(async () => {
    const [prods, term, par] = await Promise.all([
      productService.getAll(),
      pdvTerminalService.getAll().catch(() => [] as PdvTerminal[]),
      parametrosEmpresaService.get().catch(() => null),
    ])
    setProducts(prods)
    setTerminais(term.filter(t => t.ativo))
    if (par?.chavePix) {
      setChavePixEmpresa(par.chavePix)
      setChavePix(par.chavePix)
    } else {
      setChavePixEmpresa('')
    }
    setFarmacia(!!par?.moduloFarmaciaAtivo)
    if (par?.nomeEmpresa?.trim()) setNomeEmpresa(par.nomeEmpresa.trim())
  }, [])

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    loadBasics().finally(() => setLoading(false))
  }, [router, loadBasics])

  useEffect(() => {
    if (!terminalId) return
    pdvTerminalService.heartbeat(terminalId).catch(() => {})
    const t = window.setInterval(() => {
      pdvTerminalService.heartbeat(terminalId).catch(() => {})
    }, 25000)
    return () => window.clearInterval(t)
  }, [terminalId])

  async function openUltimas() {
    const all = await orderService.getAll()
    setUltimas(all.slice(0, 15))
    setShowUltimas(true)
  }

  async function buscarClientes() {
    const q = clienteBusca.trim()
    if (!q) {
      setClientesOpts([])
      return
    }
    setClientesOpts(await clienteService.getAll(q))
  }

  const subtotalCart = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const descontoNum = Math.max(0, Number(desconto) || 0)
  const total = Math.max(0, subtotalCart - descontoNum)

  useEffect(() => {
    if (!showPagamentoModal || forma !== 'PIX') return
    let cancelled = false
    parametrosEmpresaService
      .get()
      .then(p => {
        if (cancelled || !p?.chavePix?.trim()) return
        setChavePixEmpresa(p.chavePix.trim())
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [showPagamentoModal, forma])

  useEffect(() => {
    if (!showPagamentoModal || forma !== 'PIX') {
      setPixQrDataUrl(null)
      setPixPayload(null)
      setPixQrError(null)
      return
    }
    const keyEfetiva = (chavePix.trim() || chavePixEmpresa).trim()
    if (total <= 0) {
      setPixQrDataUrl(null)
      setPixPayload(null)
      setPixQrError('Valor inválido para gerar o QR Code.')
      return
    }
    if (isPixKeyPlaceholder(keyEfetiva)) {
      setPixQrDataUrl(null)
      setPixPayload(null)
      setPixQrError('Configure a Chave PIX em Parâmetros para gerar o QR Code.')
      return
    }
    setPixQrError(null)
    let cancelled = false
    try {
      const payload = buildPixCopiaECola({
        amount: total,
        pixKey: keyEfetiva,
        merchantName: nomeEmpresa || 'Sua Loja',
      })
      void QRCode.toDataURL(payload, { width: 200, margin: 1, errorCorrectionLevel: 'M' }).then(url => {
        if (!cancelled) {
          setPixPayload(payload)
          setPixQrDataUrl(url)
        }
      })
    } catch {
      setPixQrDataUrl(null)
      setPixPayload(null)
      setPixQrError('Erro ao gerar QR Code.')
    }
    return () => {
      cancelled = true
    }
  }, [showPagamentoModal, forma, total, chavePix, chavePixEmpresa, nomeEmpresa])

  const unit = selectedProduct?.price ?? 0
  const totalLinhaPreview = unit * Math.max(1, lineQty)

  const terminalCodigo = terminalId === '' ? '—' : terminais.find(t => t.id === terminalId)?.codigo ?? String(terminalId)

  function cycleCaixaStatus() {
    setCaixaStatus(s => (s === 'LIVRE' ? 'PAUSADO' : s === 'PAUSADO' ? 'FECHADO' : 'LIVRE'))
  }

  /** Limpa carrinho, busca, cliente, linha de item e produto em destaque (como novaVenda no sistema-cadastro). */
  function limparEstadoVenda() {
    setCart([])
    setSearch('')
    setDesconto('')
    setClienteId(undefined)
    setClienteBusca('')
    setClientesOpts([])
    setLineQty(1)
    setPedidoCodigo('')
    setCpfCliente('')
    setSelectedProduct(null)
    setShowPagamentoModal(false)
  }

  function novaVenda() {
    limparEstadoVenda()
    setSuccess(false)
  }

  function limparCarrinho() {
    setCart([])
    setSearch('')
    setSelectedProduct(null)
    setLineQty(0)
  }

  function addToCart(product: Product, qty: number = 1) {
    if (caixaStatus !== 'LIVRE') {
      void appAlert(`Caixa ${caixaStatus}. Operação não permitida.`, 'Caixa indisponível')
      return
    }
    const q = Math.max(1, Math.floor(qty))
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing) {
        return prev.map(i => (i.product.id === product.id ? { ...i, quantity: i.quantity + q } : i))
      }
      return [...prev, { product, quantity: q }]
    })
    setLineQty(1)
  }

  function updateQty(productId: number, qty: number) {
    if (qty <= 0) {
      setCart(prev => prev.filter(i => i.product.id !== productId))
    } else {
      setCart(prev => prev.map(i => (i.product.id === productId ? { ...i, quantity: qty } : i)))
    }
  }

  function setCartLote(productId: number, field: 'loteCodigo' | 'loteValidade', value: string) {
    setCart(prev =>
      prev.map(i => (i.product.id === productId ? { ...i, [field]: value || undefined } : i))
    )
  }

  async function finalize() {
    if (cart.length === 0) return
    setFinishing(true)
    try {
      const order = await orderService.create({
        items: cart.map(i => ({
          productId: i.product.id,
          quantity: i.quantity,
          loteCodigo: i.loteCodigo,
          loteValidade: i.loteValidade,
        })),
        formaPagamento: forma,
        parcelas: forma === 'CARTAO' ? parcelas : 1,
        chavePix: forma === 'PIX' ? (chavePix.trim() || chavePixEmpresa || undefined) : undefined,
        cpfCliente: cpfCliente || undefined,
        clienteId,
        desconto: descontoNum > 0 ? descontoNum : undefined,
        terminalId: terminalId === '' ? undefined : terminalId,
      })
      const extras: ThermalReceiptExtras = {
        nomeEmpresa,
        clienteNome: clienteId ? clienteBusca : undefined,
        terminalCodigo:
          terminalId === ''
            ? undefined
            : (terminais.find(t => t.id === terminalId)?.codigo ?? String(terminalId)),
      }
      lastPrintedOrderRef.current = order
      lastPrintedExtrasRef.current = extras
      printThermalReceipt(order, extras)
      limparEstadoVenda()
      setSuccess(true)
      window.setTimeout(() => searchInputRef.current?.focus(), 0)
      setTimeout(() => setSuccess(false), 4000)
      await loadBasics()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } }
      await appAlert(ax.response?.data?.error || 'Erro ao finalizar venda.', 'Falha na finalização')
    } finally {
      setFinishing(false)
    }
  }

  function applyQuantidadeInformada(n: number) {
    const qty = Math.max(1, Math.floor(n))
    if (selectedProduct && cart.some(i => i.product.id === selectedProduct.id)) {
      updateQty(selectedProduct.id, qty)
    } else {
      setLineQty(qty)
    }
  }

  async function handleClienteCreate(payload: {
    nome: string
    email: string
    telefone: string
    cpf: string
    endereco: string
  }) {
    const c = await clienteService.create(payload)
    setClienteId(c.id)
    setClienteBusca(c.nome)
    setClientesOpts([])
  }

  useEffect(() => {
    async function onKey(e: KeyboardEvent) {
      const key = e.key.length ? e.key : ''
      const keyCode = e.keyCode || e.which
      const u = uiRef.current

      if (key === 'Escape' || keyCode === 27) {
        e.preventDefault()
        e.stopPropagation()
        if (u.showPagamentoModal) {
          setShowPagamentoModal(false)
          return
        }
        if (u.showBuscaProduto) {
          setShowBuscaProduto(false)
          return
        }
        if (u.showQtdModal) {
          setShowQtdModal(false)
          return
        }
        if (u.showFechamentoModal) {
          setShowFechamentoModal(false)
          return
        }
        if (u.showClienteModal) {
          setShowClienteModal(false)
          return
        }
        if (u.showUltimas) {
          setShowUltimas(false)
          return
        }
        if (await appConfirm('Deseja sair do PDV?', 'Sair do PDV')) sairDoPdv()
        return
      }

      if (e.altKey && (key === 'f' || key === 'F')) {
        e.preventDefault()
        e.stopPropagation()
        setShowFechamentoModal(true)
        return
      }

      if (e.ctrlKey && keyCode === 68) {
        e.preventDefault()
        e.stopPropagation()
        setShowPagamentoModal(true)
        window.setTimeout(() => cpfPagamentoRef.current?.focus(), 120)
        return
      }

      const tag = (e.target as HTMLElement)?.tagName?.toUpperCase()
      const editable = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'

      if ((key === 'p' || key === 'P') && !e.ctrlKey && !e.altKey) {
        if (!editable) {
          e.preventDefault()
          e.stopPropagation()
          const lo = lastPrintedOrderRef.current
          const lx = lastPrintedExtrasRef.current
          if (lo && lx) {
            printThermalReceipt(lo, lx)
          } else {
            void appAlert('Nenhum cupom para reimprimir. Finalize uma venda primeiro.', 'Cupom')
          }
        }
        return
      }

      const isFKey = /^F([1-9]|1[0-2])$/.test(key)
      if (!isFKey) return

      e.preventDefault()
      e.stopPropagation()

      const notLivre = caixaStatus !== 'LIVRE'
      if (notLivre) {
        const allowed = key === 'F5' || key === 'F11'
        if (!allowed) return
      }

      switch (key) {
        case 'F2':
          searchInputRef.current?.focus()
          break
        case 'F3':
          pedidoInputRef.current?.focus()
          break
        case 'F4':
          setShowQtdModal(true)
          break
        case 'F5':
          novaVenda()
          break
        case 'F7':
          void openUltimas()
          break
        case 'F8':
          setShowBuscaProduto(true)
          break
        case 'F9':
          void appAlert('Função "Alterar Venda (F9)" não implementada.', 'Função não disponível')
          break
        case 'F10':
          if (cartLenRef.current > 0) setShowPagamentoModal(true)
          break
        case 'F11':
          if (await appConfirm('Tem certeza que deseja cancelar esta venda?', 'Cancelar venda')) novaVenda()
          break
        case 'F12':
          setShowClienteModal(true)
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
    // openUltimas / novaVenda: funções estáveis na prática para atalhos globais
    // eslint-disable-next-line react-hooks/exhaustive-deps -- atalhos PDV
  }, [router, caixaStatus])

  const initialQtdModal = useMemo(() => {
    if (selectedProduct) {
      const inCart = cart.find(i => i.product.id === selectedProduct.id)
      if (inCart) return inCart.quantity
    }
    return lineQty
  }, [selectedProduct, cart, lineQty])

  const heroName = selectedProduct?.name ?? (search.trim() ? 'Nenhum resultado' : 'Aguardando produto')

  const fieldClass =
    'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 sm:py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 min-h-[44px] sm:min-h-0'
  const labelClass = 'block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1'

  const pdvShortcutRowClass = 'flex flex-wrap items-center justify-center gap-x-2 gap-y-2'
  const pdvShortcutChipClass =
    'inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/95 px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-sm shadow-slate-900/[0.06] ring-1 ring-slate-900/[0.03]'
  const pdvKbdClass =
    'rounded-md border border-slate-200/90 bg-gradient-to-b from-slate-50 to-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wide text-slate-800 tabular-nums'

  function PdvShortcut({ keys, label }: { keys: string; label: string }) {
    return (
      <span className={pdvShortcutChipClass}>
        <kbd className={pdvKbdClass}>{keys}</kbd>
        {label}
      </span>
    )
  }

  return (
    <AppLayout title="PDV — Ponto de Venda" standalonePdv>
      <div className="flex flex-col flex-1 min-h-0 h-full bg-gray-50 overflow-hidden pb-[env(safe-area-inset-bottom)]">
        {/* Saída discreta para o ERP (sem menu lateral nesta tela) */}
        <div className="shrink-0 flex items-center justify-between gap-2 border-b border-gray-200/90 bg-white/90 px-3 py-2 backdrop-blur-sm sm:px-4">
          <button
            type="button"
            onClick={sairDoPdv}
            className="text-sm font-medium text-primary-700 hover:text-primary-800 hover:underline"
          >
            ← Painel
          </button>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Veltrix · PDV</span>
        </div>

        {/* Barra superior PDV (layout sistema-cadastro) */}
        <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-700 via-primary-700 to-primary-900 text-white shadow-sm">
          <button
            type="button"
            onClick={cycleCaixaStatus}
            className={`self-start sm:self-auto rounded-lg px-3 py-1.5 text-sm font-bold tracking-wider uppercase transition-colors ${
              caixaStatus === 'LIVRE'
                ? 'bg-emerald-400/25 hover:bg-emerald-400/35'
                : caixaStatus === 'PAUSADO'
                  ? 'bg-amber-500/90 hover:bg-amber-400'
                  : 'bg-rose-600/90 hover:bg-rose-500'
            }`}
            title="Livre → Pausado → Fechado → Livre"
          >
            {caixaStatus === 'LIVRE' ? 'Caixa livre' : caixaStatus === 'PAUSADO' ? 'Caixa pausado' : 'Caixa fechado'}
          </button>
          <div className="text-sm flex flex-wrap items-center gap-x-2 gap-y-1">
            <span title="Terminal PDV">
              PDV-<b className="font-numeric tabular-nums font-semibold">{terminalCodigo}</b>
            </span>
            <span className="text-white/60" aria-hidden>
              ·
            </span>
            <span>
              Operador: <b>{auth?.name ?? '—'}</b>
            </span>
          </div>
        </div>

        {/* Faixa total — mobile/tablet (como sistema-cadastro) */}
        <div
          className="shrink-0 lg:hidden px-4 py-2.5 bg-gradient-to-r from-slate-900 to-slate-800 text-slate-50 border-b border-white/10"
          aria-label="Resumo da venda"
        >
          <div className="flex items-center justify-between gap-3 max-w-6xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Total da venda</span>
            <strong className="text-xl font-extrabold font-numeric tabular-nums text-emerald-400">{fmt(total)}</strong>
          </div>
        </div>

        <div className="flex flex-1 min-h-0 flex-col lg:flex-row gap-3 p-3 sm:p-4 w-full max-w-[100vw] box-border overflow-y-auto lg:overflow-hidden">
          {/* Coluna esquerda: comandos (pdv-left) */}
          <section className="order-2 lg:order-1 flex flex-col w-full lg:w-[35%] lg:min-w-[300px] lg:max-w-[440px] shrink-0 rounded-xl border border-gray-100 bg-white shadow-sm min-h-0 overflow-hidden lg:max-h-full">
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain">
            <div className="px-4 pt-4 pb-2 border-b border-gray-100">
              <p className="text-xs font-semibold text-primary-700 truncate">{nomeEmpresa}</p>
            </div>

            {clienteId && (
              <div className="mx-4 mt-3 rounded-xl border border-primary-200 bg-primary-50/60 px-3 py-2 text-sm">
                <p className="text-[10px] font-bold uppercase text-primary-800 mb-1">Cliente na nota</p>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-gray-900 font-medium truncate">{clienteBusca || `Cliente #${clienteId}`}</span>
                  <button
                    type="button"
                    className="shrink-0 text-gray-500 hover:text-red-600 px-1"
                    title="Remover cliente"
                    onClick={() => {
                      setClienteId(undefined)
                      setClienteBusca('')
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            <div className="p-4 space-y-3 sm:space-y-4 border-b border-gray-100">
              <div>
                <label className={labelClass} htmlFor="pdv-search">
                  Código de barras / busca
                </label>
                <input
                  ref={searchInputRef}
                  id="pdv-search"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && selectedProduct) {
                      e.preventDefault()
                      addToCart(selectedProduct, lineQty)
                    }
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-base shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/35 min-h-[48px]"
                  placeholder="Bipar ou digitar produto…"
                  autoFocus
                  autoComplete="off"
                  autoCorrect="off"
                />
              </div>

              <h2 className="text-sm font-bold text-primary-700 leading-tight line-clamp-2 break-words">
                {heroName}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-2 sm:items-end">
                <label className="flex flex-col gap-1 min-w-0">
                  <span className="text-[10px] font-semibold uppercase text-gray-500">Qtd</span>
                  <div className="flex items-center rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <button
                      type="button"
                      className="h-11 w-10 shrink-0 border-r border-gray-200 text-lg font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                      disabled={!selectedProduct || lineQty <= 1}
                      onClick={() => {
                        const qty = Math.max(1, Math.floor(Number(lineQty) || 1) - 1)
                        setLineQty(qty)
                        if (selectedProduct && cart.some(i => i.product.id === selectedProduct.id)) {
                          updateQty(selectedProduct.id, qty)
                        }
                      }}
                    >
                      −
                    </button>
                    <div
                      id="pdv-qtd"
                      className="w-full min-w-0 px-2 py-2.5 text-center text-base font-semibold font-numeric tabular-nums select-none"
                      aria-live="polite"
                    >
                      {Math.max(1, Math.floor(Number(lineQty) || 1))}
                    </div>
                    <button
                      type="button"
                      className="h-11 w-10 shrink-0 border-l border-gray-200 text-lg font-bold text-primary-700 hover:bg-primary-50 disabled:opacity-40"
                      disabled={!selectedProduct}
                      onClick={() => {
                        const qty = Math.max(1, Math.floor(Number(lineQty) || 1) + 1)
                        setLineQty(qty)
                        if (selectedProduct && cart.some(i => i.product.id === selectedProduct.id)) {
                          updateQty(selectedProduct.id, qty)
                        }
                      }}
                    >
                      +
                    </button>
                  </div>
                </label>
                <div className="rounded-xl border border-primary-200 bg-primary-50/60 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase text-primary-800">Prévia do item</p>
                  <p className="text-sm font-bold font-numeric tabular-nums text-primary-800 mt-0.5">
                    {selectedProduct ? fmt(totalLinhaPreview) : '—'}
                  </p>
                </div>
              </div>
            </div>

            {farmacia && (
              <div className="px-4 pb-3">
                <button
                  type="button"
                  onClick={() => setShowFarmLines(!showFarmLines)}
                  className="text-xs sm:text-sm text-amber-800 font-medium"
                >
                  {showFarmLines ? '▼' : '▶'} Lote / validade por item
                </button>
              </div>
            )}
            </div>

            {/* Rodapé fixo: total + finalizar (pagamento no modal, como sistema-cadastro) */}
            <div className="shrink-0 border-t border-gray-200 bg-white/95 backdrop-blur-md px-3 py-3 shadow-[0_-8px_28px_-10px_rgba(15,23,42,0.15)] space-y-2">
              <div>
                <label className={labelClass} htmlFor="pdv-pedido">
                  Pedido (opcional)
                </label>
                <input
                  ref={pedidoInputRef}
                  id="pdv-pedido"
                  value={pedidoCodigo}
                  onChange={e => setPedidoCodigo(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  placeholder="Código ou número"
                  autoComplete="off"
                />
              </div>
              {success && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm px-2.5 py-1.5 text-center font-medium">
                  Venda finalizada com sucesso!
                </div>
              )}
              <div className="flex justify-between items-baseline gap-2 pt-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Total</span>
                <span className="text-xl sm:text-2xl font-bold font-numeric tabular-nums text-primary-700 leading-none">
                  {fmt(total)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => cart.length > 0 && setShowPagamentoModal(true)}
                disabled={cart.length === 0 || finishing}
                className="btn-primary w-full text-sm sm:text-base py-3 min-h-[48px] rounded-xl font-semibold shadow-md shadow-primary-600/15"
              >
                {finishing ? 'Finalizando…' : 'Finalizar venda (F10)'}
              </button>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={limparCarrinho}
                  className="w-full rounded-xl border border-gray-200 bg-white py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Limpar carrinho
                </button>
              )}
            </div>
          </section>

          {/* Coluna direita: cupom térmico (pdv-right) */}
          <section className="order-1 lg:order-2 flex-1 flex flex-col min-w-0 min-h-[min(320px,45vh)] lg:min-h-0 lg:h-full">
            <PdvCupomThermal
              nomeEmpresa={nomeEmpresa}
              cart={cart}
              subtotal={subtotalCart}
              desconto={descontoNum}
              total={total}
              loading={loading}
              farmacia={farmacia}
              showFarmLines={showFarmLines}
              onRemoveLine={id => updateQty(id, 0)}
              setCartLote={setCartLote}
            />
          </section>
        </div>

        {/* Ações rápidas mobile (layout sistema-cadastro) */}
        <div
          className="lg:hidden fixed bottom-0 left-0 right-0 z-30 grid grid-cols-3 gap-2 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-slate-100 border-t border-slate-200 shadow-[0_-6px_24px_rgba(15,23,42,0.1)]"
          aria-label="Ações rápidas"
        >
          <button
            type="button"
            className="flex flex-col items-center justify-center gap-1 min-h-[52px] rounded-xl border border-slate-300 bg-white text-[0.72rem] font-bold text-slate-900 shadow-sm active:scale-[0.98]"
            onClick={() => searchInputRef.current?.focus()}
          >
            <span className="text-lg leading-none" aria-hidden>
              📷
            </span>
            <span>Código</span>
          </button>
          <button
            type="button"
            className="flex flex-col items-center justify-center gap-1 min-h-[52px] rounded-xl border border-slate-300 bg-white text-[0.72rem] font-bold text-slate-900 shadow-sm active:scale-[0.98]"
            onClick={() => searchInputRef.current?.focus()}
          >
            <span className="text-lg leading-none" aria-hidden>
              📦
            </span>
            <span>Produtos</span>
          </button>
          <button
            type="button"
            className="flex flex-col items-center justify-center gap-1 min-h-[52px] rounded-xl border border-primary-200 bg-gradient-to-b from-primary-600 to-primary-700 text-primary-50 text-[0.72rem] font-bold shadow-sm active:scale-[0.98]"
            onClick={() => cart.length > 0 && setShowPagamentoModal(true)}
            disabled={cart.length === 0 || finishing}
          >
            <span className="text-lg leading-none" aria-hidden>
              ✅
            </span>
            <span>Finalizar</span>
          </button>
          <button
            type="button"
            className="flex flex-col items-center justify-center gap-1 min-h-[52px] rounded-xl border border-slate-300 bg-white text-[0.72rem] font-bold text-slate-900 shadow-sm active:scale-[0.98]"
            onClick={() => document.getElementById('pdv-pedido')?.focus()}
          >
            <span className="text-lg leading-none" aria-hidden>
              📋
            </span>
            <span>Pedido</span>
          </button>
          <button
            type="button"
            className="flex flex-col items-center justify-center gap-1 min-h-[52px] rounded-xl border border-slate-300 bg-white text-[0.72rem] font-bold text-slate-900 shadow-sm active:scale-[0.98]"
            onClick={() => setShowClienteModal(true)}
          >
            <span className="text-lg leading-none" aria-hidden>
              👤
            </span>
            <span>Cliente</span>
          </button>
          <button
            type="button"
            className="flex flex-col items-center justify-center gap-1 min-h-[52px] rounded-xl border border-slate-300 bg-white text-[0.72rem] font-bold text-slate-900 shadow-sm active:scale-[0.98]"
            onClick={() => document.getElementById('pdv-qtd')?.focus()}
          >
            <span className="text-lg leading-none" aria-hidden>
              🔢
            </span>
            <span>Qtd</span>
          </button>
          <button
            type="button"
            className="flex flex-col items-center justify-center gap-1 min-h-[52px] rounded-xl border border-slate-300 bg-white text-[0.72rem] font-bold text-slate-900 shadow-sm active:scale-[0.98]"
            onClick={() => novaVenda()}
          >
            <span className="text-lg leading-none" aria-hidden>
              🆕
            </span>
            <span>Nova venda</span>
          </button>
          <button
            type="button"
            className="flex flex-col items-center justify-center gap-1 min-h-[52px] rounded-xl border border-slate-300 bg-white text-[0.72rem] font-bold text-slate-900 shadow-sm active:scale-[0.98]"
            onClick={() => void openUltimas()}
          >
            <span className="text-lg leading-none" aria-hidden>
              🔍
            </span>
            <span>Vendas</span>
          </button>
          <button
            type="button"
            className="flex flex-col items-center justify-center gap-1 min-h-[52px] rounded-xl border border-slate-400 bg-slate-100 text-[0.72rem] font-bold text-slate-800 shadow-sm active:scale-[0.98]"
            onClick={() => setShowFechamentoModal(true)}
          >
            <span className="text-lg leading-none" aria-hidden>
              🏁
            </span>
            <span>Caixa</span>
          </button>
          <button
            type="button"
            className="flex flex-row items-center justify-center gap-2 min-h-[48px] rounded-xl border border-rose-200 bg-rose-50 text-[0.72rem] font-bold text-rose-900 col-span-3"
            onClick={sairDoPdv}
          >
            <span aria-hidden>🚪</span>
            <span>Sair</span>
            <span className="text-[0.65rem] opacity-80 font-extrabold uppercase">Esc</span>
          </button>
        </div>

        {/* Espaço para não cobrir conteúdo com a barra fixa (mobile) */}
        <div className="shrink-0 lg:hidden h-[calc(180px+env(safe-area-inset-bottom))]" aria-hidden />

        {/* Rodapé atalhos — desktop */}
        <footer
          className="hidden lg:block shrink-0 border-t border-slate-200/80 bg-gradient-to-b from-slate-50/95 to-white px-4 py-2.5 shadow-[0_-4px_18px_-8px_rgba(15,23,42,0.08)]"
          aria-label="Atalhos do teclado"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-2">
            <div className={pdvShortcutRowClass}>
              <PdvShortcut keys="F7" label="Últimas vendas" />
              <PdvShortcut keys="Enter" label="Incluir item" />
              <PdvShortcut keys="F8" label="Pesq. produto" />
              <PdvShortcut keys="F10" label="Finalizar" />
            </div>
            <div className={`${pdvShortcutRowClass} opacity-95`}>
              <PdvShortcut keys="F2" label="Busca" />
              <PdvShortcut keys="F3" label="Pedido" />
              <PdvShortcut keys="F4" label="Qtd" />
              <PdvShortcut keys="F5" label="Nova venda" />
              <PdvShortcut keys="F11" label="Cancelar" />
              <PdvShortcut keys="F12" label="Cliente" />
              <PdvShortcut keys="Alt+F" label="Fechar caixa" />
              <PdvShortcut keys="Ctrl+D" label="CPF" />
              <PdvShortcut keys="P" label="Reimprimir cupom" />
              <PdvShortcut keys="Esc" label="Sair" />
            </div>
          </div>
        </footer>
      </div>

      {showPagamentoModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pdv-modal-pagamento-titulo"
          onClick={() => setShowPagamentoModal(false)}
        >
          <div
            className="w-full max-w-3xl max-h-[min(92dvh,880px)] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200/80 flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="shrink-0 flex items-center justify-between gap-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-4 py-3 sm:px-5">
              <h2 id="pdv-modal-pagamento-titulo" className="text-base sm:text-lg font-bold text-gray-900">
                Finalizar venda
                <span className="ml-2 text-xs font-semibold text-gray-400">(F10)</span>
              </h2>
              <button
                type="button"
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 text-xl leading-none"
                onClick={() => setShowPagamentoModal(false)}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              <div className="grid gap-5 p-4 sm:p-6 md:grid-cols-2 md:gap-8">
                <div className="space-y-4 min-w-0">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Formas de pagamento</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {FORMAS.map(f => (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => setForma(f.value)}
                        className={[
                          'flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition-all min-h-[48px]',
                          forma === f.value
                            ? 'border-primary-500 bg-primary-50 text-primary-900 shadow-md shadow-primary-600/10 ring-2 ring-primary-500/25'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50/80',
                        ].join(' ')}
                      >
                        <span className="text-lg" aria-hidden>
                          {iconFormaPagamento(f.value)}
                        </span>
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {forma === 'CARTAO' && (
                    <div>
                      <label className={labelClass}>Parcelas</label>
                      <select
                        value={parcelas}
                        onChange={e => setParcelas(Number(e.target.value))}
                        className={fieldClass}
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                          <option key={n} value={n}>
                            {n}x
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {forma === 'PIX' && (
                    <div>
                      <label className={labelClass}>Chave Pix (opcional)</label>
                      <input
                        value={chavePix}
                        onChange={e => setChavePix(e.target.value)}
                        className={fieldClass}
                        placeholder="Parâmetros da empresa se vazio"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Desconto (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={desconto}
                        onChange={e => setDesconto(e.target.value)}
                        className={fieldClass}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>CPF na nota (opcional)</label>
                      <input
                        ref={cpfPagamentoRef}
                        value={cpfCliente}
                        onChange={e => setCpfCliente(e.target.value)}
                        className={fieldClass}
                        placeholder="000.000.000-00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="pdv-cliente-busca-modal">
                      Cliente
                    </label>
                    <div className="flex gap-2">
                      <input
                        ref={clienteModalInputRef}
                        id="pdv-cliente-busca-modal"
                        value={clienteBusca}
                        onChange={e => setClienteBusca(e.target.value)}
                        className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 min-h-[44px]"
                        placeholder="Nome, e-mail ou telefone"
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={() => void buscarClientes()}
                        className="shrink-0 rounded-xl border border-gray-200 bg-gray-100 px-3 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-200 min-h-[44px]"
                      >
                        Buscar
                      </button>
                    </div>
                    {clientesOpts.length > 0 && (
                      <div className="mt-2 max-h-36 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100 bg-white shadow-sm">
                        {clientesOpts.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setClienteId(c.id)
                              setClienteBusca(c.nome)
                              setClientesOpts([])
                            }}
                            className="w-full text-left px-3 py-2.5 text-sm hover:bg-primary-50 transition-colors"
                          >
                            {c.nome}{' '}
                            <span className="text-gray-400 text-xs">{c.telefone || c.email || ''}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {farmacia && (
                    <button
                      type="button"
                      onClick={() => setShowFarmLines(!showFarmLines)}
                      className="text-sm font-medium text-amber-800 hover:underline"
                    >
                      {showFarmLines ? '▼' : '▶'} Lote / validade por item no cupom
                    </button>
                  )}
                </div>

                <div className="flex flex-col rounded-2xl border border-gray-200/90 bg-gradient-to-b from-gray-50/90 to-white p-4 sm:p-5 shadow-inner min-h-0">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Resumo da venda</h3>
                  <div className="space-y-2.5 flex-1 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span className="font-numeric tabular-nums font-medium text-gray-900">{fmt(subtotalCart)}</span>
                    </div>
                    {descontoNum > 0 && (
                      <div className="flex justify-between text-amber-800">
                        <span>Desconto</span>
                        <span className="font-numeric tabular-nums font-semibold">− {fmt(descontoNum)}</span>
                      </div>
                    )}
                    <div className="my-3 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Total a pagar</span>
                      <span className="text-2xl sm:text-3xl font-bold font-numeric tabular-nums text-primary-700">
                        {fmt(total)}
                      </span>
                    </div>
                    {forma === 'PIX' && (
                      <div className="mt-4 rounded-xl border border-gray-200/90 bg-white/80 p-3 text-center">
                        {pixQrError && <p className="text-sm text-amber-900 mb-2">{pixQrError}</p>}
                        {pixQrDataUrl && !pixQrError && (
                          <>
                            <Image
                              src={pixQrDataUrl}
                              alt="QR Code para pagamento PIX"
                              width={200}
                              height={200}
                              unoptimized
                              className="mx-auto rounded-lg"
                            />
                            {pixPayload && (
                              <button
                                type="button"
                                className="mt-3 w-full rounded-lg border border-primary-200 bg-primary-50 py-2 text-sm font-semibold text-primary-900 hover:bg-primary-100"
                                onClick={() =>
                                  void navigator.clipboard.writeText(pixPayload).then(() =>
                                    appAlert('Código PIX copiado para a área de transferência.', 'PIX')
                                  )
                                }
                              >
                                Copiar código PIX (copia e cola)
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="mt-5 space-y-2 pt-2 border-t border-gray-200/80">
                    <button
                      type="button"
                      onClick={() => void finalize()}
                      disabled={finishing || cart.length === 0}
                      className="btn-primary w-full py-3.5 min-h-[52px] rounded-xl text-base font-bold shadow-lg shadow-primary-600/20"
                    >
                      {finishing ? 'Confirmando…' : 'Confirmar pagamento'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPagamentoModal(false)}
                      className="w-full rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                    >
                      Voltar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showUltimas && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowUltimas(false)}
        >
          <div
            className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[min(90dvh,720px)] overflow-hidden flex flex-col ring-1 ring-gray-200 mx-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex justify-between items-center gap-2 bg-gray-50/80">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 truncate">Últimas vendas</h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                onClick={() => setShowUltimas(false)}
              >
                &times;
              </button>
            </div>
            <div className="overflow-y-auto overflow-x-auto p-3 sm:p-4">
              <table className="w-full text-xs sm:text-sm min-w-[320px]">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200">
                    <th className="pb-2 font-semibold">#</th>
                    <th className="pb-2 font-semibold">Data</th>
                    <th className="pb-2 font-semibold">Total</th>
                    <th className="pb-2 font-semibold">Pagamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ultimas.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="py-2 font-mono">{o.id}</td>
                      <td className="py-2 whitespace-nowrap">{new Date(o.createdAt).toLocaleString('pt-BR')}</td>
                      <td className="py-2 font-numeric tabular-nums">{fmt(o.total)}</td>
                      <td className="py-2">{o.formaPagamento || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <PdvModalBuscaProduto
        open={showBuscaProduto}
        onClose={() => setShowBuscaProduto(false)}
        products={products}
        loading={loading}
        onPick={p => {
          setSelectedProduct(p)
          addToCart(p, lineQty)
        }}
      />

      <PdvModalQuantidade
        open={showQtdModal}
        onClose={() => setShowQtdModal(false)}
        initialQty={initialQtdModal}
        onConfirm={applyQuantidadeInformada}
      />

      <PdvModalFechamentoCaixa
        open={showFechamentoModal}
        onClose={() => setShowFechamentoModal(false)}
        terminalId={terminalId}
      />

      <PdvModalCliente
        open={showClienteModal}
        onClose={() => setShowClienteModal(false)}
        clienteBusca={clienteBusca}
        setClienteBusca={setClienteBusca}
        clientesOpts={clientesOpts}
        onBuscar={() => void buscarClientes()}
        onSelect={c => {
          setClienteId(c.id)
          setClienteBusca(c.nome)
          setClientesOpts([])
        }}
        onCreate={handleClienteCreate}
      />
    </AppLayout>
  )
}
