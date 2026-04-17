'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ordemServicoService, type OsSugestaoCampo } from '@/services/ordemServicoService'

export type { OsSugestaoCampo }

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

type Props = {
  label: string
  campo: OsSugestaoCampo
  value: string
  onChange: (v: string) => void
  className?: string
  multiline?: boolean
  rows?: number
  required?: boolean
}

export default function OsComboboxField({
  label,
  campo,
  value,
  onChange,
  className = '',
  multiline,
  rows = 3,
  required,
}: Props) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const debounced = useDebounced(value, 280)
  const wrapRef = useRef<HTMLDivElement>(null)

  const load = useCallback(
    async (q: string) => {
      setLoading(true)
      try {
        const list = await ordemServicoService.sugestoes(campo, q)
        setItems(list)
      } catch {
        setItems([])
      } finally {
        setLoading(false)
      }
    },
    [campo],
  )

  useEffect(() => {
    if (!open) return
    void load(debounced)
  }, [open, debounced, load])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const showList = open && items.length > 0
  const inputCls = `input-field ${className}`.trim()

  return (
    <div ref={wrapRef} className="relative">
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => {
            setOpen(true)
            void load(value)
          }}
          rows={rows}
          required={required}
          className={inputCls}
          autoComplete="off"
        />
      ) : (
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => {
            setOpen(true)
            void load(value)
          }}
          required={required}
          className={inputCls}
          autoComplete="off"
        />
      )}
      {showList && (
        <ul
          className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg ring-1 ring-black/5"
          role="listbox"
        >
          {items.map((item, i) => (
            <li key={`${i}-${item.slice(0, 48)}`}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm text-gray-800 hover:bg-primary-50"
                onMouseDown={e => {
                  e.preventDefault()
                  onChange(item)
                  setOpen(false)
                }}
              >
                {item.length > 120 ? `${item.slice(0, 120)}…` : item}
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && loading && !showList && (
        <p className="mt-1 text-xs text-gray-400">Carregando sugestões…</p>
      )}
    </div>
  )
}
