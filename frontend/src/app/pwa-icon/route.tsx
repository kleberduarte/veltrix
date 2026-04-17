import { ImageResponse } from 'next/og'

export const runtime = 'edge'

function clampSize(raw: number) {
  if (Number.isNaN(raw)) return 512
  return Math.min(1024, Math.max(128, raw))
}

function Icon({ size, maskable }: { size: number; maskable: boolean }) {
  const pad = maskable ? Math.round(size * 0.18) : Math.round(size * 0.12)
  const stroke = Math.max(6, Math.round(size * 0.08))
  const iconArea = size - pad * 2
  const vTop = pad + Math.round(iconArea * 0.2)
  const vMidY = pad + Math.round(iconArea * 0.78)
  const vLeftX = pad + Math.round(iconArea * 0.22)
  const vMidX = pad + Math.round(iconArea * 0.5)
  const vRightX = pad + Math.round(iconArea * 0.78)

  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 55%, #1e3a8a 100%)',
        borderRadius: maskable ? Math.round(size * 0.22) : Math.round(size * 0.28),
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
        <path
          d={`M ${vLeftX} ${vTop} L ${vMidX} ${vMidY} L ${vRightX} ${vTop}`}
          stroke="#ffffff"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const size = clampSize(Number(searchParams.get('size') ?? '512'))
  const maskable = searchParams.get('maskable') === '1'

  return new ImageResponse(<Icon size={size} maskable={maskable} />, {
    width: size,
    height: size,
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
