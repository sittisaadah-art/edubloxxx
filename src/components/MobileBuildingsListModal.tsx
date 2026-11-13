import React from 'react';
import { X, Compass, ArrowRight } from 'lucide-react';
import { Building } from '../types';

interface MobileBuildingsListModalProps {
  buildings: Building[];
  onTeleport: (code: string) => void;
  onEnter: (code: string) => void;
  onClose: () => void;
  getQuestionCount: (code: string) => number;
}

export const MobileBuildingsListModal: React.FC<MobileBuildingsListModalProps> = ({
  buildings,
  onTeleport,
  onEnter,
  onClose,
  getQuestionCount,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm select-none">
      <div className="blox-card w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden animate-pop shadow-2xl">
        <div className="p-4 bg-blue-600 text-white flex items-center justify-between">
          <h3 className="font-display font-bold text-lg flex items-center gap-2">
            <Compass className="w-5 h-5" />
            <span>Pilih Tujuan Teleport</span>
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-2 bg-slate-50 flex-1">
          {buildings.map((b) => (
            <div
              key={b.code}
              className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between gap-2"
            >
              <div>
                <div className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.color }} />
                  <span>{b.name}</span>
                </div>
                <div className="text-xs text-slate-500">{getQuestionCount(b.code)} Soal Tersedia</div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    onTeleport(b.code);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-sky-500 text-white text-xs font-bold"
                >
                  Teleport
                </button>
                <button
                  onClick={() => {
                    onEnter(b.code);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-bold flex items-center gap-1"
                >
                  <span>Masuk</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
