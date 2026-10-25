/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Volume2,
  VolumeX,
  Pause,
  Eye,
  Crosshair,
  ShieldAlert,
  Zap,
  Radio,
  RadioTower,
  Flame,
} from 'lucide-react';
import type { TelemetryData } from '../game/spaceScene.ts';
import type { SquadOrder } from '../game/squad.ts';

interface CockpitOverlayProps {
  telemetry: TelemetryData | null;
  onSetPowerPreset: (preset: 'ENGINES' | 'WEAPONS' | 'SHIELDS' | 'BALANCED') => void;
  onTriggerPowerDump: () => void;
  onTriggerOvercharge: () => void;
  onIssueSquadOrder: (order: SquadOrder) => void;
  onToggleViewMode: () => void;
  onToggleMute: () => void;
  onPause: () => void;
  onCycleTarget: () => void;
  isMuted: boolean;
}

export const CockpitOverlay: React.FC<CockpitOverlayProps> = ({
  telemetry,
  onSetPowerPreset,
  onTriggerPowerDump,
  onTriggerOvercharge,
  onIssueSquadOrder,
  onToggleViewMode,
  onToggleMute,
  onPause,
  onCycleTarget,
  isMuted,
}) => {
  if (!telemetry) return null;

  const hullPct = Math.round((telemetry.hull / telemetry.maxHull) * 100);
  const shieldPct = Math.round((telemetry.shield / telemetry.maxShield) * 100);

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-4 sm:p-6 z-10 font-mono">
      {/* 1. TOP HEADER CLUSTER */}
      <div className="flex items-start justify-between">
        {/* Left: Mission & Dreadnought Assault Phase */}
        <div className="bg-slate-950/85 border border-cyan-900/60 p-3 max-w-sm pointer-events-auto">
          <div className="flex items-center space-x-2 text-xs text-cyan-400 font-bold mb-1">
            <RadioTower className="w-3.5 h-3.5" />
            <span>OPERATION: LEVIATHAN DOWNFALL</span>
          </div>
          <div className="text-[11px] text-slate-300 font-sans font-medium mb-1.5">
            Stage:{' '}
            <span className="text-amber-400 font-bold font-mono">
              {telemetry.dreadnoughtStage === 'STAGE_1_SHIELDS' && '1/4 Deflector Shield Generator Domes'}
              {telemetry.dreadnoughtStage === 'STAGE_2_TURRETS' && '2/4 Heavy Flak Turrets Defense Grid'}
              {telemetry.dreadnoughtStage === 'STAGE_3_ENGINES' && '3/4 Sub-light Ion Engine Reactors'}
              {telemetry.dreadnoughtStage === 'STAGE_4_BRIDGE' && '4/4 Bridge Thermal Exhaust Trench'}
              {telemetry.dreadnoughtStage === 'DESTROYED' && 'FLAGSHIP DESTROYED - FLEET RETREAT'}
            </span>
          </div>

          {/* Dreadnought Overall Hull Bar */}
          <div className="w-full bg-slate-900 h-2 border border-slate-700 overflow-hidden">
            <div
              className="bg-amber-500 h-full transition-all duration-300"
              style={{ width: `${Math.round((telemetry.dreadnoughtHp / telemetry.dreadnoughtMaxHp) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>DREADNOUGHT STRUCTURAL INTEGRITY</span>
            <span className="text-amber-400 font-bold tabular-nums">
              {Math.round((telemetry.dreadnoughtHp / telemetry.dreadnoughtMaxHp) * 100)}%
            </span>
          </div>
        </div>

        {/* Center: Vector Drift & Flight Assist Badge */}
        <div className="hidden sm:flex flex-col items-center">
          <div
            className={`px-3 py-1 border text-xs tracking-wider font-bold transition-all ${
              telemetry.flightAssist
                ? 'bg-slate-950/80 border-cyan-800 text-cyan-300'
                : 'bg-amber-950/90 border-amber-500 text-amber-300 animate-pulse'
            }`}
          >
            {telemetry.flightAssist ? 'FLIGHT ASSIST: COUPLED' : '⚠ FA-OFF: DECOUPLED DRIFT ACTIVE'}
          </div>
          {telemetry.isDrifting && (
            <div className="text-[10px] text-amber-400 mt-1 font-bold">
              DRIFT ANGLE LOCK · REVERSE VECTOR FIRING
            </div>
          )}
        </div>

        {/* Right: Utility Icon Buttons */}
        <div className="flex items-center space-x-2 pointer-events-auto">
          <button
            onClick={onToggleViewMode}
            title="Toggle Cockpit / Pursuit Camera (V)"
            className="p-2 bg-slate-950/80 border border-cyan-900/80 hover:border-cyan-400 text-cyan-300 transition cursor-pointer"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleMute}
            title="Mute / Unmute Audio (M)"
            className="p-2 bg-slate-950/80 border border-cyan-900/80 hover:border-cyan-400 text-cyan-300 transition cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onPause}
            title="Pause Simulation (Esc / P)"
            className="p-2 bg-slate-950/80 border border-cyan-900/80 hover:border-cyan-400 text-cyan-300 transition cursor-pointer"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. CENTER DIEGETIC RETICLE */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
        {/* Reticle SVG */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full text-cyan-400/70">
            {/* Center Pip */}
            <circle cx="50" cy="50" r="2.5" fill="#38bdf8" />
            {/* Inner Ring */}
            <circle cx="50" cy="50" r="18" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
            {/* Outer Brackets */}
            <path d="M 30 50 L 22 50 M 70 50 L 78 50 M 50 30 L 50 22 M 50 70 L 50 78" stroke="currentColor" strokeWidth="1.5" />
          </svg>

          {/* Lead Aim Pip when target locked */}
          {telemetry.targetInfo && (
            <div className="absolute text-[10px] text-amber-400 font-bold tracking-wider -top-6 whitespace-nowrap bg-slate-950/70 px-1 border border-amber-500/40">
              TARGET LOCK · {telemetry.targetInfo.distance}m
            </div>
          )}
        </div>

        {/* Speed Readout underneath reticle */}
        <div className="text-xs text-cyan-300 font-bold tracking-widest mt-1 bg-slate-950/80 px-2 py-0.5 border border-cyan-900/40">
          <span className="tabular-nums text-sm text-cyan-100">{telemetry.speed}</span> M/S
        </div>
      </div>

      {/* 3. TARGET DIAGNOSTIC CARD (Mid Right) */}
      {telemetry.targetInfo && (
        <div className="absolute right-6 top-24 max-w-xs bg-slate-950/85 border border-amber-600/60 p-3 pointer-events-auto">
          <div className="flex items-center justify-between text-xs text-amber-400 font-bold mb-1">
            <span className="truncate">{telemetry.targetInfo.name}</span>
            <button
              onClick={onCycleTarget}
              className="text-[10px] bg-amber-950/60 border border-amber-700 px-1.5 py-0.5 text-amber-300 hover:bg-amber-900 cursor-pointer"
            >
              CYCLE [T]
            </button>
          </div>
          <div className="flex justify-between text-[11px] text-slate-300 mb-1">
            <span>RANGE:</span>
            <span className="text-amber-300 font-bold tabular-nums">{telemetry.targetInfo.distance} M</span>
          </div>
          {/* Target Health Bar */}
          <div className="w-full bg-slate-900 h-2 border border-slate-700 overflow-hidden">
            <div
              className="bg-amber-500 h-full transition-all duration-200"
              style={{ width: `${Math.round((telemetry.targetInfo.hp / telemetry.targetInfo.maxHp) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>TARGET HULL</span>
            <span className="text-amber-400 font-bold tabular-nums">
              {Math.round((telemetry.targetInfo.hp / telemetry.targetInfo.maxHp) * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* 4. BOTTOM CLUSTER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        {/* Left: Ship Vitality (Hull & Deflector Shield) */}
        <div className="bg-slate-950/85 border border-cyan-900/70 p-3.5 pointer-events-auto max-w-sm">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="text-cyan-400">STARFIGHTER INTEGRITY</span>
            <span className="text-slate-400 text-[11px]">COCKPIT TELEMETRY</span>
          </div>

          {/* Shield Bar */}
          <div className="mb-2">
            <div className="flex justify-between text-[11px] mb-0.5">
              <span className="text-cyan-300">DEFLECTOR SHIELDS</span>
              <span className="text-cyan-200 font-bold tabular-nums">{shieldPct}%</span>
            </div>
            <div className="w-full bg-slate-900 h-2.5 border border-cyan-950 overflow-hidden">
              <div
                className="bg-cyan-400 h-full transition-all duration-200"
                style={{ width: `${shieldPct}%` }}
              />
            </div>
          </div>

          {/* Hull Bar */}
          <div className="mb-2">
            <div className="flex justify-between text-[11px] mb-0.5">
              <span className="text-emerald-400">ARMORED HULL</span>
              <span className="text-emerald-200 font-bold tabular-nums">{hullPct}%</span>
            </div>
            <div className="w-full bg-slate-900 h-2.5 border border-emerald-950 overflow-hidden">
              <div
                className={`h-full transition-all duration-200 ${hullPct > 35 ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}
                style={{ width: `${hullPct}%` }}
              />
            </div>
          </div>

          {/* Boost Fuel & Laser Heat */}
          <div className="grid grid-cols-2 gap-2 text-[10px] mt-2 pt-2 border-t border-slate-800">
            <div>
              <span className="text-slate-400">BOOST FUEL</span>
              <div className="w-full bg-slate-900 h-1.5 border border-slate-700 mt-0.5">
                <div className="bg-amber-400 h-full" style={{ width: `${telemetry.boostFuel}%` }} />
              </div>
            </div>
            <div>
              <span className="text-slate-400">LASER HEAT</span>
              <div className="w-full bg-slate-900 h-1.5 border border-slate-700 mt-0.5">
                <div
                  className={`h-full ${telemetry.laserHeat > 80 ? 'bg-rose-500' : 'bg-cyan-500'}`}
                  style={{ width: `${telemetry.laserHeat}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Center: Tactical Power Triangle & Emergency Cores */}
        <div className="bg-slate-950/90 border border-cyan-800/80 p-3 pointer-events-auto flex flex-col items-center">
          <div className="text-[11px] text-cyan-400 font-bold mb-1 tracking-wider">
            TACTICAL POWER DISTRIBUTION
          </div>

          {/* Power Preset Selector Buttons */}
          <div className="grid grid-cols-4 gap-1.5 w-full mb-2.5">
            <button
              onClick={() => onSetPowerPreset('ENGINES')}
              className={`py-1 text-[10px] font-bold border transition cursor-pointer ${
                telemetry.power.preset === 'ENGINES'
                  ? 'bg-amber-500 text-slate-950 border-amber-300'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-400'
              }`}
            >
              [1] ENGINES
            </button>
            <button
              onClick={() => onSetPowerPreset('WEAPONS')}
              className={`py-1 text-[10px] font-bold border transition cursor-pointer ${
                telemetry.power.preset === 'WEAPONS'
                  ? 'bg-rose-500 text-slate-950 border-rose-300'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-rose-400'
              }`}
            >
              [2] WEAPONS
            </button>
            <button
              onClick={() => onSetPowerPreset('SHIELDS')}
              className={`py-1 text-[10px] font-bold border transition cursor-pointer ${
                telemetry.power.preset === 'SHIELDS'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-cyan-400'
              }`}
            >
              [3] SHIELDS
            </button>
            <button
              onClick={() => onSetPowerPreset('BALANCED')}
              className={`py-1 text-[10px] font-bold border transition cursor-pointer ${
                telemetry.power.preset === 'BALANCED'
                  ? 'bg-indigo-500 text-slate-950 border-indigo-300'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-indigo-400'
              }`}
            >
              [4] BALANCE
            </button>
          </div>

          {/* Dynamic Power Gauges */}
          <div className="grid grid-cols-3 gap-3 w-full text-center text-[10px]">
            <div>
              <div className="text-amber-400 font-bold tabular-nums">
                {Math.round(telemetry.power.current.engines)}%
              </div>
              <div className="text-slate-400 text-[9px]">ENGINES</div>
            </div>
            <div>
              <div className="text-rose-400 font-bold tabular-nums">
                {Math.round(telemetry.power.current.weapons)}%
              </div>
              <div className="text-slate-400 text-[9px]">WEAPONS</div>
            </div>
            <div>
              <div className="text-cyan-400 font-bold tabular-nums">
                {Math.round(telemetry.power.current.shields)}%
              </div>
              <div className="text-slate-400 text-[9px]">SHIELDS</div>
            </div>
          </div>

          {/* Emergency Core Action Buttons */}
          <div className="flex space-x-2 mt-2 w-full">
            <button
              onClick={onTriggerPowerDump}
              disabled={telemetry.power.powerDumpCooldown > 0}
              className={`flex-1 py-1 text-[10px] font-bold border transition cursor-pointer ${
                telemetry.power.powerDumpCooldown > 0
                  ? 'bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed'
                  : 'bg-amber-950/80 text-amber-300 border-amber-600 hover:bg-amber-900'
              }`}
            >
              [C] POWER DUMP{' '}
              {telemetry.power.powerDumpCooldown > 0 && `(${Math.ceil(telemetry.power.powerDumpCooldown)}s)`}
            </button>
            <button
              onClick={onTriggerOvercharge}
              disabled={telemetry.power.overchargeTimer > 0}
              className={`flex-1 py-1 text-[10px] font-bold border transition cursor-pointer ${
                telemetry.power.overchargeTimer > 0
                  ? 'bg-rose-900 text-rose-200 border-rose-400 animate-pulse'
                  : 'bg-rose-950/80 text-rose-300 border-rose-600 hover:bg-rose-900'
              }`}
            >
              [X] OVERCHARGE{' '}
              {telemetry.power.overchargeTimer > 0 && `(${telemetry.power.overchargeTimer.toFixed(1)}s)`}
            </button>
          </div>
        </div>

        {/* Right: Squad Radio Comms & Tactical Orders */}
        <div className="bg-slate-950/85 border border-cyan-900/70 p-3 pointer-events-auto">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <div className="flex items-center space-x-1.5 text-cyan-400">
              <Radio className="w-3.5 h-3.5" />
              <span>SHADOW SQUAD COMMS</span>
            </div>
            <span className="text-emerald-400 text-[10px]">2 WINGMEN ACTIVE</span>
          </div>

          {/* Radio Chatter Message Bubble */}
          <div className="bg-slate-900/90 border border-slate-800 p-2 text-[11px] mb-2 min-h-12 flex flex-col justify-center">
            {telemetry.squad.lastRadioMessage ? (
              <>
                <div className="text-cyan-300 font-bold text-[10px]">
                  {telemetry.squad.lastRadioMessage.sender}:
                </div>
                <div className="text-slate-200 text-[10px] leading-tight">
                  "{telemetry.squad.lastRadioMessage.text}"
                </div>
              </>
            ) : (
              <div className="text-slate-500 text-[10px]">Comms channel idle...</div>
            )}
          </div>

          {/* Squad Order Buttons */}
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => onIssueSquadOrder('COVER_SIX')}
              className={`py-1 text-[9px] font-bold border transition cursor-pointer ${
                telemetry.squad.currentOrder === 'COVER_SIX'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-cyan-400'
              }`}
            >
              [F1] COVER SIX
            </button>
            <button
              onClick={() => onIssueSquadOrder('FOCUS_TARGET')}
              className={`py-1 text-[9px] font-bold border transition cursor-pointer ${
                telemetry.squad.currentOrder === 'FOCUS_TARGET'
                  ? 'bg-amber-500 text-slate-950 border-amber-300'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-400'
              }`}
            >
              [F2] FOCUS TARGET
            </button>
            <button
              onClick={() => onIssueSquadOrder('FREE_HUNT')}
              className={`py-1 text-[9px] font-bold border transition cursor-pointer ${
                telemetry.squad.currentOrder === 'FREE_HUNT'
                  ? 'bg-indigo-500 text-slate-950 border-indigo-300'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-indigo-400'
              }`}
            >
              [F3] FREE HUNT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
