import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'AgroLink - Connecting Ethiopian Farmers to Markets'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '80px',
          position: 'relative',
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: '120px',
            height: '120px',
            background: 'white',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '40px',
          }}
        >
          <div style={{ fontSize: '80px' }}>🌱</div>
        </div>

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            color: 'white',
          }}
        >
          <h1
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              margin: 0,
              marginBottom: '20px',
            }}
          >
            AgroLink
          </h1>
          <p
            style={{
              fontSize: '36px',
              margin: 0,
              opacity: 0.9,
              marginBottom: '40px',
            }}
          >
            Connecting Ethiopian Farmers to Markets
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '24px', opacity: 0.8 }}>
            <div>✓ Real-time Market Prices</div>
            <div>✓ Direct Buyer Connection</div>
            <div>✓ Expert Agricultural Advice</div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
