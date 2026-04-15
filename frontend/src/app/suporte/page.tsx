'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { parametrosEmpresaService } from '@/services/parametrosEmpresaService'
import { ParametroEmpresa } from '@/types'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'

export default function SuportePage() {
  const router = useRouter()
  const [p, setP] = useState<ParametroEmpresa | null | undefined>(undefined)

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return }
    parametrosEmpresaService.get().then(setP).catch(() => setP(null))
  }, [router])

  const email = p?.suporteEmail?.trim()
  const wa = p?.suporteWhatsapp?.trim()

  return (
    <AppLayout title="Suporte">
      <div className="max-w-xl space-y-6">
        <p className="text-gray-600">
          Canais configurados nos <strong>Parâmetros da empresa</strong> (como no sistema-cadastro). Se estiver vazio, preencha em Parâmetros.
        </p>

        {p === undefined ? (
          <p className="text-gray-400">Carregando...</p>
        ) : (
          <div className="card space-y-4">
            {email ? (
              <a href={`mailto:${email}`} className="flex items-center gap-3 text-primary-700 hover:underline text-lg">
                <span className="text-2xl">✉️</span>
                {email}
              </a>
            ) : (
              <p className="text-gray-500">E-mail de suporte não configurado.</p>
            )}
            {wa ? (
              <a
                href={`https://wa.me/${wa.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-green-700 hover:underline text-lg"
              >
                <span className="text-2xl">💬</span>
                WhatsApp: {wa}
              </a>
            ) : (
              <p className="text-gray-500">WhatsApp não configurado.</p>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
