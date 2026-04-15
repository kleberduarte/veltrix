'use client'
import { useState } from 'react'
import { Cliente } from '@/types'
import {
  formatCpfDisplay,
  formatPhoneBrDisplay,
  isValidCpfDigits,
  onlyDigits,
  parseApiFieldErrors,
  type ApiFieldErrors,
} from '@/lib/brDocuments'

function fmtCpfList(cpf: string | null | undefined): string {
  const d = onlyDigits(cpf || '')
  return d.length === 11 ? formatCpfDisplay(d) : (cpf || '').trim()
}

type Props = {
  open: boolean
  onClose: () => void
  clienteBusca: string
  setClienteBusca: (v: string) => void
  clientesOpts: Cliente[]
  onBuscar: () => void | Promise<void>
  onSelect: (c: Cliente) => void
  onCreate: (payload: {
    nome: string
    email: string
    telefone: string
    cpf: string
    endereco: string
  }) => Promise<void>
}

export default function PdvModalCliente({
  open,
  onClose,
  clienteBusca,
  setClienteBusca,
  clientesOpts,
  onBuscar,
  onSelect,
  onCreate,
}: Props) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [cpf, setCpf] = useState('')
  const [endereco, setEndereco] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [fieldErrors, setFieldErrors] = useState<ApiFieldErrors>({})

  if (!open) return null

  function fieldClass(name: string) {
    return fieldErrors[name]
      ? 'w-full rounded-xl border border-red-400 ring-1 ring-red-300 px-3 py-2 text-sm'
      : 'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm'
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    setFieldErrors({})
    const n = nome.trim()
    if (n.length < 3) {
      setErr('Nome deve ter no mínimo 3 caracteres.')
      return
    }
    if (!email.trim()) {
      setErr('Preencha o e-mail.')
      return
    }
    const cpfD = onlyDigits(cpf)
    if (cpfD.length !== 11 || !isValidCpfDigits(cpfD)) {
      setErr('CPF inválido. Informe 11 dígitos válidos.')
      return
    }
    if (onlyDigits(telefone).length < 8) {
      setErr('Telefone deve ter no mínimo 8 dígitos.')
      return
    }
    setSaving(true)
    try {
      await onCreate({
        nome: n,
        email: email.trim().toLowerCase(),
        telefone: telefone.trim(),
        cpf: cpfD,
        endereco: endereco.trim(),
      })
      setNome('')
      setEmail('')
      setTelefone('')
      setCpf('')
      setEndereco('')
      onClose()
    } catch (e: unknown) {
      const { message, fields } = parseApiFieldErrors(e)
      setFieldErrors(fields)
      setErr(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdv-modal-f12-titulo"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[min(92dvh,800px)] overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200 p-4 sm:p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 mb-4">
          <h2 id="pdv-modal-f12-titulo" className="text-lg font-bold text-gray-900">
            Indicar cliente (F12) — CPF na nota
          </h2>
          <button type="button" className="text-2xl text-gray-400 hover:text-gray-700 leading-none" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            value={clienteBusca}
            onChange={e => setClienteBusca(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void onBuscar()
              }
            }}
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
            placeholder="Nome, e-mail, CPF, telefone ou código PDV do cliente…"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => void onBuscar()}
            className="shrink-0 rounded-xl border border-gray-200 bg-gray-100 px-4 py-2.5 text-sm font-semibold hover:bg-gray-200"
          >
            Buscar
          </button>
        </div>
        <p className="text-[11px] text-gray-500 -mt-2 mb-4">
          O código PDV é o de 8 caracteres exibido em Clientes (convite do cadastro).
        </p>

        {clientesOpts.length > 0 && (
          <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 max-h-48 overflow-y-auto mb-6">
            {clientesOpts.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onSelect(c)
                  onClose()
                }}
                className="w-full text-left px-3 py-2.5 text-sm hover:bg-primary-50"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-gray-900">{c.nome}</span>
                  {c.codigoConvitePdv ? (
                    <span className="shrink-0 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-amber-950">
                      {c.codigoConvitePdv}
                    </span>
                  ) : null}
                </div>
                <div className="text-gray-500 text-xs mt-0.5 truncate">
                  {[fmtCpfList(c.cpf), c.telefone, c.email].filter(Boolean).join(' · ') || '—'}
                </div>
              </button>
            ))}
          </div>
        )}

        <hr className="border-gray-200 mb-4" />
        <h3 className="text-sm font-bold text-gray-800 mb-3">Cadastrar novo cliente</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold uppercase text-gray-500 mb-1">Nome *</label>
              <input
                value={nome}
                onChange={e => setNome(e.target.value)}
                className={fieldClass('nome')}
                minLength={3}
                maxLength={200}
                required
              />
              {fieldErrors.nome && <p className="text-xs text-red-600 mt-0.5">{fieldErrors.nome}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase text-gray-500 mb-1">CPF *</label>
              <input
                value={cpf}
                onChange={e => setCpf(formatCpfDisplay(onlyDigits(e.target.value)))}
                className={fieldClass('cpf')}
                inputMode="numeric"
                placeholder="000.000.000-00"
                required
              />
              {fieldErrors.cpf && <p className="text-xs text-red-600 mt-0.5">{fieldErrors.cpf}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase text-gray-500 mb-1">E-mail *</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={fieldClass('email')}
                required
              />
              {fieldErrors.email && <p className="text-xs text-red-600 mt-0.5">{fieldErrors.email}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase text-gray-500 mb-1">Telefone *</label>
              <input
                value={telefone}
                onChange={e => setTelefone(formatPhoneBrDisplay(onlyDigits(e.target.value)))}
                className={fieldClass('telefone')}
                inputMode="tel"
                placeholder="(00) 00000-0000"
                required
              />
              {fieldErrors.telefone && <p className="text-xs text-red-600 mt-0.5">{fieldErrors.telefone}</p>}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase text-gray-500 mb-1">Endereço</label>
            <input value={endereco} onChange={e => setEndereco(e.target.value)} className={fieldClass('endereco')} />
            {fieldErrors.endereco && <p className="text-xs text-red-600 mt-0.5">{fieldErrors.endereco}</p>}
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {saving ? 'Salvando…' : 'Cadastrar e usar na nota'}
          </button>
        </form>
      </div>
    </div>
  )
}
