'use client'

type DialogPayload = {
  title?: string
  message: string
}

type ConfirmDialogPayload = DialogPayload & {
  resolve: (value: boolean) => void
}

const ALERT_EVENT = 'veltrix:alert'
const CONFIRM_EVENT = 'veltrix:confirm'

export function appAlert(message: string, title = 'Aviso'): Promise<void> {
  return new Promise(resolve => {
    window.dispatchEvent(new CustomEvent<DialogPayload>(ALERT_EVENT, { detail: { title, message } }))
    const onClose = () => {
      window.removeEventListener(`${ALERT_EVENT}:closed`, onClose)
      resolve()
    }
    window.addEventListener(`${ALERT_EVENT}:closed`, onClose)
  })
}

export function appConfirm(message: string, title = 'Confirmar ação'): Promise<boolean> {
  return new Promise(resolve => {
    const detail: ConfirmDialogPayload = {
      title,
      message,
      resolve,
    }
    window.dispatchEvent(new CustomEvent<ConfirmDialogPayload>(CONFIRM_EVENT, { detail }))
  })
}

export const dialogEvents = {
  ALERT_EVENT,
  CONFIRM_EVENT,
}
