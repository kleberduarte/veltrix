/** PIX EMV “copia e cola” estático (BR), alinhado ao sistema-cadastro (vendas.js). */

export function formatCopiaECola(id: string, value: string): string {
  const valueStr = String(value)
  const len = valueStr.length.toString().padStart(2, '0')
  return `${id}${len}${valueStr}`
}

function crc16CcittFalse(payload: string): string {
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
    }
    crc &= 0xffff
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export function isPixKeyPlaceholder(pixKey: string): boolean {
  const key = String(pixKey || '')
    .trim()
    .toLowerCase()
  return (
    !key ||
    key === 'seu-email-ou-chave-pix-padrao' ||
    key === 'chave pix' ||
    key === 'sua-chave-pix'
  )
}

export function buildPixCopiaECola(params: {
  amount: number
  pixKey: string
  merchantName: string
  merchantCity?: string
}): string {
  const amount = params.amount
  if (!(amount > 0)) {
    throw new Error('Valor inválido para PIX')
  }
  const merchantName = String(params.merchantName || 'Sua Loja').trim().substring(0, 25)
  const merchantCity = String(params.merchantCity || 'SAO PAULO').trim().substring(0, 15)

  let payload = ''
  payload += formatCopiaECola('00', '01')
  payload +=
    formatCopiaECola('26', formatCopiaECola('00', 'br.gov.bcb.pix') + formatCopiaECola('01', params.pixKey))
  payload += formatCopiaECola('52', '0000')
  payload += formatCopiaECola('53', '986')
  payload += formatCopiaECola('54', amount.toFixed(2))
  payload += formatCopiaECola('58', 'BR')
  payload += formatCopiaECola('59', merchantName)
  payload += formatCopiaECola('60', merchantCity)
  payload += formatCopiaECola('62', formatCopiaECola('05', '***'))
  payload += '6304'
  return payload + crc16CcittFalse(payload)
}
