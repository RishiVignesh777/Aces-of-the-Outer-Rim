/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { SpaceCombatSimulation, type TelemetryData } from './game/spaceScene.ts';
import { getDefaultLoadout, type HangarLoadout } from './game/hangar.ts';
import { TitleScreen } from './components/TitleScreen.tsx';
import { CockpitOverlay } from './components/CockpitOverlay.tsx';
import { HangarModal } from './components/HangarModal.tsx';
import { PauseModal, VictoryModal, GameOverModal } from './components/GameModals.tsx';
import { sound } from './game/audio.ts';

type GameState = 'title' | 'playing' | 'paused' | 'gameover';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<SpaceCombatSimulation | null>(null);

  const [gameState, setGameState] = useState<GameState>('title');
  const [loadout, setLoadout] = useState<HangarLoadout>(getDefaultLoadout());
  const [isHangarOpen, setIsHangarOpen] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Victory / Defeat snapshots
  const [victoryStats, setVictoryStats] = useState<{
    timeSec: number;
    enemiesKilled: number;
    accuracy: number;
  } | null>(null);

  const [gameOverStats, setGameOverStats] = useState<{
    timeSec: number;
    subsystemsDestroyed: number;
  } | null>(null);

  // Sync state to body dataset
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Autostart URL query parameter check
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      handleStartGame();
    }
  }, []);

  // Initialize simulation
  useEffect(() => {
    if (!mountRef.current) return;

    const sim = new SpaceCombatSimulation(mountRef.current, loadout, {
      onTelemetryUpdate: (data) => {
        setTelemetry(data);
      },
      onVictory: (stats) => {
        setVictoryStats(stats);
        setGameState('gameover');
      },
      onGameOver: (stats) => {
        setGameOverStats(stats);
        setGameState('gameover');
      },
      onRadioMessage: () => {
        // Handled via telemetry update
      },
    });

    simRef.current = sim;

    const handleResize = () => {
      sim.handleResize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      sim.dispose();
      simRef.current = null;
    };
  }, []);

  // Keyboard and Mouse input listeners
  useEffect(() => {
    const keysHeld = new Set<string>();

    const updateFlightInputs = () => {
      if (!simRef.current) return;

      let throttle = 0;
      if (keysHeld.has('KeyW') || keysHeld.has('ArrowUp')) throttle += 1;
      if (keysHeld.has('KeyS') || keysHeld.has('ArrowDown')) throttle -= 1;

      let strafeX = 0;
      if (keysHeld.has('KeyD')) strafeX += 1;
      if (keysHeld.has('KeyA')) strafeX -= 1;

      let roll = 0;
      if (keysHeld.has('KeyE')) roll += 1;
      if (keysHeld.has('KeyQ')) roll -= 1;

      const boost = keysHeld.has('ShiftLeft') || keysHeld.has('ShiftRight');

      simRef.current.setInput({
        throttle,
        strafeX,
        roll,
        boost,
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      keysHeld.add(e.code);

      // Handle Title Start with Space / Enter
      if (gameState === 'title' && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault();
        handleStartGame();
        return;
      }

      // Handle Pause
      if ((e.code === 'Escape' || e.code === 'KeyP') && (gameState === 'playing' || gameState === 'paused')) {
        e.preventDefault();
        handleTogglePause();
        return;
      }

      if (gameState !== 'playing' || !simRef.current) return;

      // Primary Fire
      if (e.code === 'Space') {
        e.preventDefault();
        simRef.current.firePrimary();
      }

      // Secondary Fire
      if (e.code === 'KeyF') {
        e.preventDefault();
        simRef.current.fireSecondary();
      }

      // Cycle Target
      if (e.code === 'KeyT') {
        e.preventDefault();
        simRef.current.cycleTarget();
      }

      // Toggle Decoupled Drift (Flight Assist Off)
      if (e.code === 'KeyZ') {
        e.preventDefault();
        simRef.current.setInput({
          flightAssist: !telemetry?.flightAssist,
        });
        sound.playSwitchClick();
      }

      // Power Triangle Presets (1-4)
      if (e.code === 'Digit1') simRef.current.setPowerPreset('ENGINES');
      if (e.code === 'Digit2') simRef.current.setPowerPreset('WEAPONS');
      if (e.code === 'Digit3') simRef.current.setPowerPreset('SHIELDS');
      if (e.code === 'Digit4') simRef.current.setPowerPreset('BALANCED');

      // Test Structural Damage Key [K]
      if (e.code === 'KeyK') {
        e.preventDefault();
        simRef.current.applyDamage(25);
      }

      // Emergency Cores
      if (e.code === 'KeyC') simRef.current.triggerPowerDump();
      if (e.code === 'KeyX') simRef.current.triggerOvercharge();

      // Squad Commands (F1 - F3)
      if (e.code === 'F1') {
        e.preventDefault();
        simRef.current.issueSquadOrder('COVER_SIX');
      }
      if (e.code === 'F2') {
        e.preventDefault();
        simRef.current.issueSquadOrder('FOCUS_TARGET');
      }
      if (e.code === 'F3') {
        e.preventDefault();
        simRef.current.issueSquadOrder('FREE_HUNT');
      }

      // Toggle Camera
      if (e.code === 'KeyV') {
        simRef.current.toggleViewMode();
      }

      // Toggle Audio Mute
      if (e.code === 'KeyM') {
        handleToggleMute();
      }

      updateFlightInputs();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysHeld.delete(e.code);
      updateFlightInputs();
    };

    // Mouse aiming
    let isMouseDown = false;
    let fireInterval: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (gameState !== 'playing' || !simRef.current) return;

      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = (e.clientY / window.innerHeight) * 2 - 1;

      // Deadzone and curvature for high-accuracy flight
      const yaw = Math.abs(normX) > 0.08 ? normX * 0.9 : 0;
      const pitch = Math.abs(normY) > 0.08 ? normY * 0.8 : 0;

      simRef.current.setInput({
        yaw,
        pitch,
      });
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (gameState !== 'playing' || !simRef.current) return;
      if (e.button === 0) {
        // Left click: Fire lasers
        isMouseDown = true;
        simRef.current.firePrimary();
        if (!fireInterval) {
          fireInterval = window.setInterval(() => {
            if (isMouseDown && simRef.current) {
              simRef.current.firePrimary();
            }
          }, 150);
        }
      } else if (e.button === 2) {
        // Right click: Launch torpedo
        e.preventDefault();
        simRef.current.fireSecondary();
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        isMouseDown = false;
        if (fireInterval !== null) {
          clearInterval(fireInterval);
          fireInterval = null;
        }
      }
    };

    const handleBlur = () => {
      keysHeld.clear();
      isMouseDown = false;
      if (fireInterval !== null) {
        clearInterval(fireInterval);
        fireInterval = null;
      }
      if (simRef.current) {
        simRef.current.setInput({
          throttle: 0,
          strafeX: 0,
          strafeY: 0,
          pitch: 0,
          yaw: 0,
          roll: 0,
          boost: false,
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleBlur);
      if (fireInterval !== null) clearInterval(fireInterval);
    };
  }, [gameState, telemetry]);

  const handleStartGame = () => {
    sound.init();
    sound.playSwitchClick();
    setGameState('playing');
    if (simRef.current) {
      simRef.current.setTitleMode(false);
      simRef.current.setPaused(false);
      // Give initial forward impulse
      simRef.current.setInput({ throttle: 0.6 });
    }
  };

  const handleTogglePause = () => {
    setGameState((prev) => {
      const next = prev === 'paused' ? 'playing' : 'paused';
      if (simRef.current) {
        simRef.current.setPaused(next === 'paused');
      }
      return next;
    });
  };

  const handleRestart = () => {
    setVictoryStats(null);
    setGameOverStats(null);
    setGameState('playing');
    if (mountRef.current && simRef.current) {
      simRef.current.dispose();
      simRef.current = new SpaceCombatSimulation(mountRef.current, loadout, {
        onTelemetryUpdate: (data) => setTelemetry(data),
        onVictory: (stats) => {
          setVictoryStats(stats);
          setGameState('gameover');
        },
        onGameOver: (stats) => {
          setGameOverStats(stats);
          setGameState('gameover');
        },
        onRadioMessage: () => {},
      });
      simRef.current.setInput({ throttle: 0.6 });
    }
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    sound.setMuted(next);
  };

  const handleUpdateLoadout = (newLoadout: HangarLoadout) => {
    setLoadout(newLoadout);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* 3D WebGL Canvas Mount Container */}
      <div ref={mountRef} className="absolute inset-0 z-0" />

      {/* Title Screen Overlay */}
      {gameState === 'title' && (
        <TitleScreen
          onStart={handleStartGame}
          onOpenHangar={() => setIsHangarOpen(true)}
        />
      )}

      {/* Cockpit In-Flight HUD Overlay */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <CockpitOverlay
          telemetry={telemetry}
          onSetPowerPreset={(p) => simRef.current?.setPowerPreset(p)}
          onTriggerPowerDump={() => simRef.current?.triggerPowerDump()}
          onTriggerOvercharge={() => simRef.current?.triggerOvercharge()}
          onIssueSquadOrder={(order) => simRef.current?.issueSquadOrder(order)}
          onToggleViewMode={() => simRef.current?.toggleViewMode()}
          onToggleMute={handleToggleMute}
          onPause={handleTogglePause}
          onCycleTarget={() => simRef.current?.cycleTarget()}
          isMuted={isMuted}
        />
      )}

      {/* Hangar Customization Modal */}
      {isHangarOpen && (
        <HangarModal
          loadout={loadout}
          onUpdateLoadout={handleUpdateLoadout}
          onClose={() => setIsHangarOpen(false)}
          onLaunchSortie={() => {
            setIsHangarOpen(false);
            handleStartGame();
          }}
        />
      )}

      {/* Status Modals */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={handleTogglePause}
          onRestart={handleRestart}
          onOpenHangar={() => {
            setGameState('title');
            setIsHangarOpen(true);
          }}
          onTitle={() => setGameState('title')}
        />
      )}

      {gameState === 'gameover' && victoryStats && (
        <VictoryModal
          stats={victoryStats}
          onPlayAgain={handleRestart}
          onOpenHangar={() => {
            setGameState('title');
            setIsHangarOpen(true);
          }}
        />
      )}

      {gameState === 'gameover' && gameOverStats && (
        <GameOverModal
          stats={gameOverStats}
          onTryAgain={handleRestart}
          onOpenHangar={() => {
            setGameState('title');
            setIsHangarOpen(true);
          }}
        />
      )}
    </div>
  );
}
