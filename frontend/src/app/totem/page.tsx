'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PdvCupomThermal from '@/components/pdv/PdvCupomThermal'
import PdvModalBuscaProduto from '@/components/pdv/PdvModalBuscaProduto'
import PdvModalQuantidade from '@/components/pdv/PdvModalQuantidade'
import PdvModalFechamentoCaixa from '@/components/pdv/PdvModalFechamentoCaixa'
import PdvModalCliente from '@/components/pdv/PdvModalCliente'
import PdvPagamentoModal from '@/components/pdv/PdvPagamentoModal'
import { resolveApiErrorMessage, usePdvSale } from '@/hooks/usePdvSale'
import { authService } from '@/services/authService'
import { parametrosEmpresaService } from '@/services/parametrosEmpresaService'
import { getAuth, isAuthenticated } from '@/lib/auth'
import { defaultHomePath } from '@/lib/roleAccess'
import { appAlert } from '@/lib/dialogs'
import type { ParametroEmpresa, Product, TipoEstabelecimentoFastFood } from '@/types'
import { useRouter } from 'next/navigation'

const TIPO_LABEL: Record<TipoEstabelecimentoFastFood, string> = {
  HAMBURGUERIA: 'Hamburgueria',
  PIZZARIA: 'Pizzaria',
  RESTAURANTE: 'Restaurante',
  LANCHONETE: 'Lanchonete',
  ACAI_SORVETERIA: 'Açaí / sorvetes',
  OUTROS: 'Outros',
}

/**
 * Filtros do cardápio no totem, alinhados ao tipo de estabelecimento (Parâmetros).
 * No cadastro de produtos, use o mesmo texto em "categoria" para o item aparecer ao tocar aqui.
 */
const CATEGORIAS_SUGERIDAS_POR_TIPO: Partial<Record<TipoEstabelecimentoFastFood, string[]>> = {
  HAMBURGUERIA: ['Destaques', 'Lanches', 'Combos', 'Acompanhamentos', 'Bebidas', 'Sobremesas'],
  PIZZARIA: ['Tradicionais', 'Especiais', 'Combos', 'Doces', 'Bebidas'],
  RESTAURANTE: ['Entradas', 'Pratos principais', 'Combos', 'Bebidas', 'Sobremesas'],
  LANCHONETE: ['Sanduíches', 'Combos', 'Porções', 'Bebidas', 'Sobremesas'],
  ACAI_SORVETERIA: ['Açaí', 'Sorvetes', 'Combos', 'Complementos', 'Bebidas'],
  OUTROS: ['Cardápio', 'Combos', 'Bebidas'],
}

