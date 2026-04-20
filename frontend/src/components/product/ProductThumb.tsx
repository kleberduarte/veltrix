'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

type Props = {
  imagemUrl?: string | null
  /** Largura/altura em px */
  size?: number
  className?: string
}

/** Miniatura para listagens e modais; fallback se URL inválida ou erro de carga. Usa next/image com unoptimized para qualquer origem (CDN ou /files da API). */
export default function ProductThumb({ imagemUrl, size = 40, className = '' }: Props) {
  const [failed, setFailed] = useState(false)
  const u = imagemUrl?.trim()
  const ok = Boolean(u && /^https?:\/\//i.test(u) && !failed)

  useEffect(() => {
    setFailed(false)
  }, [u])

  if (!ok) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-lg bg-gray-100 text-gray-400 ${className}`}
        style={{ width: size, height: size }}
        aria-hidden
      >
        📦
      </span>
    )
  }

  return (
    <Image
      src={u!}
      alt=""
      width={size}
      height={size}
      unoptimized
      className={`rounded-lg object-cover bg-gray-100 ${className}`}
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  )
}
