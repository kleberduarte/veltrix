import { CartItem } from '@/types'

function fmt(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

type Props = {
  nomeEmpresa: string
  cart: CartItem[]
  subtotal: number
  desconto: number
  total: number
  formaLabel: string
  /** Coluna estreita à esquerda */
  variant?: 'sidebar' | 'default'
}

export default function PdvCupomFiscal({
  nomeEmpresa,
  cart,
  subtotal,
  desconto,
  total,
  formaLabel,
  variant = 'default',
}: Props) {
  const agora = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' })
  const isSidebar = variant === 'sidebar'

  const cupomBody = (
    <>
      <p className="text-center font-bold tracking-tight text-sm sm:text-base">{nomeEmpresa}</p>
      <p className="text-center text-[10px] uppercase text-gray-600 mt-1">Documento auxiliar de venda</p>
      <p className="text-center text-[10px] text-gray-500">(não substitui documento fiscal)</p>

      <div className="border-t border-dashed border-gray-300 my-3" />

      <p className="text-center text-gray-600">{agora}</p>

      <div className="border-t border-dashed border-gray-300 my-3" />

      {cart.length === 0 ? (
        <p className="text-center text-gray-500 py-4 px-1">
          Nenhum item no cupom.
          <br />
          <span className="text-gray-400">Inclua itens na venda ao lado.</span>
        </p>
      ) : (
        <ul className="space-y-2.5">
          {cart.map(item => {
            const line = item.product.price * item.quantity
            return (
              <li key={item.product.id} className="border-b border-dotted border-gray-300 pb-2.5 last:border-0 last:pb-0">
                <div className="flex justify-between gap-2">
                  <span className="font-semibold shrink-0">{item.quantity}x</span>
                  <span className="flex-1 text-left break-words">{item.product.name}</span>
                </div>
                <div className="flex justify-between text-gray-700 mt-1 pl-5">
                  <span>{fmt(item.product.price)} un.</span>
                  <span className="font-semibold">{fmt(line)}</span>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="border-t border-dashed border-gray-300 my-3" />

      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{fmt(subtotal)}</span>
        </div>
        {desconto > 0 && (
          <div className="flex justify-between text-amber-800">
            <span>Desconto</span>
            <span>- {fmt(desconto)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-gray-300">
          <span>TOTAL</span>
          <span>{fmt(total)}</span>
        </div>
        <div className="flex justify-between text-gray-600 pt-0.5">
          <span>Pagamento</span>
          <span>{formaLabel}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-gray-300 my-3" />

      <p className="text-center text-[10px] text-gray-500">Obrigado pela preferência!</p>
    </>
  )

  if (isSidebar) {
    return (
      <div className="flex flex-col w-full max-w-[320px] min-h-0 self-start xl:max-h-full">
        <div
          className="bg-gray-50 flex flex-col w-full max-h-full min-h-0 rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          aria-label="Cupom fiscal — pré-visualização"
        >
          <div className="shrink-0 font-mono text-gray-900 leading-relaxed p-4 text-[11px] sm:text-xs border-b border-gray-100/80">
            <p className="text-center font-bold tracking-tight text-sm sm:text-base">{nomeEmpresa}</p>
            <p className="text-center text-[10px] uppercase text-gray-600 mt-1">Documento auxiliar de venda</p>
            <p className="text-center text-[10px] text-gray-500">(não substitui documento fiscal)</p>
            <div className="border-t border-dashed border-gray-300 my-3" />
            <p className="text-center text-gray-600">{agora}</p>
            <div className="border-t border-dashed border-gray-300 my-3" />
          </div>

          <div className="font-mono text-gray-900 leading-relaxed px-4 text-[11px] sm:text-xs overflow-y-auto overscroll-y-contain max-h-[min(50vh,360px)]">
            {cart.length === 0 ? (
              <p className="text-center text-gray-500 py-3 px-1">
                Nenhum item no cupom.
                <br />
                <span className="text-gray-400">Inclua itens na venda ao lado.</span>
              </p>
            ) : (
              <ul className="space-y-2.5 py-1">
                {cart.map(item => {
                  const line = item.product.price * item.quantity
                  return (
                    <li key={item.product.id} className="border-b border-dotted border-gray-300 pb-2.5 last:border-0 last:pb-0">
                      <div className="flex justify-between gap-2">
                        <span className="font-semibold shrink-0">{item.quantity}x</span>
                        <span className="flex-1 text-left break-words">{item.product.name}</span>
                      </div>
                      <div className="flex justify-between text-gray-700 mt-1 pl-5">
                        <span>{fmt(item.product.price)} un.</span>
                        <span className="font-semibold">{fmt(line)}</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="shrink-0 font-mono text-gray-900 leading-relaxed p-4 pt-3 text-[11px] sm:text-xs border-t border-gray-100/80">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{fmt(subtotal)}</span>
              </div>
              {desconto > 0 && (
                <div className="flex justify-between text-amber-800">
                  <span>Desconto</span>
                  <span>- {fmt(desconto)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-gray-300">
                <span>TOTAL</span>
                <span>{fmt(total)}</span>
              </div>
              <div className="flex justify-between text-gray-600 pt-0.5">
                <span>Pagamento</span>
                <span>{formaLabel}</span>
              </div>
            </div>
            <div className="border-t border-dashed border-gray-300 my-3" />
            <p className="text-center text-[10px] text-gray-500">Obrigado pela preferência!</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-0 w-full max-w-full flex-1">
      <div
        className="bg-gray-50 flex flex-col flex-1 min-h-0 w-full overflow-hidden rounded-xl border-2 border-dashed border-gray-200 shadow-sm"
        aria-label="Cupom fiscal — pré-visualização"
      >
        <div className="font-mono text-gray-900 leading-relaxed overflow-y-auto flex-1 min-h-0 p-4 sm:p-6 text-xs sm:text-sm">
          {cupomBody}
        </div>
      </div>
    </div>
  )
}
