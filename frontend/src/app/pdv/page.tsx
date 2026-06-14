'use client'
import { useEffect, Fragment, useState as useLocalState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PdvModalBuscaProduto from '@/components/pdv/PdvModalBuscaProduto'
import PdvModalQuantidade from '@/components/pdv/PdvModalQuantidade'
import PdvModalFechamentoCaixa from '@/components/pdv/PdvModalFechamentoCaixa'
import PdvModalCliente from '@/components/pdv/PdvModalCliente'
import PdvPagamentoModal from '@/components/pdv/PdvPagamentoModal'
import { resolveApiErrorMessage, usePdvSale } from '@/hooks/usePdvSale'
import { useRouter } from 'next/navigation'
import { getAuth, isAuthenticated } from '@/lib/auth'
import { appAlert, appConfirm } from '@/lib/dialogs'
import { authService } from '@/services/authService'
import { printThermalReceipt } from '@/lib/printThermalReceipt'
import { calcularPrecoEfetivo, precoUnitarioEfetivo } from '@/lib/precoEfetivo'

function fmt(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

type SideButtonProps = {
  fKey: string
  label: string
  onClick: () => void
  disabled?: boolean
  variant?: 'default' | 'danger' | 'success' | 'warn'
}

function SideButton({ fKey, label, onClick, disabled, variant = 'default' }: SideButtonProps) {
  const variantClass = {
    default: 'bg-primary-800/60 hover:bg-primary-700/80 border-primary-600/40 text-primary-100 hover:text-white',
    danger:  'bg-red-900/60 hover:bg-red-800/80 border-red-700/40 text-red-200 hover:text-white',
    success: 'bg-emerald-800/60 hover:bg-emerald-700/80 border-emerald-600/40 text-emerald-100 hover:text-white',
    warn:    'bg-amber-800/50 hover:bg-amber-700/70 border-amber-600/40 text-amber-100 hover:text-white',
  }[variant]

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex flex-col items-center justify-center gap-0.5 rounded-lg border px-1 py-2 text-center transition-all disabled:pointer-events-none disabled:opacity-35 ${variantClass}`}
    >
      <span className="text-[10px] font-bold font-mono tracking-wider opacity-60">{fKey}</span>
      <span className="text-[11px] font-semibold leading-tight">{label}</span>
    </button>
  )
}

// Ícones SVG inline para mobile — sem emoji
function IconSearch() { return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" /></svg> }
function IconBox()    { return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0v10l-8 4m0-14L4 7m8 4v10" /></svg> }
function IconCheck()  { return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> }
function IconUser()   { return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z" /></svg> }
function IconPlus()   { return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg> }
function IconClose()  { return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg> }

export default function PdvPage() {
  const router = useRouter()
  const [showPedido, setShowPedido] = useLocalState(false)

  const {
    searchInputRef,
    pedidoInputRef,
    cpfPagamentoRef,
    clienteModalInputRef,
    cartLenRef,
    lastPrintedOrderRef,
    lastPrintedExtrasRef,
    uiRef,
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
    terminalId,
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
    subtotalCart,
    descontoNum,
    total,
    totalLinhaPreview,
    terminalCodigo,
    initialQtdModal,
    heroName,
    loadBasics,
    cycleCaixaStatus,
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
  } = usePdvSale()

  useEffect(() => {
    const r = getAuth()?.role
    if (r === 'TOTEM') router.replace('/totem')
  }, [router])

  function sairDoPdv() {
    const roleAtual = getAuth()?.role
    if (roleAtual === 'VENDEDOR' || roleAtual === 'TOTEM') {
      const redirectPath = authService.logout()
      router.replace(redirectPath)
      return
    }
    router.push('/dashboard')
  }

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return }
    ;(async () => {
      try {
        await loadBasics()
      } catch (err: unknown) {
        await appAlert(resolveApiErrorMessage(err, 'Nao foi possivel carregar os dados do PDV.'), 'Erro no PDV')
      } finally {
        setLoading(false)
      }
    })()
  }, [router, loadBasics])

  useEffect(() => {
    async function onKey(e: KeyboardEvent) {
      const key = e.key.length ? e.key : ''
      const keyCode = e.keyCode || e.which
      const u = uiRef.current

      if (key === 'Escape' || keyCode === 27) {
        e.preventDefault(); e.stopPropagation()
        if (u.showPagamentoModal) { setShowPagamentoModal(false); return }
        if (u.showBuscaProduto)   { setShowBuscaProduto(false);   return }
        if (u.showQtdModal)       { setShowQtdModal(false);       return }
        if (u.showFechamentoModal){ setShowFechamentoModal(false); return }
        if (u.showClienteModal)   { setShowClienteModal(false);   return }
        if (u.showUltimas)        { setShowUltimas(false);        return }
        if (getAuth()?.role === 'VENDEDOR' || getAuth()?.role === 'TOTEM') { sairDoPdv(); return }
        if (await appConfirm('Deseja sair do PDV?', 'Sair do PDV')) sairDoPdv()
        return
      }

      if (e.altKey && (key === 'f' || key === 'F')) {
        e.preventDefault(); e.stopPropagation()
        setShowFechamentoModal(true)
        return
      }

      if (e.ctrlKey && keyCode === 68) {
        e.preventDefault(); e.stopPropagation()
        setShowPagamentoModal(true)
        window.setTimeout(() => cpfPagamentoRef.current?.focus(), 120)
        return
      }

      const tag = (e.target as HTMLElement)?.tagName?.toUpperCase()
      const editable = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'

      if ((key === 'p' || key === 'P') && !e.ctrlKey && !e.altKey) {
        if (!editable) {
          e.preventDefault(); e.stopPropagation()
          const lo = lastPrintedOrderRef.current
          const lx = lastPrintedExtrasRef.current
          if (lo && lx) { printThermalReceipt(lo, lx) }
          else { void appAlert('Nenhum cupom para reimprimir. Finalize uma venda primeiro.', 'Cupom') }
        }
        return
      }

      const isFKey = /^F([1-9]|1[0-2])$/.test(key)
      if (!isFKey) return
      e.preventDefault(); e.stopPropagation()

      const notLivre = caixaStatus !== 'LIVRE'
      if (notLivre) {
        const allowed = key === 'F5' || key === 'F11'
        if (!allowed) return
      }

      switch (key) {
        case 'F2': searchInputRef.current?.focus(); break
        case 'F3': setShowPedido(true); window.setTimeout(() => pedidoInputRef.current?.focus(), 80); break
        case 'F4': setShowQtdModal(true); break
        case 'F5': novaVenda(); break
        case 'F7': void openUltimas(); break
        case 'F8': setShowBuscaProduto(true); break
        case 'F9': void appAlert('Função "Alterar Venda (F9)" não implementada.', 'Função não disponível'); break
        case 'F10': if (cartLenRef.current > 0) setShowPagamentoModal(true); break
        case 'F11': if (await appConfirm('Tem certeza que deseja cancelar esta venda?', 'Cancelar venda')) novaVenda(); break
        case 'F12': setShowClienteModal(true); break
        default: break
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- atalhos PDV
  }, [router, caixaStatus])

  const empresaSigla = nomeEmpresa
    .split(' ').slice(0, 2).map(p => p[0] || '').join('').toUpperCase().slice(0, 2)

  const caixaBadgeClass =
    caixaStatus === 'LIVRE'   ? 'bg-emerald-400/20 text-emerald-200 border-emerald-400/30' :
    caixaStatus === 'PAUSADO' ? 'bg-amber-400/20 text-amber-200 border-amber-400/30' :
                                'bg-red-400/20 text-red-200 border-red-400/30'

  const caixaLabel =
    caixaStatus === 'LIVRE' ? 'Livre' : caixaStatus === 'PAUSADO' ? 'Pausado' : 'Fechado'

  return (
    <AppLayout title="PDV — Ponto de Venda" standalonePdv>
      <div className="flex flex-col h-full min-h-0 bg-gray-100 overflow-hidden pb-[env(safe-area-inset-bottom)]">

        {/* ── HEADER ────────────────────────────────────────────────────── */}
        <header className="shrink-0 flex items-center justify-between gap-3 px-4 py-2 bg-gradient-to-r from-primary-800 via-primary-700 to-primary-900 text-white shadow-lg">
          {/* Logo + empresa */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/15 ring-1 ring-white/20">
              {logoEmpresaUrl && !logoFalhou ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoEmpresaUrl} alt="" className="h-full w-full object-contain bg-white" onError={() => setLogoFalhou(true)} />
              ) : (
                <span className="text-[11px] font-black text-white">{empresaSigla || 'VX'}</span>
              )}
            </div>
            <span className="hidden sm:block max-w-[160px] truncate text-[12px] font-bold text-white">{nomeEmpresa}</span>
          </div>

          {/* Centro: operador + terminal */}
          <div className="flex items-center gap-2 text-[11px] text-white/60 min-w-0">
            <span className="hidden md:inline font-mono text-white/50 shrink-0">PDV-{terminalCodigo}</span>
            <span className="hidden md:inline text-white/30 shrink-0" aria-hidden>·</span>
            <span className="truncate max-w-[120px] sm:max-w-none"><span className="font-semibold text-white/80">{authUser?.name ?? '—'}</span></span>
          </div>

          {/* Status + sair */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cycleCaixaStatus}
              title="Clique para alternar status do caixa"
              className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide transition-all ${caixaBadgeClass}`}
            >
              {caixaLabel}
            </button>
            <button
              type="button"
              onClick={sairDoPdv}
              className="rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 px-3 py-1.5 text-[11px] font-semibold text-white/80 hover:text-white transition"
            >
              ← Sair
            </button>
          </div>
        </header>

        {/* ── BODY ──────────────────────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* SIDEBAR — desktop */}
          <aside className="hidden lg:flex shrink-0 w-[108px] flex-col gap-1.5 bg-gradient-to-b from-primary-900 to-primary-800 border-r border-primary-950/50 px-2 py-3 overflow-y-auto">
            <SideButton fKey="F2" label="Buscar" onClick={() => searchInputRef.current?.focus()} />
            <SideButton fKey="F4" label="Qtd" onClick={() => setShowQtdModal(true)} disabled={caixaStatus !== 'LIVRE'} />
            <SideButton fKey="F5" label="Nova Venda" onClick={() => novaVenda()} variant="success" />
            <SideButton fKey="F7" label="Últimas" onClick={() => void openUltimas()} disabled={caixaStatus !== 'LIVRE'} />
            <SideButton fKey="F8" label="Pesq. Prod." onClick={() => setShowBuscaProduto(true)} disabled={caixaStatus !== 'LIVRE'} />
            <div className="my-1 border-t border-white/10" />
            <SideButton fKey="F12" label="Cliente" onClick={() => setShowClienteModal(true)} disabled={caixaStatus !== 'LIVRE'} />
            <SideButton fKey="Alt+F" label="Caixa" onClick={() => setShowFechamentoModal(true)} variant="warn" />
            <div className="my-1 border-t border-white/10" />
            <SideButton fKey="F11" label="Cancelar" onClick={async () => { if (await appConfirm('Cancelar esta venda?', 'Cancelar venda')) novaVenda() }} variant="danger" disabled={cart.length === 0} />
            <SideButton fKey="F10" label="Finalizar" onClick={() => cart.length > 0 && setShowPagamentoModal(true)} variant="success" disabled={cart.length === 0 || finishing} />
            <div className="mt-auto pt-2">
              <SideButton fKey="Esc" label="Sair" onClick={sairDoPdv} variant="danger" />
            </div>
          </aside>

          {/* ÁREA PRINCIPAL */}
          <main className="flex flex-1 min-h-0 min-w-0 flex-col">

            {/* Banner de sucesso (aparece apenas após finalizar) */}
            {success && (
              <div className="shrink-0 flex items-center justify-center gap-2 bg-emerald-600 text-white text-sm font-semibold px-4 py-2 shadow-sm">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Venda finalizada com sucesso!
              </div>
            )}

            {/* Barra de busca */}
            <div className="shrink-0 bg-white border-b border-gray-200 px-3 py-3 sm:px-4 shadow-sm">
              {/* Linha 1: input de busca (full width em mobile) */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none select-none" aria-hidden>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                </span>
                <input
                  ref={searchInputRef}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && selectedProduct) {
                      e.preventDefault()
                      addToCart(selectedProduct, lineQty)
                    }
                  }}
                  className="w-full rounded-lg border-2 border-primary-400/50 bg-white pl-9 pr-4 py-2.5 text-base font-medium shadow-sm placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  placeholder="Código de barras ou nome do produto…"
                  autoFocus
                  autoComplete="off"
                  autoCorrect="off"
                />
              </div>

              {/* Linha 2: Qtd + Incluir */}
              <div className="flex gap-2 items-center mt-2">
                {/* Qtd */}
                <div className="flex items-center shrink-0 rounded-lg border-2 border-gray-200 bg-white overflow-hidden h-11">
                  <button
                    type="button"
                    className="h-full w-10 border-r border-gray-200 text-xl font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                    disabled={!selectedProduct || lineQty <= 1}
                    onClick={() => {
                      const qty = Math.max(1, Math.floor(Number(lineQty) || 1) - 1)
                      setLineQty(qty)
                      if (selectedProduct && cart.some(i => i.product.id === selectedProduct.id)) updateQty(selectedProduct.id, qty)
                    }}
                    aria-label="Diminuir quantidade"
                  >−</button>
                  <div className="w-12 text-center text-base font-bold font-mono tabular-nums select-none" aria-live="polite">
                    {Math.max(1, Math.floor(Number(lineQty) || 1))}
                  </div>
                  <button
                    type="button"
                    className="h-full w-10 border-l border-gray-200 text-xl font-bold text-primary-600 hover:bg-primary-50 disabled:opacity-40"
                    disabled={!selectedProduct}
                    onClick={() => {
                      const qty = Math.max(1, Math.floor(Number(lineQty) || 1) + 1)
                      setLineQty(qty)
                      if (selectedProduct && cart.some(i => i.product.id === selectedProduct.id)) updateQty(selectedProduct.id, qty)
                    }}
                    aria-label="Aumentar quantidade"
                  >+</button>
                </div>

                {/* Incluir (Enter) */}
                <button
                  type="button"
                  onClick={() => selectedProduct && addToCart(selectedProduct, lineQty)}
                  disabled={!selectedProduct || caixaStatus !== 'LIVRE'}
                  className="flex-1 sm:flex-none sm:w-auto rounded-lg border-2 border-primary-600 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 h-11 px-4 text-sm font-bold text-white transition shadow-sm shadow-primary-600/20"
                >
                  Incluir (Enter)
                </button>
              </div>

              {/* Produto encontrado — só mostra quando há algo */}
              {selectedProduct && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-800 truncate">{selectedProduct.name}</span>
                  <span className="shrink-0 rounded-md bg-primary-50 border border-primary-200 px-2 py-0.5 text-[11px] font-bold text-primary-700 tabular-nums font-mono">
                    {fmt(totalLinhaPreview)}
                  </span>
                </div>
              )}

              {/* Cliente vinculado */}
              {clienteId && (
                <div className="mt-2 flex items-center gap-1.5 w-fit rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-[11px] font-semibold text-primary-800">
                  <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z" /></svg>
                  <span className="max-w-[180px] truncate">{clienteBusca || `Cliente #${clienteId}`}</span>
                  <button type="button" className="ml-1 text-primary-400 hover:text-red-600" onClick={() => { setClienteId(undefined); setClienteBusca('') }}>✕</button>
                </div>
              )}

              {farmacia && (
                <button type="button" onClick={() => setShowFarmLines(!showFarmLines)} className="mt-2 text-[11px] text-amber-700 font-medium">
                  {showFarmLines ? '▼' : '▶'} Lote / validade por item
                </button>
              )}
            </div>

            {/* Tabela de itens — sem coluna CÓD e sem coluna IT */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-white mx-3 mt-3 mb-0 rounded-t-xl border border-gray-200 shadow-sm">
              <div className="shrink-0 grid grid-cols-[1fr_3.5rem_5.5rem_2.5rem] gap-x-3 items-center bg-gradient-to-r from-primary-700 to-primary-900 px-4 py-2.5 rounded-t-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">Descrição</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 text-right">Qtd</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 text-right">Total</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 text-center">–</span>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Carregando…</div>
                ) : cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[10rem] text-center px-4 py-10">
                    <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3m3 14h7a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-7m-3 10V6m0 8H6" />
                    </svg>
                    <p className="mt-3 text-sm font-semibold text-gray-400">Nenhum item na venda</p>
                    <p className="mt-1 text-xs text-gray-400">Bipe ou pesquise um produto acima.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {cart.map((item, idx) => {
                      const lineTot   = calcularPrecoEfetivo(item.product, item.quantity)
                      const unitPrice = precoUnitarioEfetivo(item.product)
                      return (
                        <Fragment key={item.product.id}>
                          <li className="grid grid-cols-[1fr_3.5rem_5.5rem_2.5rem] gap-x-3 items-center px-4 py-3 text-sm hover:bg-primary-50/40 transition-colors">
                            <div className="min-w-0">
                              <span className="font-semibold text-gray-800 truncate block" title={item.product.name}>{item.product.name}</span>
                              <span className="text-[11px] text-gray-400 tabular-nums">
                                {idx + 1} · {fmt(unitPrice)} / un
                              </span>
                            </div>
                            <span className="text-right tabular-nums font-mono font-semibold text-gray-700">{item.quantity}</span>
                            <span className="text-right tabular-nums font-bold text-primary-700">{fmt(lineTot)}</span>
                            <div className="flex justify-center">
                              <button
                                type="button"
                                onClick={() => updateQty(item.product.id, 0)}
                                className="h-7 w-7 flex items-center justify-center rounded border border-gray-200 bg-white text-gray-400 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition"
                                title="Remover item"
                                aria-label="Remover item"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </li>
                          {farmacia && showFarmLines && (
                            <li className="bg-amber-50/80 border-b border-amber-100 px-5 py-2">
                              <div className="flex flex-wrap items-center gap-2 text-[0.7rem] text-amber-900">
                                <span className="font-medium">Lote / validade:</span>
                                <input className="w-28 rounded border border-amber-200 bg-white px-2 py-1 text-[0.7rem] shadow-sm focus:outline-none" placeholder="Lote" value={item.loteCodigo ?? ''} onChange={e => setCartLote(item.product.id, 'loteCodigo', e.target.value)} />
                                <input type="date" className="rounded border border-amber-200 bg-white px-2 py-1 text-[0.7rem] shadow-sm focus:outline-none" value={item.loteValidade?.slice(0, 10) ?? ''} onChange={e => setCartLote(item.product.id, 'loteValidade', e.target.value)} />
                              </div>
                            </li>
                          )}
                        </Fragment>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>

            {/* Rodapé: totais + ações */}
            <div className="shrink-0 bg-white mx-3 mb-3 rounded-b-xl border border-t-0 border-gray-200 shadow-sm">
              {/* Totais */}
              <div className="px-4 pt-3 pb-2 space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="tabular-nums font-mono text-gray-700">{fmt(subtotalCart)}</span>
                </div>
                {descontoNum > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-amber-600">Desconto</span>
                    <span className="tabular-nums font-mono text-amber-600">− {fmt(descontoNum)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t border-gray-200 pt-2 mt-1">
                  <span className="text-xs font-black uppercase tracking-widest text-gray-500">Total</span>
                  <span className="text-2xl font-black tabular-nums font-mono text-primary-700">{fmt(total)}</span>
                </div>
              </div>

              {/* Campo pedido — colapsável */}
              {showPedido && (
                <div className="px-4 pb-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1" htmlFor="pdv-pedido">
                    Pedido (F3)
                  </label>
                  <input
                    ref={pedidoInputRef}
                    id="pdv-pedido"
                    value={pedidoCodigo}
                    onChange={e => setPedidoCodigo(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                    placeholder="Código ou número do pedido"
                    autoComplete="off"
                  />
                </div>
              )}

              {/* Botões de ação */}
              <div className="px-3 sm:px-4 pb-4 border-t border-gray-100 pt-3 space-y-2">
                {/* Linha 1 (mobile): Finalizar em destaque */}
                <button
                  type="button"
                  onClick={() => cart.length > 0 && setShowPagamentoModal(true)}
                  disabled={cart.length === 0 || finishing}
                  className="btn-primary w-full rounded-lg py-3 text-base font-bold shadow-md shadow-primary-600/15 disabled:opacity-40"
                >
                  {finishing ? 'Finalizando…' : 'F10 — Finalizar venda'}
                </button>

                {/* Linha 2: ações secundárias */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPedido(v => !v)}
                    title="Vincular pedido (F3)"
                    className="rounded-lg border border-gray-200 bg-white hover:bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500 transition"
                  >
                    Pedido
                  </button>
                  {cart.length > 0 && (
                    <button type="button" onClick={limparCarrinho} className="rounded-lg border border-gray-200 bg-white hover:bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500 transition">
                      Limpar carrinho
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={async () => { if (await appConfirm('Cancelar esta venda?', 'Cancelar venda')) novaVenda() }}
                    disabled={cart.length === 0}
                    className="ml-auto rounded-lg border border-red-200 bg-red-50 hover:bg-red-500 hover:border-red-500 hover:text-white px-3 py-2 text-xs font-bold text-red-600 transition disabled:opacity-40"
                  >
                    F11 Cancelar
                  </button>
                </div>
              </div>
            </div>

          </main>
        </div>

        {/* ── MOBILE: barra de ações ─────────────────────────────────────── */}
        <div
          className="lg:hidden fixed bottom-0 left-0 right-0 z-30 grid grid-cols-3 gap-1 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] bg-gradient-to-b from-primary-800 to-primary-900 border-t border-primary-950/40"
          aria-label="Ações rápidas"
        >
          {[
            { icon: <IconSearch />, label: 'Buscar', onClick: () => searchInputRef.current?.focus(), cls: 'bg-primary-700/60 border-white/10 text-primary-100' },
            { icon: <IconBox />,    label: 'Produtos', onClick: () => setShowBuscaProduto(true), cls: 'bg-primary-700/60 border-white/10 text-primary-100' },
            { icon: <IconCheck />,  label: 'Finalizar', onClick: () => cart.length > 0 && setShowPagamentoModal(true), cls: 'bg-emerald-600/90 border-emerald-500/40 text-white', disabled: cart.length === 0 || finishing },
            { icon: <IconUser />,   label: 'Cliente', onClick: () => setShowClienteModal(true), cls: 'bg-primary-700/60 border-white/10 text-primary-100' },
            { icon: <IconPlus />,   label: 'Nova venda', onClick: () => novaVenda(), cls: 'bg-primary-700/60 border-white/10 text-primary-100' },
            { icon: <IconClose />,  label: 'Sair', onClick: sairDoPdv, cls: 'bg-red-800/70 border-red-600/30 text-red-200' },
          ].map(({ icon, label, onClick, cls, disabled }) => (
            <button
              key={label}
              type="button"
              onClick={onClick}
              disabled={disabled}
              className={`flex flex-col items-center justify-center gap-1 min-h-[50px] rounded-lg border text-[0.68rem] font-semibold active:scale-[0.97] transition disabled:opacity-40 ${cls}`}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="shrink-0 lg:hidden h-[calc(136px+env(safe-area-inset-bottom))]" aria-hidden />

      </div>

      {/* ── MODAIS ────────────────────────────────────────────────────────── */}
      <PdvPagamentoModal
        open={showPagamentoModal}
        onClose={() => setShowPagamentoModal(false)}
        forma={forma} setForma={setForma}
        parcelas={parcelas} setParcelas={setParcelas}
        chavePix={chavePix} setChavePix={setChavePix}
        desconto={desconto} setDesconto={setDesconto}
        cpfCliente={cpfCliente} setCpfCliente={setCpfCliente}
        clienteBusca={clienteBusca} setClienteBusca={setClienteBusca}
        clientesOpts={clientesOpts}
        onBuscarClientes={() => void buscarClientes()}
        onSelectCliente={c => { setClienteId(c.id); setClienteBusca(c.nome); setClientesOpts([]) }}
        farmacia={farmacia} fastFood={fastFood}
        showFarmLines={showFarmLines} setShowFarmLines={setShowFarmLines}
        subtotalCart={subtotalCart} descontoNum={descontoNum} total={total}
        pixQrDataUrl={pixQrDataUrl} pixQrError={pixQrError} pixPayload={pixPayload}
        finishing={finishing} cartLength={cart.length}
        onFinalize={() => void finalize()}
        cpfPagamentoRef={cpfPagamentoRef}
        clienteModalInputRef={clienteModalInputRef}
      />

      {showUltimas && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowUltimas(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[min(90dvh,720px)] overflow-hidden flex flex-col ring-1 ring-gray-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-primary-700 to-primary-900">
              <h3 className="text-base font-bold text-white">Últimas vendas</h3>
              <button type="button" className="text-white/60 hover:text-white text-xl leading-none" onClick={() => setShowUltimas(false)}>&times;</button>
            </div>
            <div className="overflow-y-auto overflow-x-auto p-4">
              <table className="w-full text-sm min-w-[320px]">
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
                      <td className="py-2 font-mono text-gray-600">{o.id}</td>
                      <td className="py-2 whitespace-nowrap text-gray-600">{new Date(o.createdAt).toLocaleString('pt-BR')}</td>
                      <td className="py-2 font-bold tabular-nums text-primary-700">{fmt(o.total)}</td>
                      <td className="py-2 text-gray-600">{o.formaPagamento || '—'}</td>
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
        onPick={p => { setSelectedProduct(p); addToCart(p, lineQty) }}
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
        onSelect={c => { setClienteId(c.id); setClienteBusca(c.nome); setClientesOpts([]) }}
        onCreate={handleClienteCreate}
      />
    </AppLayout>
  )
}
