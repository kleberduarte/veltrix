import { onlyDigits } from '@/lib/brDocuments'

export type ViaCepSuccess = {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

/** Consulta ViaCEP (API pública). Retorna null em rede/erro ou CEP inexistente. */
export async function consultarCep(cepDigits: string): Promise<ViaCepSuccess | null> {
  const d = onlyDigits(cepDigits)
  if (d.length !== 8) return null
  try {
    const r = await fetch(`https://viacep.com.br/ws/${d}/json/`, { method: 'GET' })
    if (!r.ok) return null
    const data = (await r.json()) as ViaCepSuccess & { erro?: boolean }
    if (data.erro === true) return null
    return data
  } catch {
    return null
  }
}

export function formatCepMask(digits: string): string {
  const d = onlyDigits(digits).slice(0, 8)
  if (d.length <= 5) return d
  return `${d.slice(0, 5)}-${d.slice(5)}`
}
