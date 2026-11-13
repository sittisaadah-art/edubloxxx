import React from 'react';
import { X, Store, Coins, Coffee, Utensils, CupSoda, Pizza, Rocket, Trophy } from 'lucide-react';
import { Player, CanteenItem } from '../types';
import { CANTEEN_ITEMS } from '../data/initialData';
import { soundManager } from '../utils/audio';

interface CanteenModalProps {
  player: Player;
  onClose: () => void;
  onBuyItem: (item: CanteenItem) => void;
}

export const CanteenModal: React.FC<CanteenModalProps> = ({ player, onClose, onBuyItem }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'coffee':
        return <Coffee className="w-6 h-6" />;
      case 'utensils':
        return <Utensils className="w-6 h-6" />;
      case 'cup-soda':
        return <CupSoda className="w-6 h-6" />;
      case 'pizza':
        return <Pizza className="w-6 h-6" />;
      case 'rocket':
        return <Rocket className="w-6 h-6" />;
      case 'trophy':
      default:
        return <Trophy className="w-6 h-6" />;
    }
  };

  const handleBuy = (item: CanteenItem) => {
    if (player.coins < item.price) {
      soundManager.playSFX('wrong');
      alert('Koin Anda belum mencukupi! Jawab kuis di gedung materi untuk mengumpulkan koin.');
      return;
    }
    soundManager.playSFX('coin');
    onBuyItem(item);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/65 backdrop-blur-sm overflow-y-auto select-none">
      <div className="blox-card w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-pop shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500 to-orange-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Store className="w-7 h-7" />
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Kantin Edublox & Toko Hadiah</h2>
              <p className="text-xs text-amber-100">Tukarkan koin hasil kuis dengan jajanan virtual & efek khusus!</p>
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
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-50 flex-1">
          {/* Active buyer balance card */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-100 border border-amber-300 rounded-2xl p-3.5 mb-5 shadow-sm">
            <div className="font-bold text-amber-900 text-sm">
              Pembeli Aktif: <span className="text-indigo-700">{player.name} ({player.id})</span>
            </div>
            <div className="font-display font-bold text-lg text-amber-700 flex items-center gap-1.5">
              <Coins className="w-5 h-5" />
              <span>{player.coins} Koin</span>
            </div>
          </div>

          {/* Grid of items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {CANTEEN_ITEMS.map((item) => (
              <div
                key={item.id}
                className="bg-white p-4 rounded-2xl border-2 border-slate-200 flex flex-col justify-between text-center shadow-sm hover:border-amber-300 transition"
              >
                <div>
                  <div className={`w-12 h-12 mx-auto rounded-2xl ${item.color} text-white flex items-center justify-center mb-2 shadow`}>
                    {getIcon(item.icon)}
                  </div>
                  <h4 className="font-display font-bold text-sm text-slate-800">{item.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">{item.desc}</p>
                </div>
                <button
                  onClick={() => handleBuy(item)}
                  className="blox-btn mt-3.5 w-full py-2 bg-amber-500 text-white text-xs flex items-center justify-center gap-1.5"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Beli ({item.price} Koin)</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
