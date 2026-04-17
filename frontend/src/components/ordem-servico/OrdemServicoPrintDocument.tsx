import type { OrdemServico, ParametroEmpresa, StatusOrdemServico } from '@/types'

const STATUS_LABEL: Record<StatusOrdemServico, string> = {
  ABERTA: 'Aberta',
  EM_ANALISE: 'Em análise',
  AGUARDANDO_APROVACAO: 'Aguardando aprovação',
  CONCLUIDA: 'Concluída',
  ENTREGUE: 'Entregue',
  CANCELADA: 'Cancelada',
}

function fmtMoney(n?: number | null) {
  if (n == null || Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
}

function fmtDateTime(iso?: string | null) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })
  } catch {
    return iso
  }
}

function fmtDateOnly(iso?: string | null) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('pt-BR')
  } catch {
    return iso
  }
}

type Props = {
  os: OrdemServico
  empresa: ParametroEmpresa | null
}

export default function OrdemServicoPrintDocument({ os, empresa }: Props) {
  const accent = empresa?.corPrimaria?.trim() || '#2563eb'
  const nomeEmpresa = empresa?.nomeEmpresa?.trim() || 'Empresa'

  return (
    <div className="os-print-inner mx-auto max-w-[210mm] bg-white text-slate-900 print:max-w-none">
      <header className="flex flex-col gap-4 border-b border-slate-200/90 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          {empresa?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={empresa.logoUrl}
              alt=""
              className="h-14 w-auto max-w-[140px] shrink-0 object-contain"
            />
          ) : (
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-black text-white shadow-md"
              style={{ background: `linear-gradient(135deg, ${accent}, #1e293b)` }}
            >
              OS
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">{nomeEmpresa}</h1>
            <div className="mt-1 space-y-0.5 text-xs leading-relaxed text-slate-600">
              {empresa?.cnpj && <p>CNPJ: {empresa.cnpj}</p>}
              {empresa?.enderecoLinha1Os && <p>{empresa.enderecoLinha1Os}</p>}
              {empresa?.cidadeUfOs && <p>{empresa.cidadeUfOs}</p>}
              <p className="flex flex-wrap gap-x-3 gap-y-0.5">
                {empresa?.telefoneComercial && <span>Tel. {empresa.telefoneComercial}</span>}
                {empresa?.emailComercial && <span>{empresa.emailComercial}</span>}
              </p>
            </div>
          </div>
        </div>
        <div className="text-right sm:min-w-[160px]">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-slate-400">Ordem de serviço</p>
          <p className="mt-1 font-mono text-3xl font-black tabular-nums" style={{ color: accent }}>
            #{os.numeroOs}
          </p>
          <p className="mt-2 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {STATUS_LABEL[os.status]}
          </p>
        </div>
      </header>

      <div
        className="mt-6 h-1 w-full rounded-full opacity-90"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
        aria-hidden
      />

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4">
          <h2 className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-slate-400">Cliente</h2>
          <p className="mt-2 text-base font-semibold text-slate-900">{os.nomeCliente}</p>
          <dl className="mt-3 space-y-1 text-sm text-slate-600">
            {os.telefoneCliente && (
              <div className="flex gap-2">
                <dt className="text-slate-400">Tel.</dt>
                <dd>{os.telefoneCliente}</dd>
              </div>
            )}
            {os.contatoCliente && (
              <div className="flex gap-2">
                <dt className="text-slate-400">Contato</dt>
                <dd>{os.contatoCliente}</dd>
              </div>
            )}
            {os.clienteId != null && (
              <div className="flex gap-2">
                <dt className="text-slate-400">Cód. cliente</dt>
                <dd className="font-mono">{os.clienteId}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4">
          <h2 className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-slate-400">Equipamento</h2>
          <dl className="mt-2 space-y-1.5 text-sm">
            <div className="flex justify-between gap-4 border-b border-slate-200/80 pb-1">
              <dt className="text-slate-500">Tipo / equipamento</dt>
              <dd className="max-w-[60%] text-right font-medium text-slate-900">{os.equipamento || '—'}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-200/80 pb-1">
              <dt className="text-slate-500">Marca</dt>
              <dd className="text-right font-medium">{os.marca || '—'}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-200/80 pb-1">
              <dt className="text-slate-500">Modelo</dt>
              <dd className="text-right font-medium">{os.modelo || '—'}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-200/80 pb-1">
              <dt className="text-slate-500">Nº série</dt>
              <dd className="font-mono text-right">{os.numeroSerie || '—'}</dd>
            </div>
            {os.acessorios && (
              <div className="pt-1">
                <dt className="text-slate-500">Acessórios</dt>
                <dd className="mt-1 text-slate-800">{os.acessorios}</dd>
              </div>
            )}
          </dl>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-slate-200/90 p-4">
        <h2 className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-slate-400">Defeito relatado</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{os.defeitoRelatado || '—'}</p>
      </section>

      {(os.diagnostico || os.servicoExecutado) && (
        <section className="mt-4 grid gap-4 sm:grid-cols-2">
          {os.diagnostico && (
            <div className="rounded-2xl border border-slate-200/90 p-4">
              <h2 className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-slate-400">Diagnóstico</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{os.diagnostico}</p>
            </div>
          )}
          {os.servicoExecutado && (
            <div className="rounded-2xl border border-slate-200/90 p-4">
              <h2 className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-slate-400">Serviço executado</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{os.servicoExecutado}</p>
            </div>
          )}
        </section>
      )}

      <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200/90">
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="px-4 py-2.5 text-left font-semibold text-slate-600">Valor serviço</th>
              <td className="px-4 py-2.5 text-right font-numeric font-semibold">{fmtMoney(os.valorServico)}</td>
            </tr>
            <tr className="border-b border-slate-100">
              <th className="px-4 py-2.5 text-left font-semibold text-slate-600">Desconto</th>
              <td className="px-4 py-2.5 text-right font-numeric">{fmtMoney(os.desconto)}</td>
            </tr>
            <tr style={{ background: `${accent}12` }}>
              <th className="px-4 py-3 text-left text-base font-bold text-slate-900">Total</th>
              <td className="px-4 py-3 text-right font-numeric text-lg font-bold" style={{ color: accent }}>
                {fmtMoney(os.valorTotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="mt-4 grid gap-3 rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm sm:grid-cols-2">
        <div>
          <span className="text-slate-500">Abertura</span>
          <p className="font-medium text-slate-900">{fmtDateTime(os.dataAbertura)}</p>
        </div>
        <div>
          <span className="text-slate-500">Previsão entrega</span>
          <p className="font-medium text-slate-900">{fmtDateOnly(os.dataPrevisaoEntrega)}</p>
        </div>
        {os.dataConclusao && (
          <div>
            <span className="text-slate-500">Conclusão</span>
            <p className="font-medium text-slate-900">{fmtDateTime(os.dataConclusao)}</p>
          </div>
        )}
        {os.dataEntrega && (
          <div>
            <span className="text-slate-500">Entrega</span>
            <p className="font-medium text-slate-900">{fmtDateTime(os.dataEntrega)}</p>
          </div>
        )}
        {os.tecnicoResponsavel && (
          <div className="sm:col-span-2">
            <span className="text-slate-500">Técnico responsável</span>
            <p className="font-medium text-slate-900">{os.tecnicoResponsavel}</p>
          </div>
        )}
        {os.observacao && (
          <div className="sm:col-span-2">
            <span className="text-slate-500">Observações</span>
            <p className="mt-1 whitespace-pre-wrap text-slate-800">{os.observacao}</p>
          </div>
        )}
      </section>

      {empresa?.textoTermosOs && (
        <footer className="mt-8 border-t border-slate-200 pt-4 text-[0.7rem] leading-relaxed text-slate-500">
          <p className="whitespace-pre-wrap">{empresa.textoTermosOs}</p>
        </footer>
      )}

      <p className="mt-6 text-center text-[0.65rem] text-slate-400">
        Documento gerado em {new Date().toLocaleString('pt-BR')} — {nomeEmpresa}
      </p>
    </div>
  )
}
