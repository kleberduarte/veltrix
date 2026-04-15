'use client'

import { useEffect, useState } from 'react'
import { dialogEvents } from '@/lib/dialogs'

type AlertState = {
  title: string
  message: string
}

type ConfirmState = AlertState & {
  resolve: (value: boolean) => void
}

export default function GlobalDialogs() {
  const [alertState, setAlertState] = useState<AlertState | null>(null)
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)

  useEffect(() => {
    const onAlert = (ev: Event) => {
      const custom = ev as CustomEvent<{ title?: string; message: string }>
      setAlertState({
        title: custom.detail.title || 'Aviso',
        message: custom.detail.message,
      })
    }

    const onConfirm = (ev: Event) => {
      const custom = ev as CustomEvent<{ title?: string; message: string; resolve: (value: boolean) => void }>
      setConfirmState({
        title: custom.detail.title || 'Confirmar ação',
        message: custom.detail.message,
        resolve: custom.detail.resolve,
      })
    }

    window.addEventListener(dialogEvents.ALERT_EVENT, onAlert)
    window.addEventListener(dialogEvents.CONFIRM_EVENT, onConfirm)
    return () => {
      window.removeEventListener(dialogEvents.ALERT_EVENT, onAlert)
      window.removeEventListener(dialogEvents.CONFIRM_EVENT, onConfirm)
    }
  }, [])

  function closeAlert() {
    setAlertState(null)
    window.dispatchEvent(new Event(`${dialogEvents.ALERT_EVENT}:closed`))
  }

  function confirm(value: boolean) {
    if (!confirmState) return
    confirmState.resolve(value)
    setConfirmState(null)
  }

  return (
    <>
      {alertState && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900">{alertState.title}</h3>
            <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">{alertState.message}</p>
            <div className="mt-6 flex justify-end">
              <button type="button" onClick={closeAlert} className="btn-primary min-w-24 py-2.5 px-5">
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmState && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900">{confirmState.title}</h3>
            <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">{confirmState.message}</p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => confirm(false)} className="btn-secondary flex-1 py-2.5">
                Cancelar
              </button>
              <button type="button" onClick={() => confirm(true)} className="btn-primary flex-1 py-2.5">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
