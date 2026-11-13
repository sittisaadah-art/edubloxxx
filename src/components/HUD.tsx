import React from 'react';
import {
  Home,
  Coins,
  Star,
  Users,
  Utensils,
  GraduationCap,
  FileSpreadsheet,
  Volume2,
  VolumeX,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Compass,
  ArrowUp,
  MapPin,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  Sparkles,
  Bot,
  Footprints,
} from 'lucide-react';
import { Building, Player, AppSettings } from '../types';

interface HUDProps {
  settings: AppSettings;
  buildings: Building[];
  players: Player[];
  activePlayerIdx: number;
  onSelectPlayer: (idx: number) => void;
  moveMode: 'manual' | 'auto';
  onToggleMoveMode: () => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  onReturnHome: () => void;
  onOpenModal: (modalId: string) => void;
  nearbyBuilding: Building | { isCanteen: true } | null;
  onEnterNearbyBuilding: () => void;
  onTeleportToBuilding: (code: string) => void;
  onTeleportToPlaza: () => void;
  onRotateCamera: (delta: number) => void;
  onZoomCamera: (delta: number) => void;
  onFocusCamera: () => void;
  onJumpPlayer: () => void;
  onSetDpad: (dir: 'up' | 'down' | 'left' | 'right', val: boolean) => void;
  projectedCoords: {
    players: { id: string; name: string; x: number; y: number; visible: boolean }[];
    buildings: { code: string; name: string; icon: string; color: string; x: number; y: number; visible: boolean }[];
    monument: { x: number; y: number; visible: boolean };
  } | null;
  onSelectBuildingDirect: (code: string) => void;
  getQuestionCount: (code: string) => number;
}

