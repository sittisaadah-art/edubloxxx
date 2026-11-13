import React, { useState } from 'react';
import { X, Bot, Keyboard, Check } from 'lucide-react';
import { Player } from '../types';
import { AVATAR_PRESETS } from '../data/initialData';
import { soundManager } from '../utils/audio';

interface AvatarModalProps {
  players: Player[];
  onClose: () => void;
  onSave: (players: Player[]) => void;
}

export const AvatarModal: React.FC<AvatarModalProps> = ({ players, onClose, onSave }) => {
  const [editedPlayers, setEditedPlayers] = useState<Player[]>(JSON.parse(JSON.stringify(players)));

  const handleNameChange = (idx: number, name: string) => {
    const updated = [...editedPlayers];
    updated[idx].name = name;
    setEditedPlayers(updated);
  };

  const handleAvatarChange = (idx: number, avatarId: string) => {
    const updated = [...editedPlayers];
    updated[idx].avatarId = avatarId;
    setEditedPlayers(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editedPlayers);
    soundManager.playSFX('correct');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/65 backdrop-blur-sm overflow-y-auto select-none">
      <div className="blox-card w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-pop shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-sky-500 to-blue-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="w-7 h-7" />
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Kustomisasi Avatar & 4 Pemain Co-op</h2>
              <p className="text-xs text-sky-100">Atur nama siswa dan pilih karakter voxel untuk P1, P2, P3, dan P4</p>
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 bg-slate-50 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {editedPlayers.map((p, idx) => {
              const currentPreset = AVATAR_PRESETS.find((a) => a.id === p.avatarId) || AVATAR_PRESETS[0];

              return (
                <div key={p.id} className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-xl bg-indigo-600 text-white font-display font-bold text-xs">
                      PEMAIN {idx + 1} ({p.id})
                    </span>
                    <span className="text-xs font-bold text-amber-600">{p.coins} Koin</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Nama Siswa:</label>
                    <input
                      type="text"
                      value={p.name}
                      onChange={(e) => handleNameChange(idx, e.target.value)}
                      className="w-full p-2.5 rounded-xl border-2 border-slate-200 font-bold text-sm focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Pilih Karakter Avatar:</label>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center border-2 border-slate-300 shadow-inner"
                        style={{ backgroundColor: currentPreset.torso }}
                      >
                        <div
                          className="w-6 h-6 rounded-lg shadow"
                          style={{ backgroundColor: currentPreset.head }}
                        />
                      </div>
                      <select
                        value={p.avatarId}
                        onChange={(e) => handleAvatarChange(idx, e.target.value)}
                        className="flex-1 p-2.5 rounded-xl border-2 border-slate-200 font-bold text-sm bg-slate-50"
                      >
                        {AVATAR_PRESETS.map((av) => (
                          <option key={av.id} value={av.id}>
                            {av.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Keyboard Controls Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs sm:text-sm text-blue-900 shadow-sm">
            <div className="font-bold flex items-center gap-1.5 mb-2">
              <Keyboard className="w-4 h-4 text-blue-600" />
              <span>Kontrol Keyboard Multiplayer (Shared-Screen):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="font-bold text-blue-700">P1:</span> W A S D (Jalan) • Spasi (Lompat)
              </div>
              <div>
                <span className="font-bold text-emerald-700">P2:</span> Panah ↑ ↓ ← → (Jalan) • Enter (Lompat)
              </div>
              <div>
                <span className="font-bold text-amber-700">P3:</span> I J K L (Jalan) • U (Lompat)
              </div>
              <div>
                <span className="font-bold text-purple-700">P4:</span> T F G H (Jalan) • R (Lompat)
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="blox-btn px-6 py-3 bg-emerald-500 text-white text-base flex items-center gap-2"
            >
              <Check className="w-5 h-5" />
              <span>Simpan & Terapkan ke Dunia 3D</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
