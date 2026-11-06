/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine, GameState } from './game/gameEngine';
import { GameStats, PowerUpState } from './game/constants';
import { GameUI } from './components/GameUI';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('MENU');
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    distance: 0,
    coins: 0,
    tapas: 0,
    wineGlasses: 0,
    highScore: 0,
    multiplier: 1,
  });
  const [activePowerUps, setActivePowerUps] = useState<PowerUpState[]>([]);

  // Initialize Game Engine
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const engine = new GameEngine(canvasMountRef.current, {
      onStatsUpdate: (newStats) => setStats(newStats),
      onPowerUpUpdate: (powerUps) => setActivePowerUps([...powerUps]),
      onStateChange: (state) => setGameState(state),
      onCoinCollected: () => {
        // Minor visual bounce if needed
      },
    });

    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!engineRef.current) return;

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          e.preventDefault();
          engineRef.current.moveLeft();
          break;
        case 'ArrowRight':
        case 'KeyD':
          e.preventDefault();
          engineRef.current.moveRight();
          break;
        case 'ArrowUp':
        case 'KeyW':
        case 'Space':
          e.preventDefault();
          engineRef.current.jump();
          break;
        case 'ArrowDown':
        case 'KeyS':
          e.preventDefault();
          engineRef.current.slide();
          break;
        case 'KeyP':
        case 'Escape':
          e.preventDefault();
          if (gameState === 'PLAYING') {
            engineRef.current.pauseGame();
          } else if (gameState === 'PAUSED') {
            engineRef.current.resumeGame();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Touch Swipe Gesture Detection across the full viewport (Subway Surfers mobile style)
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || !engineRef.current) return;

    const touchEnd = e.changedTouches[0];
    const dx = touchEnd.clientX - touchStartRef.current.x;
    const dy = touchEnd.clientY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const minSwipeDist = 28; // Responsive swipe distance threshold

    if (dt < 450 && (absDx > minSwipeDist || absDy > minSwipeDist)) {
      if (absDx > absDy) {
        // Horizontal swipe
        if (dx < 0) {
          engineRef.current.moveLeft();
        } else {
          engineRef.current.moveRight();
        }
      } else {
        // Vertical swipe
        if (dy < 0) {
          engineRef.current.jump();
        } else {
          engineRef.current.slide();
        }
      }
    }

    touchStartRef.current = null;
  };

  const handleStart = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.startGame();
    }
  }, []);

  const handlePause = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.pauseGame();
    }
  }, []);

  const handleResume = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.resumeGame();
    }
  }, []);

  const handleRestart = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.startGame();
    }
  }, []);

  const handleMoveLeft = useCallback(() => {
    engineRef.current?.moveLeft();
  }, []);

  const handleMoveRight = useCallback(() => {
    engineRef.current?.moveRight();
  }, []);

  const handleJump = useCallback(() => {
    engineRef.current?.jump();
  }, []);

  const handleSlide = useCallback(() => {
    engineRef.current?.slide();
  }, []);

  const handleDifficultyChange = useCallback((mode: 'easy' | 'normal' | 'hard') => {
    engineRef.current?.setDifficulty(mode);
  }, []);

  return (
    <div
      className="relative w-full h-screen overflow-hidden bg-neutral-950 font-outfit"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Dedicated 3D Canvas Mount Container (Zero React HUD re-render disruption) */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full" />

      {/* Interactive UI and HUD Overlay */}
      <GameUI
        gameState={gameState}
        stats={stats}
        activePowerUps={activePowerUps}
        onStart={handleStart}
        onPause={handlePause}
        onResume={handleResume}
        onRestart={handleRestart}
        onMoveLeft={handleMoveLeft}
        onMoveRight={handleMoveRight}
        onJump={handleJump}
        onSlide={handleSlide}
        onDifficultyChange={handleDifficultyChange}
      />
    </div>
  );
}
