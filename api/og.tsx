import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default function handler() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          padding: '60px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, #2563eb 0%, #0ea5e9 100%)',
            display: 'flex',
          }}
        />

        {/* Logo + Title */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              background: '#2563eb',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '24px',
              fontSize: '44px',
              boxShadow: '0 8px 32px rgba(37,99,235,0.4)',
            }}
          >
            🎓
          </div>
          <div style={{ display: 'flex', fontSize: '72px', fontWeight: 'bold' }}>
            <span style={{ color: 'white' }}>Online</span>
            <span style={{ color: '#3b82f6' }}>curri</span>
          </div>
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '20px',
            display: 'flex',
          }}
        >
          AI 기반 온라인 강좌 커리큘럼 관리
        </div>

        <div
          style={{
            fontSize: '24px',
            color: '#94a3b8',
            lineHeight: 1.6,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <span>URL · 텍스트 · 문서에서 커리큘럼을 자동 추출하고</span>
          <span>AI 튜터와 함께 학습을 관리하세요</span>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '50px',
            background: 'linear-gradient(90deg, #2563eb 0%, #0ea5e9 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>
            onlinecurri.vercel.app
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
