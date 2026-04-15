/** CPF/CNPJ e telefone — alinhado às regras do cadastro legado + validação de dígitos do CPF. */

export function onlyDigits(s: string): string {
  return String(s || '').replace(/\D/g, '')
}

export function formatCpfDisplay(digits: string): string {
  const d = onlyDigits(digits).slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`
}

/** Máscara CNPJ para exibição; armazenar/enviar com onlyDigits. */
export function formatCnpjDisplay(digits: string): string {
  const d = onlyDigits(digits).slice(0, 14)
  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`
}

export function isValidCnpjDigits(d14: string): boolean {
  const d = onlyDigits(d14)
  if (d.length !== 14) return false
  if (/^(\d)\1{13}$/.test(d)) return false
  const nums = d.split('').map(Number)
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let soma = 0
  for (let i = 0; i < 12; i++) soma += nums[i] * w1[i]
  let r = soma % 11
  const dig1 = r < 2 ? 0 : 11 - r
  if (dig1 !== nums[12]) return false
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  soma = 0
  for (let i = 0; i < 13; i++) soma += nums[i] * w2[i]
  r = soma % 11
  const dig2 = r < 2 ? 0 : 11 - r
  return dig2 === nums[13]
}

export function isValidCpfDigits(d11: string): boolean {
  const d = onlyDigits(d11)
  if (d.length !== 11) return false
  if (/^(\d)\1{10}$/.test(d)) return false
  const nums = d.split('').map(Number)
  let soma = 0
  for (let i = 0; i < 9; i++) soma += nums[i] * (10 - i)
  let dig1 = 11 - (soma % 11)
  if (dig1 >= 10) dig1 = 0
  if (dig1 !== nums[9]) return false
  soma = 0
  for (let i = 0; i < 10; i++) soma += nums[i] * (11 - i)
  let dig2 = 11 - (soma % 11)
  if (dig2 >= 10) dig2 = 0
  return dig2 === nums[10]
}

/** Máscara exibida; armazenar/enviar apenas dígitos com onlyDigits(cpf). */
export function formatPhoneBrDisplay(digits: string): string {
  const d = onlyDigits(digits).slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`
}

export type ApiFieldErrors = Record<string, string>

export function parseApiFieldErrors(err: unknown): { message: string; fields: ApiFieldErrors } {
  const ax = err as {
    response?: { data?: { error?: string; fields?: ApiFieldErrors } }
  }
  const data = ax.response?.data
  const fields = data?.fields && typeof data.fields === 'object' ? data.fields : {}
  const message =
    typeof data?.error === 'string' && data.error && data.error !== 'Validation failed'
      ? data.error
      : Object.keys(fields).length > 0
        ? 'Corrija os campos destacados.'
        : 'Erro ao salvar.'
  return { message, fields }
}