function normalizeCategoria(v: string | null | undefined): string {
  return (v ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function buildCategoriasTotem(
  tipo: TipoEstabelecimentoFastFood | null | undefined,
  products: Product[],
): string[] {
  const presets = (tipo && CATEGORIAS_SUGERIDAS_POR_TIPO[tipo]) ? CATEGORIAS_SUGERIDAS_POR_TIPO[tipo]! : []
  const fromDb = new Map<string, string>()
  for (const p of products) {
    const c = (p.categoria ?? '').trim()
    const key = normalizeCategoria(c)
    if (c && key && !fromDb.has(key)) fromDb.set(key, c)
  }
  const seen = new Set<string>([normalizeCategoria('todos')])
  const out: string[] = ['todos']
  for (const label of presets) {
    const key = normalizeCategoria(label)
    if (!seen.has(key)) {
      seen.add(key)
      out.push(label)
    }
  }
  const extras = Array.from(fromDb.entries())
    .filter(([key]) => !seen.has(key))
    .map(([, label]) => label)
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
  for (const c of extras) out.push(c)
  return out
}

const DEFAULT = {
  primaria: '#2563eb',
  secundaria: '#1e3a8a',
  fundo: '#f3f4f6',
  texto: '#111827',
  botao: '#2563eb',
  botaoTexto: '#ffffff',
} as const

function fmt(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function hexOr(v: string | null | undefined, fallback: string) {
  const t = v?.trim()
  if (t && /^#([0-9A-Fa-f]{6})$/.test(t)) return t
  return fallback
}

/** Mistura hex #RRGGBB com branco (t > 0) ou preto (t < 0) para hover/bordas. */
function mixHex(hex: string, t: number) {
  const m = /^#([0-9A-Fa-f]{6})$/.exec(hex)
  if (!m) return hex
  const n = parseInt(m[1], 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const blend = (c: number) =>
    Math.round(Math.min(255, Math.max(0, t >= 0 ? c + (255 - c) * t : c * (1 + t))))
  const R = blend(r)
  const G = blend(g)
  const B = blend(b)
  return `#${[R, G, B].map(x => x.toString(16).padStart(2, '0')).join('')}`
}

/** Rolagem por toque sem barra visível (totem). */
const TOTEM_SCROLL = 'scrollbar-touch-none overscroll-contain'

function TotemProdutoImagem({
  imagemUrl,
  fallbackBg,
}: {
  imagemUrl?: string | null
  fallbackBg: CSSProperties['background']
}) {
  const [failed, setFailed] = useState(false)
  const u = imagemUrl?.trim()
  const ok = Boolean(u && /^https?:\/\//i.test(u) && !failed)
  return (
    <div
      className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden text-4xl"
      style={{
        background: ok ? 'linear-gradient(180deg, #fafafa 0%, #f3f4f6 100%)' : fallbackBg,
      }}
    >
      {ok ? (
        <Image
          src={u!}
          alt=""
          fill
          unoptimized
          className="object-cover"
          sizes="(max-width: 1024px) 50vw, 280px"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden>🍽️</span>
      )}
    </div>
  )
}

export default function TotemPage() {
  const router = useRouter()
  const [param, setParam] = useState<ParametroEmpresa | null>(null)
  const [cat, setCat] = useState<string>('todos')

  const sale = usePdvSale()
  const {
    products,
    cart,
    loading,
    setLoading,
    finishing,
    success,
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
    terminalCodigo,
    initialQtdModal,
    loadBasics,
    cycleCaixaStatus,
    novaVenda,
    addToCart,
    updateQty,
    setCartLote,
    finalize,
    applyQuantidadeInformada,
    buscarClientes,
    handleClienteCreate,
    openUltimas,
  } = sale

  const loadParam = useCallback(async () => {
    try {
      const p = await parametrosEmpresaService.get()
      setParam(p)
    } catch {
      setParam(null)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login')
      return
    }
    const auth = getAuth()
    if (auth?.role !== 'TOTEM') {
      router.replace(defaultHomePath(auth?.role))
      return
    }
    void (async () => {
      await loadParam()
      try {
        await loadBasics()
      } catch (err: unknown) {
        await appAlert(resolveApiErrorMessage(err, 'Nao foi possivel carregar o totem.'), 'Totem')
      } finally {
        setLoading(false)
      }
    })()
  }, [router, loadBasics, loadParam])

  const categorias = useMemo(
    () => buildCategoriasTotem(param?.tipoEstabelecimentoFastFood, products),
    [products, param?.tipoEstabelecimentoFastFood],
  )

  useEffect(() => {
    if (!categorias.includes(cat)) setCat('todos')
  }, [categorias, cat])

  const produtosGrade = useMemo(() => {
    const ativos = products.filter(p => p.active !== false)
    if (cat === 'todos') return ativos
    const selectedCat = normalizeCategoria(cat)
    return ativos.filter(p => normalizeCategoria(p.categoria) === selectedCat)
  }, [products, cat])

  function handleLogout() {
    const path = authService.logout()
    router.replace(path)
  }

  const theme = useMemo(() => {
    const prim = hexOr(param?.corPrimaria, DEFAULT.primaria)
    const sec = hexOr(param?.corSecundaria, DEFAULT.secundaria)
    const fundo = hexOr(param?.corFundo, DEFAULT.fundo)
    const texto = hexOr(param?.corTexto, DEFAULT.texto)
    const botao = hexOr(param?.corBotao, DEFAULT.botao)
    const botaoTexto = hexOr(param?.corBotaoTexto, DEFAULT.botaoTexto)
    return {
      prim,
      sec,
      fundo,
      texto,
      botao,
      botaoTexto,
      fundoCart: mixHex(fundo, -0.04),
      borda: mixHex(prim, 0.82),
      primMuted: mixHex(prim, 0.88),
      textoMuted: mixHex(texto, 0.45),
    }
  }, [param])

  const nome = param?.nomeEmpresa?.trim() || nomeEmpresa || getAuth()?.companyName || 'Veltrix'
  const logoUrl = param?.logoUrl?.trim() || logoEmpresaUrl
  const tipo = param?.tipoEstabelecimentoFastFood
  const tipoLabel = tipo && TIPO_LABEL[tipo] ? TIPO_LABEL[tipo] : null

  const shellStyle = useMemo(
    () =>
      ({
        '--totem-fundo': theme.fundo,
        '--totem-texto': theme.texto,
        '--totem-prim': theme.prim,
        '--totem-sec': theme.sec,
        '--totem-botao': theme.botao,
        '--totem-botao-texto': theme.botaoTexto,
        '--totem-borda': theme.borda,
        '--totem-prim-muted': theme.primMuted,
        '--totem-texto-muted': theme.textoMuted,
        '--totem-fundo-cart': theme.fundoCart,
        backgroundColor: theme.fundo,
        color: theme.texto,
      }) as React.CSSProperties,
    [theme],
  )

  const podeVender = caixaStatus === 'LIVRE'
  const podeFinalizar = cart.length > 0 && !finishing && podeVender

  return (
    <AppLayout title="Totem" standalonePdv>
      <div className="flex h-full min-h-0 flex-col" style={shellStyle}>
        <header
          className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-3 shadow-sm md:px-6"
          style={{
            borderColor: theme.borda,
            background: `linear-gradient(135deg, ${theme.prim} 0%, ${theme.sec} 100%)`,
            color: theme.botaoTexto,
          }}
        >
          <div className="min-w-0 flex items-center gap-3">
            {logoUrl && !logoFalhou ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt=""
                className="h-10 w-auto max-w-[140px] object-contain drop-shadow"
                onError={() => setLogoFalhou(true)}
              />
            ) : (
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold shadow-lg"
                style={{
                  backgroundColor: mixHex(theme.botaoTexto, -0.25),
                  color: theme.botaoTexto,
                }}
              >
                {nome.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-tight drop-shadow-sm md:text-xl">{nome}</h1>
              <p className="truncate text-xs opacity-90">
                Totem · {tipoLabel ?? 'Cardápio touch'}
                {param?.moduloFastFoodAtivo ? ' · Fast Food' : ''}
                <span className="opacity-75"> · PDV-{terminalCodigo}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={cycleCaixaStatus}
              className={`rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wide transition hover:brightness-110 ${
                caixaStatus === 'LIVRE'
                  ? 'bg-emerald-400/25'
                  : caixaStatus === 'PAUSADO'
                    ? 'bg-amber-500/90 text-gray-900'
                    : 'bg-rose-600/90'
              }`}
            >
              {caixaStatus === 'LIVRE' ? 'Caixa livre' : caixaStatus === 'PAUSADO' ? 'Pausado' : 'Fechado'}
            </button>
            <button
              type="button"
              onClick={() => setShowBuscaProduto(true)}
              className="rounded-xl border px-3 py-2 text-xs font-semibold transition hover:brightness-110"
              style={{
                borderColor: mixHex(theme.botaoTexto, -0.35),
                backgroundColor: mixHex(theme.botaoTexto, -0.15),
                color: theme.botaoTexto,
              }}
            >
              Buscar
            </button>
            <button
              type="button"
              onClick={() => void openUltimas()}
              className="rounded-xl border px-3 py-2 text-xs font-semibold transition hover:brightness-110"
              style={{
                borderColor: mixHex(theme.botaoTexto, -0.35),
                backgroundColor: mixHex(theme.botaoTexto, -0.15),
                color: theme.botaoTexto,
              }}
            >
              Vendas
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border px-3 py-2 text-xs font-semibold transition hover:brightness-110"
              style={{
                borderColor: mixHex(theme.botaoTexto, -0.35),
                backgroundColor: mixHex(theme.botaoTexto, -0.15),
                color: theme.botaoTexto,
              }}
            >
              Sair
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <aside
            className={`flex shrink-0 gap-2 overflow-x-auto border-b px-3 py-3 touch-pan-x lg:w-56 lg:flex-col lg:touch-pan-y lg:overflow-y-auto lg:border-b-0 lg:border-r lg:py-4 ${TOTEM_SCROLL}`}
            style={{ borderColor: 'var(--totem-borda)', backgroundColor: 'var(--totem-fundo-cart)' }}
          >
            {categorias.map(c => {
              const label = c === 'todos' ? 'Todos' : c
              const on = cat === c
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCat(c)}
                  className="flex min-w-[8.5rem] items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-semibold transition lg:min-w-0"
                  style={
                    on
                      ? {
                          backgroundColor: 'var(--totem-prim)',
                          color: 'var(--totem-botao-texto)',
                          boxShadow: `0 0 0 1px ${theme.prim}`,
                        }
                      : {
                          color: 'var(--totem-texto)',
                          opacity: 0.88,
                          backgroundColor: 'transparent',
                        }
                  }
                >
                  {label}
                </button>
              )
            })}
          </aside>

          <main
            className={`min-h-0 flex-1 touch-pan-y overflow-y-auto p-4 md:p-6 ${TOTEM_SCROLL}`}
            style={{ backgroundColor: 'var(--totem-fundo)' }}
          >
            {loading ? (
              <p className="text-center text-sm" style={{ color: 'var(--totem-texto-muted)' }}>
                Carregando cardápio…
              </p>
            ) : products.filter(p => p.active !== false).length === 0 ? (
              <div className="mx-auto max-w-md rounded-2xl border border-dashed px-4 py-10 text-center" style={{ borderColor: 'var(--totem-borda)' }}>
                <p className="text-base font-semibold" style={{ color: 'var(--totem-texto)' }}>
                  Nenhum produto disponível
                </p>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--totem-texto-muted)' }}>
                  Cadastre produtos ativos no sistema. Use <strong>categoria</strong> alinhada ao menu (ex.: Lanches,
                  Bebidas) e, se quiser foto no card, o campo <strong>URL da imagem</strong> em Produtos (link https,
                  como o logo em Parâmetros).
                </p>
              </div>
            ) : produtosGrade.length === 0 ? (
              <div className="mx-auto max-w-md rounded-2xl border border-dashed px-4 py-10 text-center" style={{ borderColor: 'var(--totem-borda)' }}>
                <p className="text-base font-semibold" style={{ color: 'var(--totem-texto)' }}>
                  Nenhum produto nesta categoria
                </p>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--totem-texto-muted)' }}>
                  Ajuste a <strong>categoria</strong> dos produtos no cadastro para coincidir com &quot;{cat}&quot; ou
                  escolha <strong>Todos</strong>.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {produtosGrade.map(p => {
                  const preco =
                    p.emPromocao && p.precoPromocional != null ? p.precoPromocional : p.price
                  const precoVelho = p.emPromocao && p.precoPromocional != null ? p.price : null
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={!podeVender}
                      onClick={() => {
                        setSelectedProduct(p)
                        addToCart(p, 1)
                      }}
                      className="group flex flex-col overflow-hidden rounded-2xl border text-left shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                      style={{
                        borderColor: 'var(--totem-borda)',
                        backgroundColor: mixHex(theme.fundo, 0.35),
                      }}
                    >
                      <TotemProdutoImagem
                        imagemUrl={p.imagemUrl}
                        fallbackBg={`linear-gradient(145deg, ${theme.primMuted} 0%, ${theme.fundo} 100%)`}
                      />
                      <div className="p-3">
                        <p className="font-semibold leading-snug" style={{ color: 'var(--totem-texto)' }}>
                          {p.name}
                        </p>
                        {p.categoria ? (
                          <p className="text-xs" style={{ color: 'var(--totem-texto-muted)' }}>
                            {p.categoria}
                          </p>
                        ) : null}
                        <div className="mt-2 flex flex-wrap items-baseline gap-2">
                          <span className="text-sm font-bold" style={{ color: 'var(--totem-prim)' }}>
                            {fmt(preco)}
                          </span>
                          {precoVelho != null ? (
                            <span
                              className="text-xs line-through"
                              style={{ color: 'var(--totem-texto-muted)' }}
                            >
                              {fmt(precoVelho)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </main>

          <aside
            className="flex w-full min-h-0 shrink-0 flex-col border-t lg:w-[min(100%,420px)] lg:border-l lg:border-t-0"
            style={{
              borderColor: 'var(--totem-borda)',
              backgroundColor: 'var(--totem-fundo-cart)',
            }}
          >
            <div className="shrink-0 border-b px-4 py-3" style={{ borderColor: 'var(--totem-borda)' }}>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--totem-texto)' }}>
                Seu pedido
              </h2>
              <p className="text-xs" style={{ color: 'var(--totem-texto-muted)' }}>
                Operador: <strong>{authUser?.name ?? '—'}</strong>
              </p>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden px-2 py-2">
              <PdvCupomThermal
                nomeEmpresa={nome}
                cart={cart}
                subtotal={subtotalCart}
                desconto={descontoNum}
                total={total}
                loading={loading}
                farmacia={farmacia}
                showFarmLines={showFarmLines}
                onRemoveLine={id => updateQty(id, 0)}
                setCartLote={setCartLote}
                headerSolidColor={theme.prim}
                headerForeground={theme.botaoTexto}
                kioskTotalHighlight
                touchKiosk
              />
            </div>
            {farmacia && cart.length > 0 ? (
              <div className="shrink-0 px-4 pb-2">
                <button
                  type="button"
                  onClick={() => setShowFarmLines(!showFarmLines)}
                  className="text-xs font-medium"
                  style={{ color: theme.prim }}
                >
                  {showFarmLines ? '▼' : '▶'} Lote / validade por item
                </button>
              </div>
            ) : null}
            {success ? (
              <div
                className="mx-4 mb-2 shrink-0 rounded-xl border px-3 py-2 text-center text-xs font-semibold"
                style={{ borderColor: theme.borda, color: theme.texto, backgroundColor: mixHex(theme.fundo, 0.2) }}
              >
                Pedido finalizado com sucesso!
              </div>
            ) : null}
            <div className="shrink-0 space-y-2 border-t p-4" style={{ borderColor: 'var(--totem-borda)' }}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">TOTAL</span>
                <span className="rounded-full bg-rose-100 px-3 py-1.5 text-2xl font-bold tabular-nums text-red-600">
                  {fmt(total)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowClienteModal(true)}
                  className="rounded-xl border py-3 text-xs font-bold"
                  style={{
                    borderColor: 'var(--totem-borda)',
                    color: 'var(--totem-texto)',
                    backgroundColor: mixHex(theme.fundo, 0.2),
                  }}
                >
                  Cliente
                </button>
                <button
                  type="button"
                  onClick={() => setShowFechamentoModal(true)}
                  className="rounded-xl border py-3 text-xs font-bold"
                  style={{
                    borderColor: 'var(--totem-borda)',
                    color: 'var(--totem-texto)',
                    backgroundColor: mixHex(theme.fundo, 0.2),
                  }}
                >
                  Caixa
                </button>
                {cart.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      const last = cart[cart.length - 1]
                      setSelectedProduct(last.product)
                      setShowQtdModal(true)
                    }}
                    className="col-span-2 rounded-xl border py-2.5 text-xs font-bold"
                    style={{
                      borderColor: 'var(--totem-borda)',
                      color: 'var(--totem-texto)',
                      backgroundColor: mixHex(theme.fundo, 0.2),
                    }}
                  >
                    Ajustar quantidade (último item)
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                disabled={!podeFinalizar}
                onClick={() => setShowPagamentoModal(true)}
                className="w-full rounded-2xl py-4 text-base font-bold shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  backgroundColor: theme.prim,
                  color: theme.botaoTexto,
                  boxShadow: `0 4px 14px -4px ${theme.prim}90`,
                }}
              >
                {finishing ? 'Finalizando…' : !podeVender ? 'Caixa indisponível' : 'Pagamento'}
              </button>
              {cart.length > 0 ? (
                <button
                  type="button"
                  onClick={() => novaVenda()}
                  className="w-full rounded-xl border py-2 text-sm font-semibold"
                  style={{ borderColor: 'var(--totem-borda)', color: 'var(--totem-texto-muted)' }}
                >
                  Novo pedido
                </button>
              ) : null}
            </div>
          </aside>
        </div>
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
        cpfPagamentoRef={sale.cpfPagamentoRef}
        clienteModalInputRef={sale.clienteModalInputRef}
      />

      {showUltimas && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setShowUltimas(false)}
        >
          <div
            className="mx-auto flex max-h-[min(90dvh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-gray-200 sm:rounded-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/80 px-4 py-3 sm:px-6 sm:py-4">
              <h3 className="truncate text-base font-semibold text-gray-800 sm:text-lg">Últimas vendas</h3>
              <button
                type="button"
                className="text-2xl leading-none text-gray-400 hover:text-gray-600"
                onClick={() => setShowUltimas(false)}
              >
                &times;
              </button>
            </div>
            <div className={`touch-pan-y overflow-y-auto overflow-x-auto p-3 sm:p-4 ${TOTEM_SCROLL}`}>
              <table className="w-full min-w-[320px] text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
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
                      <td className="whitespace-nowrap py-2">{new Date(o.createdAt).toLocaleString('pt-BR')}</td>
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