export const HUD: React.FC<HUDProps> = ({
  settings,
  buildings,
  players,
  activePlayerIdx,
  onSelectPlayer,
  moveMode,
  onToggleMoveMode,
  audioEnabled,
  onToggleAudio,
  onReturnHome,
  onOpenModal,
  nearbyBuilding,
  onEnterNearbyBuilding,
  onTeleportToBuilding,
  onTeleportToPlaza,
  onRotateCamera,
  onZoomCamera,
  onFocusCamera,
  onJumpPlayer,
  onSetDpad,
  projectedCoords,
  onSelectBuildingDirect,
  getQuestionCount,
}) => {
  const activeP = players[activePlayerIdx] || players[0];
  const badgeColors = ['bg-blue-600', 'bg-pink-600', 'bg-amber-600', 'bg-emerald-600'];

  return (
    <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden select-none">
      {/* 3D-Projected Floating Labels (Nameplates & Building Billboards) */}
      {projectedCoords && (
        <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
          {/* Players */}
          {projectedCoords.players.map((p, idx) => {
            if (!p.visible) return null;
            return (
              <div key={p.id} className="player-tag" style={{ left: `${p.x}px`, top: `${p.y}px` }}>
                <div
                  className={`px-2.5 py-0.5 rounded-full text-white text-[11px] font-bold shadow-md flex items-center gap-1.5 border border-white/60 ${badgeColors[idx]}`}
                >
                  <span className="bg-black/30 px-1 rounded text-[9px]">{p.id}</span>
                  <span>{p.name}</span>
                </div>
              </div>
            );
          })}

          {/* Building Billboards */}
          {projectedCoords.buildings.map((b) => {
            if (!b.visible) return null;
            return (
              <div
                key={b.code}
                onClick={() => onSelectBuildingDirect(b.code)}
                className="building-tag pointer-events-auto cursor-pointer"
                style={{ left: `${b.x}px`, top: `${b.y}px` }}
              >
                <div className="px-3 py-1.5 rounded-2xl bg-slate-900/90 text-white text-xs font-display font-bold shadow-lg border-2 border-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg flex items-center justify-center text-white" style={{ background: b.color }}>
                    <Compass className="w-3.5 h-3.5" />
                  </span>
                  <span>{b.name}</span>
                </div>
              </div>
            );
          })}

          {/* Plaza Monument */}
          {projectedCoords.monument.visible && (
            <div className="player-tag" style={{ left: `${projectedCoords.monument.x}px`, top: `${projectedCoords.monument.y}px` }}>
              <div className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-display font-bold shadow-md border border-white flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>MONUMEN EDUBLOX CITY BY SITTY</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TOP BAR */}
      <div className="p-2 sm:p-3 flex flex-wrap items-start justify-between gap-2 pointer-events-none">
        {/* Left identity card */}
        <div className="glass-hud px-3.5 py-2 text-white pointer-events-auto flex items-center gap-3 shadow-lg">
          <button
            onClick={onReturnHome}
            title="Kembali ke Menu Awal"
            className="w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-white flex items-center justify-center text-lg shadow transition"
          >
            <Home className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm sm:text-base text-amber-300">EDUBLOX CITY BY SITTY</span>
              <span className="text-[11px] bg-blue-600 px-2 py-0.5 rounded-full font-bold">{settings.className}</span>
            </div>
            <div className="text-xs text-slate-200 font-semibold truncate max-w-[280px] sm:max-w-md">
              {settings.arenaName} • Bab 2 Algoritma & Pengelolaan Data
            </div>
          </div>
        </div>

        {/* Right HUD Controls */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          {/* Player Switcher (P1-P4) */}
          <div className="glass-hud p-1.5 flex items-center gap-1 text-white">
            {players.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => onSelectPlayer(idx)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                  activePlayerIdx === idx ? 'bg-blue-600 text-white shadow' : 'hover:bg-white/10 text-slate-300'
                }`}
              >
                {p.id}
              </button>
            ))}
          </div>

          {/* Player Coins & Score */}
          <div className="glass-hud px-3 py-1.5 text-white flex items-center gap-3 text-xs sm:text-sm font-bold shadow">
            <div className="flex items-center gap-1.5 text-amber-300">
              <Coins className="w-4 h-4" />
              <span>{activeP.coins}</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-300">
              <Star className="w-4 h-4 fill-emerald-300" />
              <span>{activeP.score}</span>
            </div>
          </div>

          {/* Movement Mode Toggle (Manual vs Auto Wander) */}
          <button
            onClick={onToggleMoveMode}
            className="glass-hud px-3 py-2 text-white text-xs font-bold hover:bg-slate-800 flex items-center gap-1.5 transition"
          >
            {moveMode === 'manual' ? (
              <>
                <Footprints className="w-4 h-4 text-sky-400" />
                <span className="hidden sm:inline">Mode:</span> Manual
              </>
            ) : (
              <>
                <Bot className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Mode:</span> Auto
              </>
            )}
          </button>

          {/* Navigation Action Buttons */}
          <button
            onClick={() => onOpenModal('avatar')}
            className="glass-hud px-3 py-2 text-white text-xs font-bold hover:bg-slate-800 flex items-center gap-1.5 transition"
            title="Pilih Avatar & Siswa"
          >
            <Users className="w-4 h-4 text-sky-400" />
            <span className="hidden md:inline">Avatar</span>
          </button>

          <button
            onClick={() => onOpenModal('canteen')}
            className="glass-hud px-3 py-2 text-white text-xs font-bold hover:bg-slate-800 flex items-center gap-1.5 transition"
            title="Kantin Edublox"
          >
            <Utensils className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">Kantin</span>
          </button>

          <button
            onClick={() => onOpenModal('teacher')}
            className="glass-hud px-3 py-2 text-white text-xs font-bold hover:bg-slate-800 flex items-center gap-1.5 transition"
            title="Panel Guru & AI Generator"
          >
            <GraduationCap className="w-4 h-4 text-purple-400" />
            <span className="hidden md:inline">Guru</span>
          </button>

          <button
            onClick={() => onOpenModal('recap')}
            className="glass-hud px-3 py-2 text-white text-xs font-bold hover:bg-slate-800 flex items-center gap-1.5 transition"
            title="Rekap Nilai & Ekspor Spreadsheet"
          >
            <FileSpreadsheet className="w-4 h-4 text-rose-400" />
            <span className="hidden md:inline">Nilai</span>
          </button>

          <button
            onClick={onToggleAudio}
            className="glass-hud w-9 h-9 text-white flex items-center justify-center hover:bg-slate-800 transition"
            title="Musik & Efek Suara ON/OFF"
          >
            {audioEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>
        </div>
      </div>

      {/* QUICK TELEPORT SIDEBAR (DESKTOP) */}
      <div className="hidden lg:flex flex-col gap-1.5 fixed left-3 top-1/2 -translate-y-1/2 pointer-events-auto glass-hud p-2.5 text-white w-56 shadow-2xl">
        <div className="text-xs font-display font-bold text-amber-300 px-1 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Compass className="w-3.5 h-3.5" /> GEDUNG MATERI
          </span>
          <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded">Teleport</span>
        </div>
        <div className="flex flex-col gap-1 max-h-[50vh] overflow-y-auto pr-1">
          {buildings.map((b) => (
            <button
              key={b.code}
              onClick={() => onTeleportToBuilding(b.code)}
              className="w-full text-left px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs flex items-center justify-between gap-2 transition"
            >
              <span className="truncate font-semibold flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.color }} />
                {b.code}: {b.name.replace(/^Gedung [^:]+: /, '')}
              </span>
              <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded shrink-0">{getQuestionCount(b.code)} soal</span>
            </button>
          ))}
        </div>
        <button
          onClick={onTeleportToPlaza}
          className="mt-1 w-full py-1.5 px-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-bold flex items-center justify-center gap-1.5 transition"
        >
          <Sparkles className="w-3.5 h-3.5" /> Kembali ke Plaza
        </button>
      </div>

      {/* CAMERA CONTROLS DOCK (RIGHT) */}
      <div className="fixed right-3 top-1/2 -translate-y-1/2 pointer-events-auto glass-hud p-2 flex flex-col gap-2 text-white shadow-2xl">
        <button onClick={() => onRotateCamera(-0.35)} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center" title="Putar Kiri">
          <RotateCcw className="w-4 h-4" />
        </button>
        <button onClick={() => onRotateCamera(0.35)} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center" title="Putar Kanan">
          <RotateCw className="w-4 h-4" />
        </button>
        <button onClick={() => onZoomCamera(-3)} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center" title="Perbesar (Zoom In)">
          <ZoomIn className="w-4 h-4" />
        </button>
        <button onClick={() => onZoomCamera(3)} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center" title="Perkecil (Zoom Out)">
          <ZoomOut className="w-4 h-4" />
        </button>
        <button onClick={onFocusCamera} className="w-10 h-10 rounded-xl bg-amber-500/80 hover:bg-amber-500 flex items-center justify-center" title="Fokuskan Kamera">
          <Crosshair className="w-4 h-4" />
        </button>
        <button onClick={onTeleportToPlaza} className="w-10 h-10 rounded-xl bg-sky-500/80 hover:bg-sky-500 flex items-center justify-center" title="Kembali ke Plaza Utama">
          <Sparkles className="w-4 h-4" />
        </button>
      </div>

      {/* NEARBY BUILDING PROXIMITY PROMPT (CENTER BOTTOM) */}
      {nearbyBuilding && (
        <div className="fixed bottom-36 sm:bottom-24 left-1/2 -translate-x-1/2 pointer-events-auto animate-pop z-30">
          <div className="blox-card px-5 py-3 flex items-center gap-3 border-amber-400">
            <div
              className="w-10 h-10 rounded-xl text-white flex items-center justify-center text-lg"
              style={{
                backgroundColor: 'isCanteen' in nearbyBuilding ? '#f97316' : nearbyBuilding.color,
              }}
            >
              {'isCanteen' in nearbyBuilding ? <Utensils className="w-5 h-5" /> : <Compass className="w-5 h-5" />}
            </div>
            <div className="text-left">
              <div className="font-display font-bold text-slate-800 text-sm sm:text-base">
                {'isCanteen' in nearbyBuilding ? 'Kantin Edublox & Hadiah' : nearbyBuilding.name}
              </div>
              <div className="text-xs text-slate-500 font-semibold">
                Tekan ENTER atau klik tombol untuk masuk
              </div>
            </div>
            <button
              onClick={onEnterNearbyBuilding}
              className="blox-btn px-4 py-2 bg-emerald-500 text-white text-sm"
            >
              MASUK
            </button>
          </div>
        </div>
      )}

      {/* TOUCH D-PAD (BOTTOM LEFT) */}
      <div className="fixed bottom-3 left-3 pointer-events-auto flex items-center gap-3">
        <div className="grid grid-cols-3 gap-1.5 w-32 h-32">
          <div />
          <button
            onPointerDown={() => onSetDpad('up', true)}
            onPointerUp={() => onSetDpad('up', false)}
            onPointerLeave={() => onSetDpad('up', false)}
            className="glass-hud rounded-xl text-white flex items-center justify-center text-lg active:bg-sky-500"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <div />
          <button
            onPointerDown={() => onSetDpad('left', true)}
            onPointerUp={() => onSetDpad('left', false)}
            onPointerLeave={() => onSetDpad('left', false)}
            className="glass-hud rounded-xl text-white flex items-center justify-center text-lg active:bg-sky-500"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="glass-hud rounded-xl flex items-center justify-center text-white/50 text-xs">
            <Gamepad2 className="w-4 h-4" />
          </div>
          <button
            onPointerDown={() => onSetDpad('right', true)}
            onPointerUp={() => onSetDpad('right', false)}
            onPointerLeave={() => onSetDpad('right', false)}
            className="glass-hud rounded-xl text-white flex items-center justify-center text-lg active:bg-sky-500"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div />
          <button
            onPointerDown={() => onSetDpad('down', true)}
            onPointerUp={() => onSetDpad('down', false)}
            onPointerLeave={() => onSetDpad('down', false)}
            className="glass-hud rounded-xl text-white flex items-center justify-center text-lg active:bg-sky-500"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
          <div />
        </div>
      </div>

      {/* JUMP & MOBILE TELEPORT (BOTTOM RIGHT) */}
      <div className="fixed bottom-3 right-3 pointer-events-auto flex flex-col items-end gap-2">
        <button
          onClick={() => onOpenModal('buildingsList')}
          className="lg:hidden glass-hud px-3.5 py-2.5 text-white text-xs font-bold flex items-center gap-2"
        >
          <MapPin className="w-3.5 h-3.5 text-amber-400" /> Daftar Gedung
        </button>
        <button
          onPointerDown={onJumpPlayer}
          className="blox-btn w-20 h-20 rounded-full bg-gradient-to-b from-amber-400 to-orange-500 text-white font-display text-sm flex flex-col items-center justify-center border-4 border-white shadow-xl"
        >
          <ArrowUp className="w-6 h-6" />
          <span>LOMPAT</span>
        </button>
      </div>
    </div>
  );
};
