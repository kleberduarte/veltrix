import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  const size = 180
  const stroke = 16

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 40,
          background: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 55%, #1e3a8a 100%)',
        }}
      >
        <svg width={size} height={size} viewBox="0 0 180 180" fill="none">
          <path
            d="M50 42 L90 138 L130 42"
            stroke="#ffffff"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    {
      width: size,
      height: size,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
  )
}
