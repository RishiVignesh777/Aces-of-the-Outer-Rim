/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { getDamageSeverityStage, getCanopyFractureProps } from '../game/damageEffects.ts';
import { AlertTriangle, Flame, Zap } from 'lucide-react';

interface StructuralDamageOverlayProps {
  hull: number;
  maxHull: number;
  isCockpitView: boolean;
}

export const StructuralDamageOverlay: React.FC<StructuralDamageOverlayProps> = ({
  hull,
  maxHull,
  isCockpitView,
}) => {
  const hullPct = Math.max(0, Math.min(100, Math.round((hull / maxHull) * 100)));
  const severityStage = getDamageSeverityStage(hull, maxHull);
  const fracture = useMemo(() => getCanopyFractureProps(hull, maxHull), [hull, maxHull]);

  if (severityStage === 'PRISTINE' && hullPct > 85) {
    return null;
  }

  const damageRatio = (100 - hullPct) / 100;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-20">
      {/* 1. CRITICAL EMERGENCY CABIN PERIPHERAL WARNING VIGNETTE */}
      {fracture.alarmStrobeActive && (
        <div
          className="absolute inset-0 animate-pulse transition-opacity duration-300"
          style={{
            background:
              'radial-gradient(circle at center, transparent 45%, rgba(225, 29, 72, 0.18) 75%, rgba(159, 18, 57, 0.45) 100%)',
          }}
        />
      )}

      {/* 2. CANOPY GLASS CRACKS & SPIDERWEB FRACTURES (Diegetic First-Person View) */}
      {isCockpitView && fracture.crackLevel > 0 && (
        <svg
          viewBox="0 0 1440 900"
          className="absolute inset-0 w-full h-full preserve-3d"
          style={{ opacity: fracture.opacity }}
        >
          <defs>
            <filter id="glassRefract" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#38bdf8" floodOpacity="0.7" />
            </filter>
            <linearGradient id="crackGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="critCrackGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="40%" stopColor="#fbbf24" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.6" />
            </linearGradient>
          </defs>

          {/* LEVEL 1: Minor Peripheral Glass Fractures (Top-Right Canopy Corner) */}
          {fracture.crackLevel >= 1 && (
            <g stroke="url(#crackGlow)" strokeWidth="1.6" fill="none" filter="url(#glassRefract)">
              {/* Corner fracture node #1 */}
              <path d="M 1440 40 L 1320 95 L 1240 110 L 1190 70 M 1320 95 L 1360 170 L 1310 240 M 1240 110 L 1210 180" />
              <path d="M 1340 140 L 1290 155 L 1260 210" strokeWidth="1.0" opacity="0.7" />
              {/* Top-left stress line */}
              <path d="M 0 60 L 90 90 L 160 80 L 220 120 M 90 90 L 120 160" />
            </g>
          )}

          {/* LEVEL 2: Moderate Spiderweb Impact Fracture (Mid-Left Windshield) */}
          {fracture.crackLevel >= 2 && (
            <g stroke="url(#crackGlow)" strokeWidth="2.0" fill="none" filter="url(#glassRefract)">
              {/* Main impact point at (320, 360) */}
              <circle cx="320" cy="360" r="4.5" fill="#ffffff" />
              <circle cx="320" cy="360" r="16" strokeDasharray="3 3" opacity="0.6" strokeWidth="1" />
              <circle cx="320" cy="360" r="38" strokeDasharray="5 4" opacity="0.4" strokeWidth="1" />

              {/* Radial branching cracks radiating across the canopy */}
              <path d="M 320 360 L 210 320 L 120 340 L 30 310" />
              <path d="M 320 360 L 260 440 L 210 520 L 160 590" />
              <path d="M 320 360 L 410 300 L 520 280 L 610 310 L 710 270" />
              <path d="M 320 360 L 390 420 L 480 470 L 560 450" />
              <path d="M 320 360 L 340 240 L 300 160 L 330 90" />

              {/* Secondary micro-spiderweb connectors */}
              <path
                d="M 270 335 L 290 380 L 350 395 L 365 330 L 300 310 Z"
                strokeWidth="1.2"
                opacity="0.8"
              />
              <path
                d="M 230 325 L 245 400 L 375 425 L 430 330 L 330 260 Z"
                strokeWidth="1.0"
                opacity="0.6"
              />
            </g>
          )}

          {/* LEVEL 3: Catastrophic Canopy Structural Shatter (Center-Right Visor) */}
          {fracture.crackLevel >= 3 && (
            <g stroke="url(#critCrackGlow)" strokeWidth="2.5" fill="none" filter="url(#glassRefract)">
              {/* Massive projectile impact point at (1040, 420) */}
              <circle cx="1040" cy="420" r="7" fill="#ffffff" />
              <circle cx="1040" cy="420" r="28" strokeDasharray="6 3" strokeWidth="1.8" opacity="0.8" />
              <circle cx="1040" cy="420" r="65" strokeDasharray="8 5" strokeWidth="1.4" opacity="0.6" />

              {/* Jagged deep fissures extending across pilot reticle space */}
              <path d="M 1040 420 L 910 380 L 820 400 L 740 370 L 660 390" />
              <path d="M 1040 420 L 980 530 L 910 630 L 870 740" />
              <path d="M 1040 420 L 1160 340 L 1280 320 L 1400 290" />
              <path d="M 1040 420 L 1120 520 L 1220 590 L 1310 680" />
              <path d="M 1040 420 L 1020 280 L 980 190 L 1010 80" />

              {/* Stress fracture spiderweb web rings */}
              <path
                d="M 970 395 L 1000 480 L 1090 475 L 1110 375 L 1025 340 Z"
                strokeWidth="1.6"
                opacity="0.9"
              />
              <path
                d="M 900 380 L 940 540 L 1130 535 L 1180 335 L 1010 260 Z"
                strokeWidth="1.2"
                opacity="0.75"
              />

              {/* Prismatic glass shard triangles */}
              <polygon
                points="1025,410 990,430 1010,450"
                fill="rgba(56, 189, 248, 0.25)"
                stroke="#38bdf8"
                strokeWidth="1.5"
              />
              <polygon
                points="1055,405 1085,420 1065,445"
                fill="rgba(244, 63, 94, 0.25)"
                stroke="#f43f5e"
                strokeWidth="1.5"
              />
            </g>
          )}
        </svg>
      )}

      {/* 3. ELECTRICAL CONDUIT SHORT-CIRCUIT SPARKS ON DASHBOARD */}
      {hullPct < 50 && (
        <div className="absolute inset-x-0 bottom-0 h-44 overflow-hidden pointer-events-none">
          {/* Conduit arc #1 (Left Dash) */}
          <div
            className="absolute left-[18%] bottom-16 w-32 h-20 opacity-80"
            style={{
              animation: 'conduitSpark 2.4s infinite steps(1)',
            }}
          >
            <svg viewBox="0 0 100 60" className="w-full h-full">
              <path
                d="M 10 50 Q 30 15 50 35 T 90 10"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="drop-shadow-[0_0_8px_#38bdf8]"
              />
              <circle cx="50" cy="35" r="3" fill="#ffffff" />
            </svg>
          </div>

          {/* Conduit arc #2 (Right Dash) */}
          {hullPct < 30 && (
            <div
              className="absolute right-[22%] bottom-14 w-28 h-20 opacity-90"
              style={{
                animation: 'conduitSpark 1.8s infinite steps(1) 0.6s',
              }}
            >
              <svg viewBox="0 0 100 60" className="w-full h-full">
                <path
                  d="M 5 15 Q 40 45 60 20 T 95 45"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="drop-shadow-[0_0_8px_#fbbf24]"
                />
                <circle cx="60" cy="20" r="3" fill="#ffffff" />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* 4. DIEGETIC COCKPIT WARNING BANNER (Center-Top when Hull < 35%) */}
      {hullPct < 35 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center space-x-3 bg-rose-950/90 border-2 border-rose-500 text-rose-200 px-4 py-1.5 shadow-[0_0_25px_rgba(244,63,94,0.6)] animate-pulse font-mono text-xs">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <div className="flex flex-col text-left">
            <span className="font-bold tracking-widest text-white">
              ⚠ WARNING: STRUCTURAL INTEGRITY FAILURE ({hullPct}%)
            </span>
            <span className="text-[10px] text-rose-300">
              CANOPY SEAL COMPROMISED · STABILIZERS OSCILLATING
            </span>
          </div>
        </div>
      )}

      {/* 5. CRT / PHOSPHOR SCANLINE STUTTER WHEN CRITICAL */}
      {hullPct < 40 && (
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.45) 1px, transparent 1px, transparent 3px)',
          }}
        />
      )}

      {/* Keyframe animation for conduit sparks */}
      <style>{`
        @keyframes conduitSpark {
          0%, 94%, 100% { opacity: 0; }
          95% { opacity: 0.9; transform: scale(1.1) rotate(4deg); }
          96% { opacity: 0.1; }
          97% { opacity: 1; transform: scale(0.9) rotate(-3deg); }
          98% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};
