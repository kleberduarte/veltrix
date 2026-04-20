'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { clienteService } from '@/services/clienteService'
import { orderService } from '@/services/orderService'
import { parametrosEmpresaService } from '@/services/parametrosEmpresaService'
import { pdvTerminalService } from '@/services/pdvTerminalService'
import { productService } from '@/services/productService'
import type { CartItem, Cliente, FormaPagamento, Order, PdvTerminal, Product } from '@/types'
import { getAuth } from '@/lib/auth'
import { appAlert } from '@/lib/dialogs'
import { buildPixCopiaECola, isPixKeyPlaceholder } from '@/lib/pixCopiaECola'
import { printThermalReceipt, type ThermalReceiptExtras } from '@/lib/printThermalReceipt'

export type CaixaVisual = 'LIVRE' | 'PAUSADO' | 'FECHADO'

export function resolveApiErrorMessage(err: unknown, fallback: string) {
  const ax = err as { response?: { status?: number; data?: { error?: string } } }
  if (ax.response?.status === 403) {
    return ax.response.data?.error || 'Seu perfil nao possui permissao para esta operacao no PDV.'
  }
  return ax.response?.data?.error || fallback
}

export function usePdvSale() {
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
  const [fastFood, setFastFood] = useState(false)
  const [showFarmLines, setShowFarmLines] = useState(false)
  const [ultimas, setUltimas] = useState<Order[]>([])
  const [showUltimas, setShowUltimas] = useState(false)
  const [nomeEmpresa, setNomeEmpresa] = useState('Veltrix')
  const [logoEmpresaUrl, setLogoEmpresaUrl] = useState('')
  const [logoFalhou, setLogoFalhou] = useState(false)
  const [pedidoCodigo, setPedidoCodigo] = useState('')
  const [caixaStatus, setCaixaStatus] = useState<CaixaVisual>('LIVRE')
  const [showPagamentoModal, setShowPagamentoModal] = useState(false)
  const [showBuscaProduto, setShowBuscaProduto] = useState(false)
  const [showQtdModal, setShowQtdModal] = useState(false)
  const [showFechamentoModal, setShowFechamentoModal] = useState(false)
  const [showClienteModal, setShowClienteModal] = useState(false)

  const [authUser, setAuthUser] = useState<ReturnType<typeof getAuth>>(null)

  useEffect(() => {
    const syncAuth = () => setAuthUser(getAuth())
    syncAuth()
    window.addEventListener('veltrix-auth-changed', syncAuth)
    return () => window.removeEventListener('veltrix-auth-changed', syncAuth)
  }, [])

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
    setFastFood(!!par?.moduloFastFoodAtivo)
    if (par?.nomeEmpresa?.trim()) setNomeEmpresa(par.nomeEmpresa.trim())
    if (par?.logoUrl?.trim()) {
      setLogoEmpresaUrl(par.logoUrl.trim())
      setLogoFalhou(false)
    } else {
      setLogoEmpresaUrl('')
      setLogoFalhou(false)
    }
  }, [])

  useEffect(() => {
    if (!terminalId) return
    pdvTerminalService.heartbeat(terminalId, caixaStatus).catch(() => {})
    const t = window.setInterval(() => {
      pdvTerminalService.heartbeat(terminalId, caixaStatus).catch(() => {})
    }, 25000)
    return () => window.clearInterval(t)
  }, [terminalId, caixaStatus])

  useEffect(() => {
    if (!terminais.length) return
    const preferredId = authUser?.pdvTerminalId ?? null
    if (preferredId && terminais.some(t => t.id === preferredId)) {
      setTerminalId(preferredId)
      return
    }
    if (terminalId === '') {
      setTerminalId(terminais[0].id)
    }
  }, [terminais, authUser?.pdvTerminalId, terminalId])

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

  useEffect(() => {
    if (!fastFood && forma === 'VOUCHER') {
      setForma('DINHEIRO')
    }
  }, [fastFood, forma])

  const unit = selectedProduct?.price ?? 0
  const totalLinhaPreview = unit * Math.max(1, lineQty)

  const terminalCodigo =
    terminalId === '' ? (authUser?.pdvTerminalCodigo ?? '—') : (terminais.find(t => t.id === terminalId)?.codigo ?? String(terminalId))

  function cycleCaixaStatus() {
    setCaixaStatus(s => (s === 'LIVRE' ? 'PAUSADO' : s === 'PAUSADO' ? 'FECHADO' : 'LIVRE'))
  }

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
    setCart(prev => prev.map(i => (i.product.id === productId ? { ...i, [field]: value || undefined } : i)))
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
          terminalId === '' ? undefined : (terminais.find(t => t.id === terminalId)?.codigo ?? String(terminalId)),
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

  async function buscarClientes() {
    const q = clienteBusca.trim()
    if (!q) {
      setClientesOpts([])
      return
    }
    try {
      setClientesOpts(await clienteService.getAll(q))
    } catch (err: unknown) {
      await appAlert(resolveApiErrorMessage(err, 'Nao foi possivel buscar clientes.'), 'Clientes')
    }
  }

  async function handleClienteCreate(payload: {
    nome: string
    email: string
    telefone: string
    cpf: string
    endereco: string
  }) {
    try {
      const c = await clienteService.create(payload)
      setClienteId(c.id)
      setClienteBusca(c.nome)
      setClientesOpts([])
    } catch (err: unknown) {
      await appAlert(resolveApiErrorMessage(err, 'Nao foi possivel cadastrar cliente no PDV.'), 'Clientes')
      throw err
    }
  }

  async function openUltimas() {
    try {
      const all = await orderService.getAll()
      setUltimas(all.slice(0, 15))
      setShowUltimas(true)
    } catch (err: unknown) {
      await appAlert(resolveApiErrorMessage(err, 'Nao foi possivel carregar as ultimas vendas.'), 'Ultimas vendas')
    }
  }

  const initialQtdModal = useMemo(() => {
    if (selectedProduct) {
      const inCart = cart.find(i => i.product.id === selectedProduct.id)
      if (inCart) return inCart.quantity
    }
    return lineQty
  }, [selectedProduct, cart, lineQty])

  const heroName = selectedProduct?.name ?? (search.trim() ? 'Nenhum resultado' : 'Aguardando produto')

  return {
    // refs
    searchInputRef,
    pedidoInputRef,
    cpfPagamentoRef,
    clienteModalInputRef,
    cartLenRef,
    lastPrintedOrderRef,
    lastPrintedExtrasRef,
    uiRef,
    // data
    products,
    cart,
    search,
    setSearch,
    loading,
    setLoading,
    finishing,
    success,
    selectedProduct,
    setSelectedProduct,
    lineQty,
    setLineQty,
    forma,
    setForma,
    parcelas,
    setParcelas,
    desconto,
    setDesconto,
    cpfCliente,
    setCpfCliente,
    chavePix,
    setChavePix,
    chavePixEmpresa,
    pixQrDataUrl,
    pixPayload,
    pixQrError,
    clienteId,
    setClienteId,
    clienteBusca,
    setClienteBusca,
    clientesOpts,
    setClientesOpts,
    terminais,
    terminalId,
    setTerminalId,
    farmacia,
    fastFood,
    showFarmLines,
    setShowFarmLines,
    ultimas,
    showUltimas,
    setShowUltimas,
    nomeEmpresa,
    logoEmpresaUrl,
    logoFalhou,
    setLogoFalhou,
    pedidoCodigo,
    setPedidoCodigo,
    caixaStatus,
    showPagamentoModal,
    setShowPagamentoModal,
    showBuscaProduto,
    setShowBuscaProduto,
    showQtdModal,
    setShowQtdModal,
    showFechamentoModal,
    setShowFechamentoModal,
    showClienteModal,
    setShowClienteModal,
    authUser,
    filtered,
    subtotalCart,
    descontoNum,
    total,
    unit,
    totalLinhaPreview,
    terminalCodigo,
    initialQtdModal,
    heroName,
    loadBasics,
    cycleCaixaStatus,
    limparEstadoVenda,
    novaVenda,
    limparCarrinho,
    addToCart,
    updateQty,
    setCartLote,
    finalize,
    applyQuantidadeInformada,
    buscarClientes,
    handleClienteCreate,
    openUltimas,
  }
}
