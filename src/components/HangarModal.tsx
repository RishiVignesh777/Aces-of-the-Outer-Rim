/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Crosshair, Shield, Zap, Sparkles, Check, ChevronRight } from 'lucide-react';
import {
  PRIMARY_WEAPONS,
  SECONDARY_WEAPONS,
  SUBSYSTEM_MODULES,
  LIVERIES,
  PILOT_PERKS,
  type HangarLoadout,
} from '../game/hangar.ts';

interface HangarModalProps {
  loadout: HangarLoadout;
  onUpdateLoadout: (loadout: HangarLoadout) => void;
  onClose: () => void;
  onLaunchSortie?: () => void;
}

export const HangarModal: React.FC<HangarModalProps> = ({
  loadout,
  onUpdateLoadout,
  onClose,
  onLaunchSortie,
}) => {
  const [activeTab, setActiveTab] = useState<'WEAPONS' | 'MODULES' | 'LIVERIES' | 'PERKS'>('WEAPONS');
  const [current, setCurrent] = useState<HangarLoadout>({ ...loadout });

  const activePrimary = PRIMARY_WEAPONS.find((w) => w.id === current.primaryWeaponId) || PRIMARY_WEAPONS[0];
  const activeSecondary = SECONDARY_WEAPONS.find((w) => w.id === current.secondaryWeaponId) || SECONDARY_WEAPONS[0];
  const activeModule = SUBSYSTEM_MODULES.find((m) => m.id === current.selectedModuleId) || SUBSYSTEM_MODULES[0];

  const handleSave = () => {
    onUpdateLoadout(current);
    if (onLaunchSortie) {
      onLaunchSortie();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 font-mono select-none">
      <div className="relative w-full max-w-4xl bg-slate-950 border border-cyan-800 shadow-[0_0_35px_rgba(6,182,212,0.25)] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-900 bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <span className="w-2.5 h-2.5 bg-cyan-400"></span>
            <h2 className="text-sm sm:text-base font-bold text-cyan-300 tracking-wider">
              HANGAR BAY 04 — INTERCEPTOR OUTFITTING & PERK MATRIX
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/30 text-xs font-bold">
          <button
            onClick={() => setActiveTab('WEAPONS')}
            className={`flex-1 py-3 border-b-2 transition cursor-pointer ${
              activeTab === 'WEAPONS'
                ? 'border-cyan-400 text-cyan-300 bg-slate-850'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            HARDPOINT LOADOUTS
          </button>
          <button
            onClick={() => setActiveTab('MODULES')}
            className={`flex-1 py-3 border-b-2 transition cursor-pointer ${
              activeTab === 'MODULES'
                ? 'border-cyan-400 text-cyan-300 bg-slate-850'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            SUBSYSTEM MODULES
          </button>
          <button
            onClick={() => setActiveTab('LIVERIES')}
            className={`flex-1 py-3 border-b-2 transition cursor-pointer ${
              activeTab === 'LIVERIES'
                ? 'border-cyan-400 text-cyan-300 bg-slate-850'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            ARMOR LIVERIES
          </button>
          <button
            onClick={() => setActiveTab('PERKS')}
            className={`flex-1 py-3 border-b-2 transition cursor-pointer ${
              activeTab === 'PERKS'
                ? 'border-cyan-400 text-cyan-300 bg-slate-850'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            PILOT PERK TREE
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* WEAPONS TAB */}
          {activeTab === 'WEAPONS' && (
            <div className="space-y-6">
              {/* Primary Weapon Selection */}
              <div>
                <h3 className="text-xs text-cyan-400 font-bold mb-3 flex items-center space-x-2">
                  <Crosshair className="w-4 h-4" />
                  <span>PRIMARY HARDPOINT (TWIN FORWARD CANNONS)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {PRIMARY_WEAPONS.map((wp) => {
                    const isSelected = current.primaryWeaponId === wp.id;
                    return (
                      <div
                        key={wp.id}
                        onClick={() => setCurrent({ ...current, primaryWeaponId: wp.id })}
                        className={`p-3.5 border transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-slate-200">{wp.name}</span>
                            {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                          </div>
                          <p className="text-[11px] text-slate-400 font-sans leading-snug mb-3">
                            {wp.description}
                          </p>
                        </div>
                        <div className="text-[10px] space-y-1 text-slate-300 border-t border-slate-800 pt-2">
                          <div className="flex justify-between">
                            <span>DAMAGE:</span>
                            <span className="text-cyan-300 font-bold">{wp.damage} PTS</span>
                          </div>
                          <div className="flex justify-between">
                            <span>FIRE RATE:</span>
                            <span className="text-cyan-300 font-bold">{wp.fireRate}/S</span>
                          </div>
                          <div className="flex justify-between">
                            <span>SHIELD MULTIPLIER:</span>
                            <span className="text-amber-400 font-bold">{wp.shieldBonus}x</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Secondary Ordnance Selection */}
              <div>
                <h3 className="text-xs text-cyan-400 font-bold mb-3 flex items-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>SECONDARY ORDNANCE (HEAVY RACKS)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SECONDARY_WEAPONS.map((wp) => {
                    const isSelected = current.secondaryWeaponId === wp.id;
                    return (
                      <div
                        key={wp.id}
                        onClick={() => setCurrent({ ...current, secondaryWeaponId: wp.id })}
                        className={`p-3.5 border transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-950/40 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-slate-200">{wp.name}</span>
                            {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                          </div>
                          <p className="text-[11px] text-slate-400 font-sans leading-snug mb-3">
                            {wp.description}
                          </p>
                        </div>
                        <div className="text-[10px] space-y-1 text-slate-300 border-t border-slate-800 pt-2">
                          <div className="flex justify-between">
                            <span>WARHEAD DAMAGE:</span>
                            <span className="text-amber-300 font-bold">{wp.damage} PTS</span>
                          </div>
                          <div className="flex justify-between">
                            <span>MAGAZINE CAPACITY:</span>
                            <span className="text-amber-300 font-bold">{wp.ammoMax} TORPEDOES</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* MODULES TAB */}
          {activeTab === 'MODULES' && (
            <div className="space-y-4">
              <h3 className="text-xs text-cyan-400 font-bold flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>AVIONICS & THRUSTER MODIFICATION MATRIX</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SUBSYSTEM_MODULES.map((mod) => {
                  const isSelected = current.selectedModuleId === mod.id;
                  return (
                    <div
                      key={mod.id}
                      onClick={() => setCurrent({ ...current, selectedModuleId: mod.id })}
                      className={`p-4 border transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-bold text-slate-200">{mod.name}</span>
                          {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                        </div>
                        <span className="inline-block text-[9px] bg-slate-800 px-1.5 py-0.5 text-cyan-300 font-bold mb-2">
                          {mod.slot}
                        </span>
                        <p className="text-[11px] text-slate-400 font-sans leading-relaxed mb-3">
                          {mod.description}
                        </p>
                      </div>
                      <div className="text-[11px] text-emerald-400 font-bold border-t border-slate-800 pt-2">
                        {mod.statBonus}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* LIVERIES TAB */}
          {activeTab === 'LIVERIES' && (
            <div className="space-y-4">
              <h3 className="text-xs text-cyan-400 font-bold flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>WEATHERED COMBAT FINISHES & CAMOUFLAGE</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {LIVERIES.map((liv) => {
                  const isSelected = current.selectedLiveryId === liv.id;
                  return (
                    <div
                      key={liv.id}
                      onClick={() => setCurrent({ ...current, selectedLiveryId: liv.id })}
                      className={`p-4 border transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className="w-10 h-10 border border-slate-600 rounded-sm flex items-center justify-center shadow-inner"
                          style={{ backgroundColor: liv.hullColor }}
                        >
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: liv.glowColor }}
                          />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-200">{liv.name}</div>
                          <div className="text-[10px] text-slate-400 font-sans">
                            Outer Rim Void Camouflage
                          </div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-5 h-5 text-cyan-400" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PERKS TAB */}
          {activeTab === 'PERKS' && (
            <div className="space-y-4">
              <h3 className="text-xs text-cyan-400 font-bold flex items-center space-x-2">
                <ChevronRight className="w-4 h-4" />
                <span>PILOT SPECIALIZATION TREE</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PILOT_PERKS.map((perk) => (
                  <div
                    key={perk.id}
                    className="p-4 bg-slate-900/70 border border-cyan-900/80 flex flex-col justify-between"
                  >
                    <div>
                      <div className="text-[10px] text-cyan-400 font-bold tracking-wider mb-1">
                        BRANCH: {perk.branch}
                      </div>
                      <div className="text-xs font-bold text-slate-200 mb-2">{perk.name}</div>
                      <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                        {perk.description}
                      </p>
                    </div>
                    <div className="mt-4 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px]">
                      <span className="text-emerald-400 font-bold">STATUS: EQUIPPED</span>
                      <Check className="w-4 h-4 text-emerald-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Summary CTA */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-300 flex items-center space-x-3">
            <span>
              LOADOUT:{' '}
              <span className="text-cyan-400 font-bold">{activePrimary.name}</span> +{' '}
              <span className="text-amber-400 font-bold">{activeSecondary.name}</span>
            </span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs border border-slate-700 text-slate-300 hover:bg-slate-800 transition cursor-pointer"
            >
              CANCEL
            </button>
            <button
              onClick={handleSave}
              className="flex-1 sm:flex-initial px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-bold text-xs tracking-wider transition cursor-pointer"
            >
              CONFIRM & ENGAGE SORTIE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
