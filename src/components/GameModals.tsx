/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Trophy, Skull, Play, RotateCcw, Home, Wrench } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenHangar: () => void;
  onTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onOpenHangar,
  onTitle,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 font-mono select-none">
      <div className="w-full max-w-md bg-slate-950 border border-cyan-800 p-6 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
        <div className="flex items-center space-x-2 text-cyan-400 font-bold mb-4 pb-2 border-b border-cyan-900/60">
          <span className="w-2.5 h-2.5 bg-cyan-400"></span>
          <span>SIMULATION PAUSED — TACTICAL STANDBY</span>
        </div>

        <p className="text-xs text-slate-300 font-sans mb-6 leading-relaxed">
          Flight telemetry suspended. Enemy interceptors and dreadnought fire frozen in orbit.
        </p>

        <div className="space-y-2.5">
          <button
            onClick={onResume}
            className="w-full flex items-center justify-center space-x-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 text-xs tracking-wider transition cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>RESUME COMBAT</span>
          </button>
          <button
            onClick={onRestart}
            className="w-full flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-bold py-2.5 text-xs tracking-wider transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART SORTIE</span>
          </button>
          <button
            onClick={onOpenHangar}
            className="w-full flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-bold py-2.5 text-xs tracking-wider transition cursor-pointer"
          >
            <Wrench className="w-4 h-4" />
            <span>HANGAR LOADOUT</span>
          </button>
          <button
            onClick={onTitle}
            className="w-full flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 font-bold py-2.5 text-xs tracking-wider transition cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>EXIT TO TITLE</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface VictoryModalProps {
  stats: {
    timeSec: number;
    enemiesKilled: number;
    accuracy: number;
  };
  onPlayAgain: () => void;
  onOpenHangar: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  stats,
  onPlayAgain,
  onOpenHangar,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 font-mono select-none">
      <div className="w-full max-w-lg bg-slate-950 border-2 border-cyan-400 p-8 shadow-[0_0_50px_rgba(6,182,212,0.4)]">
        <div className="flex items-center space-x-3 text-cyan-400 font-bold mb-2">
          <Trophy className="w-6 h-6 text-amber-400" />
          <h2 className="text-lg sm:text-xl tracking-widest">DREADNOUGHT NEUTRALIZED</h2>
        </div>
        <p className="text-xs text-slate-300 font-sans mb-6">
          The Flagship Leviathan has broken up across the planetary ring system. Imperial escort fleet is in full disarray!
        </p>

        {/* Mastery Metrics */}
        <div className="grid grid-cols-3 gap-3 bg-slate-900/80 border border-slate-800 p-4 mb-6 text-center">
          <div>
            <div className="text-xs text-slate-400 mb-1">SORTIE TIME</div>
            <div className="text-lg font-bold text-cyan-300 tabular-nums">
              {Math.floor(stats.timeSec / 60)}:{(stats.timeSec % 60).toString().padStart(2, '0')}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">INTERCEPTORS</div>
            <div className="text-lg font-bold text-amber-400 tabular-nums">
              {stats.enemiesKilled} DOWN
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">ACCURACY</div>
            <div className="text-lg font-bold text-emerald-400 tabular-nums">
              {stats.accuracy}%
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onOpenHangar}
            className="flex-1 py-3 bg-slate-900 border border-cyan-800 hover:border-cyan-400 text-cyan-300 font-bold text-xs tracking-wider transition cursor-pointer"
          >
            MODIFY HANGAR
          </button>
          <button
            data-start="true"
            onClick={onPlayAgain}
            className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wider transition shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer"
          >
            NEXT SORTIE
          </button>
        </div>
      </div>
    </div>
  );
};

interface GameOverModalProps {
  stats: {
    timeSec: number;
    subsystemsDestroyed: number;
  };
  onTryAgain: () => void;
  onOpenHangar: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  onTryAgain,
  onOpenHangar,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 font-mono select-none">
      <div className="w-full max-w-lg bg-slate-950 border-2 border-rose-500 p-8 shadow-[0_0_50px_rgba(244,63,94,0.4)]">
        <div className="flex items-center space-x-3 text-rose-500 font-bold mb-2">
          <Skull className="w-6 h-6" />
          <h2 className="text-lg sm:text-xl tracking-widest">HULL BREACH — EJECT POD DEPLOYED</h2>
        </div>
        <p className="text-xs text-slate-300 font-sans mb-6">
          Your starfighter took fatal structural damage in the crossfire. Emergency rescue beacon activated in the Outer Rim asteroid field.
        </p>

        {/* Progress Metrics */}
        <div className="grid grid-cols-2 gap-3 bg-slate-900/80 border border-slate-800 p-4 mb-6 text-center">
          <div>
            <div className="text-xs text-slate-400 mb-1">TIME SURVIVED</div>
            <div className="text-lg font-bold text-rose-300 tabular-nums">
              {Math.floor(stats.timeSec / 60)}:{(stats.timeSec % 60).toString().padStart(2, '0')}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">SUBSYSTEMS BROKEN</div>
            <div className="text-lg font-bold text-amber-400 tabular-nums">
              {stats.subsystemsDestroyed} / 9
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onOpenHangar}
            className="flex-1 py-3 bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 font-bold text-xs tracking-wider transition cursor-pointer"
          >
            REFIT IN HANGAR
          </button>
          <button
            data-start="true"
            onClick={onTryAgain}
            className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs tracking-wider transition shadow-[0_0_20px_rgba(244,63,94,0.4)] cursor-pointer"
          >
            TRY AGAIN
          </button>
        </div>
      </div>
    </div>
  );
};
