'use client'
import { useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PdvCupomThermal from '@/components/pdv/PdvCupomThermal'
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

function fmt(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default function PdvPage() {
  const router = useRouter()
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
    if (r === 'TOTEM') {
      router.replace('/totem')
    }
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
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
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
        if (getAuth()?.role === 'VENDEDOR' || getAuth()?.role === 'TOTEM') {
          sairDoPdv()
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

  const empresaSigla = nomeEmpresa
    .split(' ')
    .slice(0, 2)
    .map(part => part[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2)

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
            className="inline-flex items-center gap-2 rounded-full border border-primary-200/80 bg-primary-50/80 px-3 py-1.5 text-sm font-semibold text-primary-800 shadow-sm transition-all hover:-translate-y-[1px] hover:bg-primary-100/80 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          >
            <span aria-hidden className="text-base leading-none">←</span>
            <span>Painel</span>
          </button>
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200/90 bg-white px-2 py-1 shadow-sm">
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-primary-100 to-primary-50 ring-1 ring-primary-200/80">
              {logoEmpresaUrl && !logoFalhou ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoEmpresaUrl}
                  alt={`Logo ${nomeEmpresa}`}
                  className="h-full w-full object-contain bg-white"
                  onError={() => setLogoFalhou(true)}
                />
              ) : (
                <span className="text-[11px] font-bold tracking-wide text-primary-800">{empresaSigla || 'PDV'}</span>
              )}
            </div>
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="max-w-[180px] truncate text-[11px] font-semibold text-gray-700">{nomeEmpresa}</span>
              <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-gray-400">PDV</span>
            </div>
          </div>
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
              Operador: <b>{authUser?.name ?? '—'}</b>
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

      <PdvPagamentoModal
        open={showPagamentoModal}
        onClose={() => setShowPagamentoModal(false)}
        forma={forma}
        setForma={setForma}
        parcelas={parcelas}
        setParcelas={setParcelas}
        chavePix={chavePix}
        setChavePix={setChavePix}
        desconto={desconto}
        setDesconto={setDesconto}
        cpfCliente={cpfCliente}
        setCpfCliente={setCpfCliente}
        clienteBusca={clienteBusca}
        setClienteBusca={setClienteBusca}
        clientesOpts={clientesOpts}
        onBuscarClientes={() => void buscarClientes()}
        onSelectCliente={c => {
          setClienteId(c.id)
          setClienteBusca(c.nome)
          setClientesOpts([])
        }}
        farmacia={farmacia}
        fastFood={fastFood}
        showFarmLines={showFarmLines}
        setShowFarmLines={setShowFarmLines}
        subtotalCart={subtotalCart}
        descontoNum={descontoNum}
        total={total}
        pixQrDataUrl={pixQrDataUrl}
        pixQrError={pixQrError}
        pixPayload={pixPayload}
        finishing={finishing}
        cartLength={cart.length}
        onFinalize={() => void finalize()}
        cpfPagamentoRef={cpfPagamentoRef}
        clienteModalInputRef={clienteModalInputRef}
      />

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
