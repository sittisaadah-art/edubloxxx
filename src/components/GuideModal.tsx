import React from 'react';
import { X, BookOpen, Compass, Grid, Trophy, Sparkles } from 'lucide-react';

interface GuideModalProps {
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/65 backdrop-blur-sm overflow-y-auto select-none">
      <div className="blox-card w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-pop shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-7 h-7" />
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Panduan Petualangan Edublox City</h2>
              <p className="text-xs text-amber-100">Cara bermain, menjelajah kota, dan menyelesaikan tantangan Bab 2</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm text-slate-700 bg-slate-50 flex-1">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-blue-600 mb-1">1. Jelajahi Kota Algoritma Edublox 3D</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Gunakan tombol <b>W A S D</b>, <b>Panah Keyboard</b>, atau <b>D-Pad di layar sentuh</b> untuk berjalan menyusuri jalan kota. Seret layar dengan mouse atau jari untuk memutar kamera 360°, dan scroll mouse untuk zoom in/out.
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-emerald-600 mb-1">2. Masuk ke 7 Gedung Submateri Bab 2</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Dekati pintu gedung materi hingga muncul tombol <b>MASUK</b>, atau klik menu <b>Teleport</b> di bilah kiri layar untuk langsung berpindah ke gedung A.1 sampai A.7. Pelajari ringkasan konsep sebelum mulai menjawab kuis.
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-purple-600 mb-1">3. Mode Kuis Individu, Kelompok & 4-Way Split Screen</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Pilih <b>Kuis Individu</b> untuk berlatih mandiri, <b>Kuis Berkelompok</b> untuk berdiskusi dengan tim, atau <b>Kuis Serentak 4P (4-Way Split Screen)</b> agar P1 hingga P4 dapat bersaing menjawab soal yang sama secara bersamaan di layar yang sama!
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-amber-600 mb-1">4. Kumpulkan Skor & Belanja di Kantin Edublox</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Setiap jawaban benar memberikan skor dan koin emas. Tukarkan koin di <b>Kantin Edublox</b> untuk mendapatkan jajanan virtual dan sayap lompat tinggi!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
