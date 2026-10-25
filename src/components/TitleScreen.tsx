/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Rocket, Wrench, Shield, Crosshair, Zap } from 'lucide-react';

interface TitleScreenProps {
  onStart: () => void;
  onOpenHangar: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, onOpenHangar }) => {
  return (
    <div className="absolute inset-0 flex flex-col justify-between p-8 sm:p-12 z-20 pointer-events-none select-none">
      {/* Top Bar Spec Stamp */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 bg-slate-950/80 border border-cyan-900/50 px-4 py-2 text-xs font-mono text-cyan-400 tracking-wider">
          <span className="w-2 h-2 bg-cyan-400"></span>
          <span>OUTER RIM SYSTEM SECTOR 7-G</span>
          <span className="text-slate-500">|</span>
          <span className="text-amber-400">FLAGSHIP LEVIATHAN DETECTED</span>
        </div>

        <div className="hidden sm:flex items-center space-x-4 text-xs font-mono text-slate-400 bg-slate-950/80 border border-slate-800 px-3 py-1.5">
          <span>SQUADRON: SHADOW FLIGHT</span>
          <span className="text-slate-600">/</span>
          <span className="text-cyan-400">TIE DEFECTOR CHASSIS</span>
        </div>
      </div>

      {/* Hero Center Lockup */}
      <div className="max-w-2xl my-auto">
        {/* Bespoke Inline SVG Title Emblem */}
        <div className="mb-4">
          <svg viewBox="0 0 680 130" className="w-full max-w-xl h-auto drop-shadow-[0_0_20px_rgba(6,182,212,0.35)]">
            <defs>
              <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#e0f2fe" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
            </defs>
            {/* Wing / Chevron Emblem Top */}
            <path
              d="M 60 18 L 340 4 L 620 18 L 570 28 L 340 16 L 110 28 Z"
              fill="#06b6d4"
            />
            {/* Stylized High-G Space Title Text */}
            <text
              x="340"
              y="74"
              textAnchor="middle"
              fill="#38bdf8"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="48"
              letterSpacing="8"
            >
              ACES OF THE
            </text>
            <text
              x="340"
              y="118"
              textAnchor="middle"
              fill="#ffffff"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="44"
              letterSpacing="14"
            >
              OUTER RIM
            </text>
          </svg>
        </div>

        <p className="text-sm sm:text-base text-slate-300 font-mono tracking-wide mb-8 max-w-lg leading-relaxed bg-slate-950/60 p-4 border-l-2 border-cyan-500">
          Cinematic single-player space combat simulator. Pilot an agile interceptor with decoupled vector drift, tactical power management, and squad commands against an Imperial Dreadnought.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center gap-4 pointer-events-auto">
          <button
            data-start="true"
            onClick={onStart}
            className="flex items-center space-x-3 bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-bold px-8 py-4 transition shadow-[0_0_25px_rgba(6,182,212,0.5)] border border-cyan-300 cursor-pointer text-sm sm:text-base tracking-widest"
          >
            <Rocket className="w-5 h-5" />
            <span>LAUNCH SORTIE</span>
            <span className="text-xs opacity-75 font-mono ml-2">[SPACE / ENTER]</span>
          </button>

          <button
            onClick={onOpenHangar}
            className="flex items-center space-x-2 bg-slate-900/90 hover:bg-slate-800 active:scale-95 text-cyan-300 px-6 py-4 transition border border-cyan-800/80 cursor-pointer text-sm font-semibold tracking-wider hover:border-cyan-400"
          >
            <Wrench className="w-4 h-4 text-cyan-400" />
            <span>HANGAR CUSTOMIZATION</span>
          </button>
        </div>
      </div>

      {/* Bottom Flat Control Hint Line */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-mono text-slate-400 bg-slate-950/90 border-t border-slate-800 p-3">
        <div className="flex items-center space-x-2">
          <span className="text-cyan-400 font-bold">FLIGHT CONTROLS:</span>
          <span>W/S Throttle · A/D Strafe · Mouse Pitch/Yaw · Shift Boost · Z Decoupled Drift · 1-4 Power · F1-F3 Squad · Space Fire</span>
        </div>
        <div className="mt-2 sm:mt-0 text-slate-500">
          OFFLINE COMBAT READY · v1.4
        </div>
      </div>
    </div>
  );
};
