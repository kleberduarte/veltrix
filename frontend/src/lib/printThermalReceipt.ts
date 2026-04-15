import type { FormaPagamento, Order } from '@/types'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function fmtBr(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function labelFormaPagamento(forma: FormaPagamento, parcelas: number): string {
  switch (forma) {
    case 'DINHEIRO':
      return 'Dinheiro'
    case 'DEBITO':
      return 'Débito'
    case 'PIX':
      return 'PIX'
    case 'CARTAO':
      return parcelas > 1 ? `Cartão ${parcelas}x` : 'Cartão (crédito)'
    default:
      return String(forma)
  }
}

export type ThermalReceiptExtras = {
  nomeEmpresa: string
  /** Nome exibido do cliente (busca), se houver */
  clienteNome?: string
  /** Código do terminal PDV, ex. "PDV-01" */
  terminalCodigo?: string
}

/**
 * Abre o diálogo de impressão com cupom 80mm (impressora térmica via driver do sistema).
 */
export function printThermalReceipt(order: Order, extras: ThermalReceiptExtras): void {
  const forma = order.formaPagamento
  const formaLabel =
    forma != null ? labelFormaPagamento(forma, order.parcelas ?? 1) : '—'
  const subtotal = order.subtotal ?? order.items.reduce((s, i) => s + i.subtotal, 0)
  const desconto = order.desconto ?? 0
  const dataStr = order.createdAt
    ? new Date(order.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' })
    : new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' })

  const linesHtml = order.items
    .map(i => {
      const nome = escapeHtml(i.productName)
      return `
        <div class="item">
          <div class="item-line">
            <span class="qtd">${i.quantity}x</span>
            <span class="nome">${nome}</span>
          </div>
          <div class="item-precos">
            <span>${fmtBr(i.price)} un.</span>
            <span class="bold">${fmtBr(i.subtotal)}</span>
          </div>
        </div>`
    })
    .join('')

  const descontoRow =
    desconto > 0
      ? `<div class="row"><span>Desconto</span><span>- ${fmtBr(desconto)}</span></div>`
      : ''

  const cpfRow = order.cpfCliente?.trim()
    ? `<div class="row small"><span>CPF na nota</span><span>${escapeHtml(order.cpfCliente.trim())}</span></div>`
    : ''

  const clienteRow = extras.clienteNome?.trim()
    ? `<div class="row small"><span>Cliente</span><span>${escapeHtml(extras.clienteNome.trim())}</span></div>`
    : ''

  const operadorRow = order.nomeOperador?.trim()
    ? `<div class="row small"><span>Operador</span><span>${escapeHtml(order.nomeOperador.trim())}</span></div>`
    : ''

  const terminalRow = extras.terminalCodigo?.trim()
    ? `<div class="row small"><span>Terminal</span><span>${escapeHtml(extras.terminalCodigo.trim())}</span></div>`
    : ''

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<title>Cupom #${order.id}</title>
<style>
  @page { size: 80mm auto; margin: 3mm; }
  * { box-sizing: border-box; }
  body {
    font-family: ui-monospace, "Cascadia Mono", "Consolas", monospace;
    font-size: 11px;
    line-height: 1.35;
    color: #000;
    background: #fff;
    margin: 0;
    padding: 4px 6px;
    max-width: 72mm;
    margin-left: auto;
    margin-right: auto;
  }
  .center { text-align: center; }
  .title { font-weight: 700; font-size: 13px; letter-spacing: 0.02em; }
  .muted { color: #333; font-size: 9px; text-transform: uppercase; }
  .hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
  .item { margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px dotted #444; }
  .item:last-of-type { border-bottom: none; }
  .item-line { display: flex; gap: 6px; }
  .qtd { font-weight: 700; flex-shrink: 0; }
  .nome { flex: 1; word-break: break-word; }
  .item-precos { display: flex; justify-content: space-between; margin-top: 3px; padding-left: 22px; font-size: 10px; }
  .bold { font-weight: 700; }
  .row { display: flex; justify-content: space-between; margin: 3px 0; }
  .row.small { font-size: 10px; color: #222; }
  .total-line { display: flex; justify-content: space-between; font-weight: 700; font-size: 13px; margin-top: 6px; padding-top: 6px; border-top: 1px solid #000; }
  .footer { font-size: 9px; color: #333; margin-top: 10px; }
</style>
</head>
<body>
  <p class="center title">${escapeHtml(extras.nomeEmpresa)}</p>
  <p class="center muted">Documento auxiliar de venda</p>
  <p class="center muted">(não substitui NF-e / NFC-e)</p>
  <hr class="hr"/>
  <p class="center">${escapeHtml(dataStr)}</p>
  <div class="row small"><span>Pedido</span><span>#${order.id}</span></div>
  ${terminalRow}
  ${operadorRow}
  ${clienteRow}
  ${cpfRow}
  <hr class="hr"/>
  ${linesHtml}
  <hr class="hr"/>
  <div class="row"><span>Subtotal</span><span>${fmtBr(subtotal)}</span></div>
  ${descontoRow}
  <div class="total-line"><span>TOTAL</span><span>${fmtBr(order.total)}</span></div>
  <div class="row"><span>Pagamento</span><span>${escapeHtml(formaLabel)}</span></div>
  <hr class="hr"/>
  <p class="center footer">Obrigado pela preferência!</p>
</body>
</html>`

  try {
    const iframe = document.createElement('iframe')
    iframe.setAttribute('aria-hidden', 'true')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    iframe.style.opacity = '0'
    iframe.style.pointerEvents = 'none'
    document.body.appendChild(iframe)

    const doc = iframe.contentDocument
    const win = iframe.contentWindow
    if (!doc || !win) {
      document.body.removeChild(iframe)
      fallbackPrintWindow(html)
      return
    }

    doc.open()
    doc.write(html)
    doc.close()

    window.setTimeout(() => {
      try {
        win.focus()
        win.print()
      } finally {
        window.setTimeout(() => {
          iframe.parentNode?.removeChild(iframe)
        }, 400)
      }
    }, 80)
  } catch {
    fallbackPrintWindow(html)
  }
}

function fallbackPrintWindow(html: string) {
  const w = window.open('', '_blank', 'width=400,height=640')
  if (!w) return
  w.document.open()
  w.document.write(html)
  w.document.close()
  window.setTimeout(() => {
    w.focus()
    w.print()
    window.setTimeout(() => w.close(), 300)
  }, 80)
}
