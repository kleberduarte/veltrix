'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { authService } from '@/services/authService'
import { setDocumentFavicon } from '@/lib/empresaFavicon'
import LoginRegisterExperience, { type LoginBrand } from '@/components/auth/LoginRegisterExperience'

export default function CompanyAccessPage() {
  const params = useParams<{ token: string | string[] }>()
  const token = typeof params.token === 'string' ? params.token : params.token?.[0] ?? ''

  const [loadingBrand, setLoadingBrand] = useState(true)
  const [brandError, setBrandError] = useState('')
  const [brand, setBrand] = useState<LoginBrand | null>(null)

  useEffect(() => {
    if (!token) {
      setBrandError('Link inválido.')
      setLoadingBrand(false)
      return
    }
    authService
      .getCompanyAccessInfo(token)
      .then((info) => {
        setBrand({
          nomeEmpresa: info.nomeEmpresa || info.companyName,
          logoUrl: info.logoUrl,
          corPrimaria: info.corPrimaria,
          corSecundaria: info.corSecundaria,
          corBotao: info.corBotao,
          corBotaoTexto: info.corBotaoTexto,
        })
      })
      .catch(() => setBrandError('Link inválido ou expirado.'))
      .finally(() => setLoadingBrand(false))
  }, [token])

  useEffect(() => {
    if (loadingBrand) return
    if (brand?.logoUrl) {
      setDocumentFavicon(brand.logoUrl)
    } else {
      setDocumentFavicon(null)
    }
    return () => {
      setDocumentFavicon(null)
    }
  }, [brand?.logoUrl, loadingBrand, brand])

  return (
    <LoginRegisterExperience
      variant="company"
      brand={brand}
      brandLoading={loadingBrand}
      brandError={brandError}
    />
  )
}
