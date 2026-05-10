'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ParametroEmpresa } from '@/types'
import { parametrosEmpresaService } from '@/services/parametrosEmpresaService'
import { isAuthenticated } from '@/lib/auth'
import { normalizeLogoUrl } from '@/lib/logoUrl'

const ParametroContext = createContext<ParametroEmpresa | null>(null)

export function ParametroProvider({ children }: { children: ReactNode }) {
  const [parametro, setParametro] = useState<ParametroEmpresa | null>(null)

  useEffect(() => {
    if (!isAuthenticated()) return
    parametrosEmpresaService
      .get()
      .then((p) => {
        if (!p) {
          setParametro(null)
          return
        }
        setParametro({ ...p, logoUrl: normalizeLogoUrl(p.logoUrl) || null })
      })
      .catch(() => {})
  }, [])

  return (
    <ParametroContext.Provider value={parametro}>
      {children}
    </ParametroContext.Provider>
  )
}

export function useParametro() {
  return useContext(ParametroContext)
}
