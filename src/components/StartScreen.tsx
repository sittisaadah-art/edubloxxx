import React from 'react';
import {
  GraduationCap,
  Boxes,
  Play,
  UserCheck,
  BookOpen,
  Presentation,
  ChartBar,
  Building2,
  HelpCircle,
  Users2,
} from 'lucide-react';
import { AppSettings } from '../types';

interface StartScreenProps {
  settings: AppSettings;
  onStartAdventure: () => void;
  onOpenModal: (modalId: string) => void;
  totalBuildings: number;
  totalOriginalQuestions: number;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  settings,
  onStartAdventure,
  onOpenModal,
  totalBuildings,
  totalOriginalQuestions,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto select-none">
      <div className="blox-card w-full max-w-4xl p-6 md:p-8 text-center animate-pop relative overflow-hidden">
        {/* Decorative corner glows */}
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-amber-300/40 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-sky-400/40 rounded-full blur-2xl pointer-events-none" />

        {/* Grade & Subject Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-xs sm:text-sm mb-3 border border-indigo-200">
          <GraduationCap className="w-4 h-4 text-indigo-600" />
          <span>{settings.subjectName.toUpperCase()} • {settings.className.toUpperCase()}</span>
        </div>

        {/* Logo & Main Title */}
        <div className="flex flex-col items-center justify-center mb-2">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center text-white text-3xl sm:text-4xl shadow-lg border-4 border-white mb-3 animate-float">
            <Boxes className="w-9 h-9 sm:w-11 sm:h-11" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent drop-shadow-sm">
            EDUBLOX CITY BY SITTY
          </h1>
          <p className="text-base sm:text-xl font-display font-semibold text-amber-600 mt-1">
            {settings.arenaName}
          </p>
          <p className="text-sm sm:text-base font-bold text-slate-600 mt-1 max-w-2xl">
            Bab 2 – Perancangan Algoritma dan Strategi Pengelolaan Data
          </p>
        </div>

        {/* 3D Voxel Mini City SVG Illustration */}
        <div className="my-4 mx-auto max-w-xl bg-gradient-to-b from-sky-200 to-emerald-100 rounded-2xl p-3 border-2 border-sky-300 shadow-inner">
          <svg viewBox="0 0 480 110" className="w-full h-24 sm:h-28">
            {/* Blocky Clouds */}
            <rect x="40" y="14" width="46" height="14" rx="4" fill="#ffffff" opacity="0.9" />
            <rect x="52" y="8" width="24" height="10" rx="3" fill="#ffffff" />
            <rect x="360" y="18" width="52" height="14" rx="4" fill="#ffffff" opacity="0.9" />
            {/* Left Building */}
            <rect x="55" y="45" width="45" height="45" rx="4" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" />
            <rect x="65" y="55" width="10" height="10" fill="#fef08a" />
            <rect x="80" y="55" width="10" height="10" fill="#fef08a" />
            {/* Center-Left Building */}
            <rect x="115" y="32" width="50" height="58" rx="4" fill="#10b981" stroke="#047857" strokeWidth="2" />
            <rect x="125" y="44" width="12" height="12" fill="#ffffff" />
            <rect x="143" y="44" width="12" height="12" fill="#ffffff" />
            {/* Center Crystal Monument */}
            <polygon points="240,12 256,42 240,72 224,42" fill="#38bdf8" stroke="#0284c7" strokeWidth="2" />
            <rect x="220" y="72" width="40" height="18" rx="3" fill="#cbd5e1" />
            {/* Right Building */}
            <rect x="315" y="36" width="48" height="54" rx="4" fill="#f59e0b" stroke="#b45309" strokeWidth="2" />
            <rect x="326" y="48" width="10" height="10" fill="#ffffff" />
            <rect x="342" y="48" width="10" height="10" fill="#ffffff" />
            <rect x="378" y="46" width="46" height="44" rx="4" fill="#8b5cf6" stroke="#5b21b6" strokeWidth="2" />
            {/* Grass Ground */}
            <rect x="15" y="88" width="450" height="16" rx="6" fill="#22c55e" stroke="#15803d" strokeWidth="2" />
          </svg>
          <div className="flex flex-wrap justify-center gap-3 text-xs font-bold text-slate-700 mt-1">
            <span className="bg-white/90 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              {totalBuildings} Gedung Submateri
            </span>
            <span className="bg-white/90 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
              {totalOriginalQuestions} Soal Asli Bab 2
            </span>
            <span className="bg-white/90 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Users2 className="w-3.5 h-3.5 text-purple-600" />
              4 Pemain Co-op & Split Screen
            </span>
          </div>
        </div>

        {/* Main Action Buttons */}
        <div className="flex flex-col items-center gap-3 mt-4">
          <button
            onClick={onStartAdventure}
            className="blox-btn w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xl sm:text-2xl flex items-center justify-center gap-3 shadow-lg"
          >
            <Play className="w-6 h-6 fill-white" />
            <span>MULAI PETUALANGAN</span>
          </button>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full mt-1">
            <button
              onClick={() => onOpenModal('avatar')}
              className="blox-btn py-3 px-3 bg-gradient-to-b from-sky-400 to-blue-600 text-white text-sm sm:text-base flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>PILIH AVATAR</span>
            </button>
            <button
              onClick={() => onOpenModal('guide')}
              className="blox-btn py-3 px-3 bg-gradient-to-b from-amber-400 to-orange-500 text-white text-sm sm:text-base flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>PANDUAN</span>
            </button>
            <button
              onClick={() => onOpenModal('teacher')}
              className="blox-btn py-3 px-3 bg-gradient-to-b from-purple-500 to-indigo-600 text-white text-sm sm:text-base flex items-center justify-center gap-2"
            >
              <Presentation className="w-4 h-4" />
              <span>PANEL GURU</span>
            </button>
            <button
              onClick={() => onOpenModal('recap')}
              className="blox-btn py-3 px-3 bg-gradient-to-b from-rose-500 to-pink-600 text-white text-sm sm:text-base flex items-center justify-center gap-2"
            >
              <ChartBar className="w-4 h-4" />
              <span>REKAP NILAI</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
