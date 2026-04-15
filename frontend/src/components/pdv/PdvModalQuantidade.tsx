'use client'
import { useEffect, useState } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  initialQty: number
  title?: string
  onConfirm: (qty: number) => void
}

export default function PdvModalQuantidade({ open, onClose, initialQty, title, onConfirm }: Props) {
  const [q, setQ] = useState(String(initialQty))

  useEffect(() => {
    if (open) setQ(String(Math.max(1, initialQty)))
  }, [open, initialQty])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200 p-5"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-gray-900 mb-1">{title ?? 'Alterar quantidade (F4)'}</h3>
        <p className="text-sm text-gray-500 mb-4">Informe a nova quantidade.</p>
        <input
          type="number"
          min={1}
          value={q}
          onChange={e => setQ(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-3 py-3 text-lg font-numeric tabular-nums text-center mb-4"
          autoFocus
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              const n = Math.max(1, Math.floor(Number(q) || 1))
              onConfirm(n)
              onClose()
            }}
            className="flex-1 btn-primary rounded-xl py-2.5 text-sm font-semibold"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
