import React, { useState } from 'react';

export const EarthSatellite3D: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative flex flex-col items-center justify-center select-none group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="Copernicus Sentinel Constellation Live Orbit Simulation"
    >
      <style>{`
        @keyframes earthDrift {
          0% { transform: translateX(0px); }
          100% { transform: translateX(-160px); }
        }

        @keyframes orbitMotion {
          0% {
            transform: translate(65px, -18px) rotate(-22deg) scale(1.15);
            z-index: 30;
            opacity: 1;
          }
          25% {
            transform: translate(32px, 22px) rotate(-10deg) scale(1.28);
            z-index: 30;
            opacity: 1;
          }
          48% {
            transform: translate(-55px, 14px) rotate(15deg) scale(1.0);
            z-index: 30;
            opacity: 0.95;
          }
          50% {
            transform: translate(-65px, 6px) rotate(22deg) scale(0.92);
            z-index: 5;
            opacity: 0.75;
          }
          75% {
            transform: translate(-20px, -28px) rotate(10deg) scale(0.72);
            z-index: 5;
            opacity: 0.45;
          }
          98% {
            transform: translate(55px, -24px) rotate(-18deg) scale(0.98);
            z-index: 5;
            opacity: 0.85;
          }
          100% {
            transform: translate(65px, -18px) rotate(-22deg) scale(1.15);
            z-index: 30;
            opacity: 1;
          }
        }

        @keyframes signalPulse {
          0% { transform: scale(0.6); opacity: 0.9; }
          100% { transform: scale(2.2); opacity: 0; }
        }

        @keyframes atmosphereGlow {
          0%, 100% { filter: drop-shadow(0 0 12px rgba(56, 189, 248, 0.45)); }
          50% { filter: drop-shadow(0 0 20px rgba(14, 165, 233, 0.75)); }
        }

        @keyframes orbitRingTilt {
          0%, 100% { transform: rotate(-24deg) scaleY(0.48); }
          50% { transform: rotate(-22deg) scaleY(0.50); }
        }
      `}</style>

      {/* 3D Sphere & Orbit Scene Container */}
      <div className="relative w-36 h-36 flex items-center justify-center">
        {/* Background Ambient Cosmic Glow */}
        <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-xl scale-125 pointer-events-none"></div>

        {/* 3D Elliptical Orbit Track Ring */}
        <div
          className="absolute w-44 h-44 rounded-full border border-dashed border-cyan-400/40 pointer-events-none transition-all duration-700"
          style={{
            animation: 'orbitRingTilt 8s ease-in-out infinite',
            boxShadow: '0 0 15px rgba(56, 189, 248, 0.15)'
          }}
        ></div>

        {/* Orbit Back-plane Depth Shadow */}
        <div
          className="absolute w-40 h-40 rounded-full border border-cyan-500/15 pointer-events-none"
          style={{
            transform: 'rotate(-24deg) scaleY(0.48)',
          }}
        ></div>

        {/* ─── Earth Globe ─── */}
        <div
          className="relative w-24 h-24 rounded-full overflow-hidden shadow-2xl z-10"
          style={{
            animation: 'atmosphereGlow 5s ease-in-out infinite',
            background: 'radial-gradient(circle at 32% 28%, #1e40af 0%, #0369a1 40%, #0c4a6e 75%, #021a30 100%)',
            boxShadow: 'inset -8px -8px 20px rgba(2, 6, 23, 0.9), inset 6px 6px 14px rgba(125, 211, 252, 0.6), 0 0 22px rgba(14, 165, 233, 0.4)'
          }}
        >
          {/* Atmosphere Highlight Shading */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-cyan-400/10 to-sky-200/25 pointer-events-none z-20"></div>

          {/* Continents Vector Texture (Drifting across globe) */}
          <svg
            className="absolute top-0 left-0 w-[320px] h-24 opacity-85 z-10"
            viewBox="0 0 320 96"
            style={{
              animation: isHovered ? 'earthDrift 12s linear infinite' : 'earthDrift 22s linear infinite',
              willChange: 'transform'
            }}
          >
            <defs>
              <linearGradient id="continentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="45%" stopColor="#15803d" />
                <stop offset="100%" stopColor="#166534" />
              </linearGradient>
            </defs>

            {/* Continuous repeating Landmass Shapes */}
            <g fill="url(#continentGrad)" stroke="#14532d" strokeWidth="0.5">
              {/* India & South Asia */}
              <path d="M 46,24 Q 54,28 58,40 Q 52,55 48,60 Q 42,50 40,38 Z" />
              <path d="M 48,22 Q 62,20 72,28 Q 68,36 58,34 Q 52,28 48,22 Z" />
              {/* Eurasia / Middle East */}
              <path d="M 12,18 Q 28,15 38,25 Q 32,38 22,34 Q 15,28 12,18 Z" />
              <path d="M 30,38 Q 38,36 42,45 Q 36,48 30,38 Z" />
              {/* Africa */}
              <path d="M 15,35 Q 26,35 28,48 Q 25,68 18,72 Q 10,65 12,48 Z" />
              {/* Southeast Asia & Islands */}
              <circle cx="68" cy="50" r="3.5" />
              <circle cx="76" cy="55" r="4.0" />
              <circle cx="84" cy="62" r="3.0" />

              {/* Americas */}
              <path d="M 108,18 Q 124,15 130,30 Q 120,40 114,35 Q 106,28 108,18 Z" />
              <path d="M 118,42 Q 132,48 128,68 Q 120,74 116,62 Q 112,50 118,42 Z" />

              {/* Repetition Block for seamless infinite scroll */}
              {/* India & South Asia 2 */}
              <path d="M 206,24 Q 214,28 218,40 Q 212,55 208,60 Q 202,50 200,38 Z" />
              <path d="M 208,22 Q 222,20 232,28 Q 228,36 218,34 Q 212,28 208,22 Z" />
              {/* Eurasia / Middle East 2 */}
              <path d="M 172,18 Q 188,15 198,25 Q 192,38 182,34 Q 175,28 172,18 Z" />
              <path d="M 190,38 Q 198,36 202,45 Q 196,48 190,38 Z" />
              {/* Africa 2 */}
              <path d="M 175,35 Q 186,35 188,48 Q 185,68 178,72 Q 170,65 172,48 Z" />
              {/* Southeast Asia 2 */}
              <circle cx="228" cy="50" r="3.5" />
              <circle cx="236" cy="55" r="4.0" />
              <circle cx="244" cy="62" r="3.0" />

              {/* Americas 2 */}
              <path d="M 268,18 Q 284,15 290,30 Q 280,40 274,35 Q 266,28 268,18 Z" />
              <path d="M 278,42 Q 292,48 288,68 Q 280,74 276,62 Q 272,50 278,42 Z" />
            </g>

            {/* Cloud Layer (subtle transparent wisps) */}
            <path
              d="M 20,22 Q 40,18 60,25 Q 85,20 110,24 Q 140,18 170,22 Q 200,26 230,20 Q 260,24 290,20"
              fill="none"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M 10,64 Q 35,58 70,66 Q 105,60 140,65 Q 180,58 220,64 Q 255,60 295,65"
              fill="none"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
          </svg>

          {/* Deep Shadow on bottom-right (Spherical 3D shading) */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none z-20"
            style={{
              background: 'radial-gradient(circle at 75% 78%, rgba(2, 6, 23, 0.88) 15%, rgba(2, 6, 23, 0.4) 50%, transparent 80%)'
            }}
          ></div>
        </div>

        {/* ─── 3D Orbiting Satellite Model ─── */}
        <div
          className="absolute pointer-events-none"
          style={{
            animation: isHovered ? 'orbitMotion 5s ease-in-out infinite' : 'orbitMotion 9s ease-in-out infinite',
            willChange: 'transform, z-index, opacity'
          }}
        >
          {/* Signal Pulse radiating from Satellite towards Earth */}
          <div
            className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full border border-cyan-400 bg-cyan-400/20"
            style={{ animation: 'signalPulse 2s cubic-bezier(0, 0.2, 0.8, 1) infinite' }}
          ></div>

          {/* Detailed Sentinel Satellite SVG */}
          <svg className="w-8 h-8 filter drop-shadow-md" viewBox="0 0 40 40">
            <defs>
              <linearGradient id="solarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>
              <linearGradient id="satBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="70%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>
            </defs>

            {/* Left Solar Panel Array */}
            <rect x="2" y="16" width="12" height="8" rx="1" fill="url(#solarGrad)" stroke="#0c4a6e" strokeWidth="0.75" />
            <line x1="6" y1="16" x2="6" y2="24" stroke="#7dd3fc" strokeWidth="0.5" />
            <line x1="10" y1="16" x2="10" y2="24" stroke="#7dd3fc" strokeWidth="0.5" />
            <line x1="2" y1="20" x2="14" y2="20" stroke="#7dd3fc" strokeWidth="0.5" />

            {/* Right Solar Panel Array */}
            <rect x="26" y="16" width="12" height="8" rx="1" fill="url(#solarGrad)" stroke="#0c4a6e" strokeWidth="0.75" />
            <line x1="30" y1="16" x2="30" y2="24" stroke="#7dd3fc" strokeWidth="0.5" />
            <line x1="34" y1="16" x2="34" y2="24" stroke="#7dd3fc" strokeWidth="0.5" />
            <line x1="26" y1="20" x2="38" y2="20" stroke="#7dd3fc" strokeWidth="0.5" />

            {/* Central Satellite Chassis */}
            <rect x="15" y="14" width="10" height="12" rx="1.5" fill="url(#satBodyGrad)" stroke="#334155" strokeWidth="0.8" />

            {/* Gold SAR Instrument & Lens */}
            <circle cx="20" cy="20" r="2.5" fill="#eab308" stroke="#ca8a04" strokeWidth="0.5" />
            <circle cx="20" cy="20" r="1.2" fill="#0f172a" />

            {/* Dish / Telemetry Antenna */}
            <path d="M 20,14 L 20,8" stroke="#cbd5e1" strokeWidth="1" strokeLinecap="round" />
            <path d="M 17,9 Q 20,6 23,9" fill="none" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" />

            {/* Flashing Telemetry Beacon */}
            <circle cx="20" cy="6" r="1.2" fill="#38bdf8" className="animate-ping" />
          </svg>
        </div>
      </div>
    </div>
  );
};
