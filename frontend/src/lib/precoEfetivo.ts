import type { Product } from '@/types'

/**
 * Replica no cliente a mesma lógica de ProductService.calcularPrecoEfetivo do backend.
 * Retorna o valor total (base × unidades cobradas) para a quantidade informada.
 */
export function calcularPrecoEfetivo(p: Product, quantidade: number): number {
  let base = p.price

  const hoje = new Date().toISOString().slice(0, 10)
  const emPromo =
    !!p.emPromocao ||
    (!!p.promocaoInicio && !!p.promocaoFim && hoje >= p.promocaoInicio && hoje <= p.promocaoFim)

  if (emPromo && p.precoPromocional != null) {
    base = p.precoPromocional
  }

  const levar = p.promoQtdLevar ?? 0
  const pagar = p.promoQtdPagar ?? 0
  if (levar > 0 && pagar > 0 && quantidade >= levar) {
    const grupos = Math.floor(quantidade / levar)
    const restante = quantidade % levar
    const unitsPagar = grupos * pagar + restante
    return base * unitsPagar
  }

  return base * quantidade
}

/** Preço unitário efetivo (para exibição no carrinho). */
export function precoUnitarioEfetivo(p: Product): number {
  return calcularPrecoEfetivo(p, 1)
}
