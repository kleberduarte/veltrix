'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Alias como no sistema-cadastro: /vendas → PDV */
export default function VendasRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/pdv')
  }, [router])
  return null
}
