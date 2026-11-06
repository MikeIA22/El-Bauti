import React, { useState } from 'react';
import {
  Trophy,
  Volume2,
  VolumeX,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  Shield,
  Flame,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Info,
} from 'lucide-react';
import { GameStats, PowerUpState, getRankForScore } from '../game/constants';
import { GameState } from '../game/gameEngine';
import { audioManager } from '../audio/AudioManager';

interface GameUIProps {
  gameState: GameState;
  stats: GameStats;
  activePowerUps: PowerUpState[];
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onJump: () => void;
  onSlide: () => void;
  onDifficultyChange: (mode: 'easy' | 'normal' | 'hard') => void;
}

export const GameUI: React.FC<GameUIProps> = ({
  gameState,
  stats,
  activePowerUps,
  onStart,
  onPause,
  onResume,
  onRestart,
  onMoveLeft,
  onMoveRight,
  onJump,
  onSlide,
  onDifficultyChange,
}) => {
  const [isMuted, setIsMuted] = useState(audioManager.getMuted());
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const toggleSound = () => {
    const muted = audioManager.toggleMute();
    setIsMuted(muted);
  };

  const handleDifficultySelect = (mode: 'easy' | 'normal' | 'hard') => {
    setSelectedDifficulty(mode);
    onDifficultyChange(mode);
  };

  // Safe touch/click handler to prevent double-firing on mobile
  const makePressHandler = (action: () => void) => {
    return (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      action();
    };
  };

  const rank = getRankForScore(stats.score);

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between overflow-hidden">
      {/* ============================================================== */}
      {/* 1. IN-GAME HUD (VISIBLE WHEN PLAYING OR PAUSED)                */}
      {/* ============================================================== */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
        <>
          {/* Top Bar HUD */}
          <div className="w-full p-2.5 sm:p-4 flex items-start justify-between">
            {/* Left: Score & Distance */}
            <div className="flex flex-col gap-1 pointer-events-auto">
              <div className="flex items-center gap-2 bg-neutral-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-lg">
                <span className="text-amber-400 font-bold text-[11px] sm:text-xs uppercase tracking-wider">Puntos</span>
                <span className="font-display text-lg sm:text-2xl text-white tracking-wider tabular-nums">
                  {stats.score.toLocaleString()}
                </span>
                {stats.multiplier > 1 && (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] sm:text-xs px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5">
                    <Zap className="w-3 h-3 fill-amber-400 text-amber-400" />
                    x{stats.multiplier}
                  </span>
                )}
              </div>

              {/* Distance along Calle Laurel */}
              <div className="flex items-center gap-1.5 bg-neutral-900/70 backdrop-blur-md px-2.5 py-0.5 rounded-lg border border-white/5 text-[11px] sm:text-xs text-neutral-300 w-fit">
                <span>Calle Laurel:</span>
                <span className="font-semibold text-white tabular-nums">{stats.distance} m</span>
              </div>
            </div>

            {/* Center: Tapas & Rioja Counters */}
            <div className="flex items-center gap-2 sm:gap-3 bg-neutral-900/80 backdrop-blur-md px-2.5 sm:px-4 py-1.5 rounded-xl border border-white/10 shadow-lg pointer-events-auto text-xs sm:text-sm">
              <div className="flex items-center gap-1">
                <span>🪙</span>
                <span className="font-bold text-amber-300 tabular-nums">{stats.coins}</span>
              </div>
              <span className="text-white/20">|</span>
              <div className="flex items-center gap-1">
                <span>🍄</span>
                <span className="font-bold text-emerald-400 tabular-nums">{stats.tapas}</span>
              </div>
              <span className="text-white/20">|</span>
              <div className="flex items-center gap-1">
                <span>🍷</span>
                <span className="font-bold text-rose-400 tabular-nums">{stats.wineGlasses}</span>
              </div>
            </div>

            {/* Right: Sound & Pause Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
              <button
                onClick={toggleSound}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-neutral-900/85 backdrop-blur-md border border-white/10 text-white hover:bg-neutral-800 transition active:scale-95"
                title={isMuted ? 'Activar sonido' : 'Silenciar'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-neutral-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
              </button>

              <button
                onClick={onPause}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-neutral-900/85 backdrop-blur-md border border-white/10 text-white hover:bg-neutral-800 transition active:scale-95"
                title="Pausar juego"
              >
                <Pause className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Power-ups Bar */}
          {activePowerUps.length > 0 && (
            <div className="self-center flex flex-wrap gap-2 px-3 pointer-events-auto -mt-1 sm:-mt-2">
              {activePowerUps.map((p) => {
                const percent = Math.max(0, Math.min(100, (p.remainingTime / p.duration) * 100));
                let colorClass = 'bg-emerald-500 border-emerald-400 text-emerald-200';
                let icon = <Sparkles className="w-3.5 h-3.5" />;
                let name = 'Super Salto';

                if (p.type === 'rioja') {
                  colorClass = 'bg-rose-600 border-rose-500 text-rose-200';
                  icon = <Shield className="w-3.5 h-3.5" />;
                  name = 'Escudo Rioja';
                } else if (p.type === 'pincho') {
                  colorClass = 'bg-amber-500 border-amber-400 text-amber-200';
                  icon = <Flame className="w-3.5 h-3.5" />;
                  name = 'Imán Tapas';
                }

                return (
                  <div
                    key={p.type}
                    className="flex items-center gap-1.5 bg-neutral-900/90 backdrop-blur-md border border-white/15 px-2.5 py-1 rounded-full shadow-md text-xs"
                  >
                    <div className="flex items-center gap-1 font-semibold text-white text-[11px]">
                      {icon}
                      <span>{name}</span>
                    </div>
                    <div className="w-12 h-1.5 bg-neutral-800 rounded-full overflow-hidden border border-white/10">
                      <div
                        className={`h-full transition-all duration-100 ${colorClass}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-neutral-300 tabular-nums">
                      {p.remainingTime.toFixed(1)}s
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Mobile Ergonomic Thumb Controls (Subway Surfers Phone Mode) */}
          <div className="w-full max-w-lg mx-auto px-4 pb-4 pt-2 flex items-end justify-between pointer-events-auto">
            {/* Left Thumb: Direction Controls (Left / Right) */}
            <div className="flex items-center gap-2.5 bg-neutral-950/70 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-xl">
              <button
                onTouchStart={makePressHandler(onMoveLeft)}
                onClick={makePressHandler(onMoveLeft)}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-neutral-900/90 border border-amber-500/30 flex flex-col items-center justify-center text-white active:bg-amber-600 active:scale-90 transition shadow-lg touch-none"
                aria-label="Mover a la Izquierda"
              >
                <ArrowLeft className="w-7 h-7 text-amber-400" />
                <span className="text-[9px] font-bold text-amber-300 uppercase">Izq</span>
              </button>
              <button
                onTouchStart={makePressHandler(onMoveRight)}
                onClick={makePressHandler(onMoveRight)}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-neutral-900/90 border border-amber-500/30 flex flex-col items-center justify-center text-white active:bg-amber-600 active:scale-90 transition shadow-lg touch-none"
                aria-label="Mover a la Derecha"
              >
                <ArrowRight className="w-7 h-7 text-amber-400" />
                <span className="text-[9px] font-bold text-amber-300 uppercase">Der</span>
              </button>
            </div>

            {/* Right Thumb: Action Controls (Jump / Slide) */}
            <div className="flex items-center gap-2.5 bg-neutral-950/70 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-xl">
              <button
                onTouchStart={makePressHandler(onSlide)}
                onClick={makePressHandler(onSlide)}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-neutral-900/90 border border-rose-500/30 flex flex-col items-center justify-center text-white active:bg-rose-600 active:scale-90 transition shadow-lg touch-none"
                aria-label="Rodar / Agacharse"
              >
                <ArrowDown className="w-6 h-6 text-rose-400" />
                <span className="text-[9px] font-bold text-rose-300 uppercase">Rodar</span>
              </button>
              <button
                onTouchStart={makePressHandler(onJump)}
                onClick={makePressHandler(onJump)}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 border border-amber-300/50 flex flex-col items-center justify-center text-neutral-950 font-bold active:scale-90 transition shadow-xl touch-none"
                aria-label="Saltar"
              >
                <ArrowUp className="w-7 h-7 stroke-[2.5]" />
                <span className="text-[9px] uppercase tracking-tight">Salto</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* 2. START MENU SCREEN                                           */}
      {/* ============================================================== */}
      {gameState === 'MENU' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-neutral-950 via-neutral-950/75 to-neutral-950/40 p-4 pointer-events-auto overflow-y-auto">
          <div className="w-full max-w-lg bg-neutral-900/95 backdrop-blur-xl border border-white/15 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col items-center text-center my-auto">
            {/* Header Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/30 text-rose-300 text-xs font-semibold mb-2">
              <span>🍷</span>
              <span>Calle Laurel · Logroño · Bares y Tapas</span>
            </div>

            {/* Game Title */}
            <h1 className="font-display text-4xl sm:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 drop-shadow-md tracking-wider">
              EL BAUTI
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300 mt-1 mb-4">
              Corre por los bares de Calle Laurel esquivando barricas de roble y mesas de terraza.
            </p>

            {/* Character Reference Card */}
            <div className="w-full bg-neutral-950/70 rounded-2xl p-3 border border-white/10 flex items-center gap-3.5 mb-4 text-left">
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 border-amber-500/50 shrink-0 bg-neutral-800">
                <img
                  src="/public/assets/aistudio/Captura_de_pantalla_2026-11-06_101049_32e528c8.png"
                  alt="Bauti"
                  className="w-full h-full object-cover object-top"
                />
                <span className="absolute bottom-0 right-0 bg-amber-500 text-black text-[10px] font-bold px-1 rounded-tl">
                  👍
                </span>
              </div>
              <div>
                <h3 className="font-bold text-white text-xs sm:text-sm">Bauti</h3>
                <p className="text-[11px] sm:text-xs text-neutral-400 leading-relaxed">
                  Sudadera gris, pantalones chinos azul marino y zapatillas blancas. ¡Listo para el poteo riojano!
                </p>
              </div>
            </div>

            {/* Obstacle Clarity Guide (Instant Recognition) */}
            <div className="w-full bg-neutral-950/60 rounded-xl p-3 border border-white/5 mb-4 text-left">
              <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-1.5">
                🛑 Obstáculos de Calle Laurel:
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] sm:text-xs">
                <div className="bg-neutral-900/80 p-2 rounded-lg border border-white/5">
                  <span className="text-base">🛢️</span>
                  <div className="font-bold text-white mt-0.5">Barrica Rioja</div>
                  <div className="text-emerald-400 text-[10px]">Saltar o Esquivar</div>
                </div>
                <div className="bg-neutral-900/80 p-2 rounded-lg border border-white/5">
                  <span className="text-base">🪑</span>
                  <div className="font-bold text-white mt-0.5">Mesa Terraza</div>
                  <div className="text-amber-400 text-[10px]">Esquivar carril</div>
                </div>
                <div className="bg-neutral-900/80 p-2 rounded-lg border border-white/5">
                  <span className="text-base">🪵</span>
                  <div className="font-bold text-white mt-0.5">Toldo de Bar</div>
                  <div className="text-rose-400 text-[10px]">Rodar (Slide)</div>
                </div>
              </div>
            </div>

            {/* Difficulty Selector */}
            <div className="w-full mb-4">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'easy', label: 'Paseo', icon: '🚶' },
                  { id: 'normal', label: 'Rápido', icon: '🏃' },
                  { id: 'hard', label: 'Fiesta', icon: '🔥' },
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleDifficultySelect(d.id as 'easy' | 'normal' | 'hard')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border ${
                      selectedDifficulty === d.id
                        ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-md'
                        : 'bg-neutral-800/80 text-neutral-300 border-white/5 hover:bg-neutral-800'
                    }`}
                  >
                    <span>{d.icon}</span>
                    <span>{d.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tapas Power-ups Preview Toggle */}
            <button
              onClick={() => setShowHowToPlay(!showHowToPlay)}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 mb-5 underline underline-offset-4"
            >
              <Info className="w-3.5 h-3.5" />
              <span>{showHowToPlay ? 'Ocultar detalles' : 'Ver poderes especiales de tapas'}</span>
            </button>

            {showHowToPlay && (
              <div className="w-full bg-neutral-950/80 rounded-2xl p-3.5 border border-white/10 mb-5 text-left text-xs space-y-2">
                <div>
                  <h4 className="font-bold text-amber-300 mb-1">🎮 En Móvil o Teclado:</h4>
                  <p className="text-neutral-300">
                    • <strong>Izquierda / Derecha:</strong> Botones o deslizar el dedo en pantalla.
                  </p>
                  <p className="text-neutral-300">• <strong>Salto:</strong> Botón Salto o deslizar arriba.</p>
                  <p className="text-neutral-300">• <strong>Rodar:</strong> Botón Rodar o deslizar abajo.</p>
                </div>
                <div>
                  <h4 className="font-bold text-amber-300 mb-1">🍢 Tapas Especiales:</h4>
                  <p className="text-neutral-300">
                    • 🍄 <strong>Champiñón Soriano:</strong> Super salto sobre barricas y mesas.
                  </p>
                  <p className="text-neutral-300">
                    • 🍷 <strong>Copa de Rioja:</strong> Escudo invencible protector.
                  </p>
                  <p className="text-neutral-300">
                    • 🍢 <strong>Pincho Moruno:</strong> Imán de monedas y x2 puntos.
                  </p>
                </div>
              </div>
            )}

            {/* Play Button */}
            <button
              onClick={onStart}
              className="w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-display text-lg sm:text-xl tracking-wider shadow-xl shadow-amber-500/20 active:scale-95 transition flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-neutral-950" />
              <span>¡A POR EL POTEO!</span>
            </button>

            {/* High Score */}
            {stats.highScore > 0 && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-300/80">
                <Trophy className="w-3.5 h-3.5" />
                <span>Récord: {stats.highScore.toLocaleString()} pts</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. PAUSE MODAL                                                 */}
      {/* ============================================================== */}
      {gameState === 'PAUSED' && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/85 backdrop-blur-md p-4 pointer-events-auto">
          <div className="w-full max-w-sm bg-neutral-900 border border-white/15 rounded-3xl p-6 text-center shadow-2xl">
            <h2 className="font-display text-2xl text-white mb-1">PAUSA</h2>
            <p className="text-xs text-neutral-400 mb-5">Tomando un respiro en la terraza de Calle Laurel</p>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={onResume}
                className="w-full py-3 rounded-xl bg-amber-500 text-neutral-950 font-bold hover:bg-amber-400 transition flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-neutral-950" />
                <span>Continuar</span>
              </button>

              <button
                onClick={onRestart}
                className="w-full py-3 rounded-xl bg-neutral-800 text-neutral-200 font-semibold hover:bg-neutral-700 transition flex items-center justify-center gap-2 border border-white/5"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Reiniciar carrera</span>
              </button>

              <button
                onClick={toggleSound}
                className="w-full py-2.5 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-medium hover:bg-neutral-700 transition flex items-center justify-center gap-2 border border-white/5"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
                <span>{isMuted ? 'Activar sonido' : 'Silenciar sonido'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. GAME OVER SCREEN                                            */}
      {/* ============================================================== */}
      {gameState === 'GAMEOVER' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-neutral-950 via-neutral-950/90 to-neutral-950/70 p-4 pointer-events-auto overflow-y-auto">
          <div className="w-full max-w-md bg-neutral-900/95 backdrop-blur-xl border border-white/15 rounded-3xl p-5 sm:p-7 text-center shadow-2xl my-auto">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-3xl mx-auto mb-2.5">
              💥
            </div>

            <h2 className="font-display text-2xl sm:text-3xl text-white tracking-wide">
              ¡TROPIEZO EN EL LAUREL!
            </h2>
            <p className="text-xs text-neutral-400 mt-1 mb-4">
              Bauti ha chocado con un obstáculo mientras recorría las terrazas de Logroño.
            </p>

            {/* Rank Badge */}
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 mb-4">
              <div className="text-2xl mb-0.5">{rank.badge}</div>
              <div className="font-bold text-amber-300 text-sm sm:text-base">{rank.title}</div>
              <div className="text-[11px] text-neutral-300 mt-0.5">{rank.subtitle}</div>
            </div>

            {/* Stats Breakdown Grid */}
            <div className="grid grid-cols-2 gap-2 mb-5 text-left">
              <div className="bg-neutral-950/70 rounded-xl p-2.5 border border-white/5">
                <span className="text-[10px] text-neutral-400">Puntos</span>
                <div className="font-display text-lg sm:text-xl text-amber-400 tabular-nums">
                  {stats.score.toLocaleString()}
                </div>
              </div>

              <div className="bg-neutral-950/70 rounded-xl p-2.5 border border-white/5">
                <span className="text-[10px] text-neutral-400">Distancia</span>
                <div className="font-display text-lg sm:text-xl text-white tabular-nums">
                  {stats.distance} m
                </div>
              </div>

              <div className="bg-neutral-950/70 rounded-xl p-2.5 border border-white/5">
                <span className="text-[10px] text-neutral-400">Monedas</span>
                <div className="font-display text-base sm:text-lg text-amber-300 tabular-nums flex items-center gap-1">
                  <span>🪙</span>
                  <span>{stats.coins}</span>
                </div>
              </div>

              <div className="bg-neutral-950/70 rounded-xl p-2.5 border border-white/5">
                <span className="text-[10px] text-neutral-400">Tapas & Riojas</span>
                <div className="font-display text-base sm:text-lg text-rose-300 tabular-nums flex items-center gap-1">
                  <span>🍄🍷</span>
                  <span>{stats.tapas + stats.wineGlasses}</span>
                </div>
              </div>
            </div>

            {/* High Score Banner */}
            {stats.score >= stats.highScore && stats.score > 0 && (
              <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl py-2 px-3 text-xs font-bold mb-4 flex items-center justify-center gap-1.5">
                <Trophy className="w-4 h-4 text-emerald-400" />
                <span>¡NUEVO RÉCORD EN CALLE LAUREL!</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <button
                onClick={onStart}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-neutral-950 font-display text-base sm:text-lg tracking-wider hover:from-amber-400 hover:to-amber-300 shadow-lg active:scale-95 transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                <span>VOLVER A CORRER</span>
              </button>

              <button
                onClick={onRestart}
                className="w-full py-2.5 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold hover:bg-neutral-700 transition border border-white/5"
              >
                Ir al Menú Principal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
