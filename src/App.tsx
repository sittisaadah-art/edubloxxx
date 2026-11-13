import React, { useState, useEffect, useCallback } from 'react';
import {
  Building,
  Question,
  Player,
  AppSettings,
  RecapRecord,
  CanteenItem,
} from './types';
import {
  ORIGINAL_BUILDINGS,
  ORIGINAL_QUESTION_BANK,
  DEFAULT_SETTINGS,
  INITIAL_PLAYERS,
} from './data/initialData';
import { soundManager } from './utils/audio';
import { World3D } from './components/World3D';
import { HUD } from './components/HUD';
import { StartScreen } from './components/StartScreen';
import { BuildingModal } from './components/BuildingModal';
import { AvatarModal } from './components/AvatarModal';
import { CanteenModal } from './components/CanteenModal';
import { TeacherModal } from './components/TeacherModal';
import { RecapModal } from './components/RecapModal';
import { GuideModal } from './components/GuideModal';
import { MobileBuildingsListModal } from './components/MobileBuildingsListModal';

const STORAGE_KEY = 'edublox_city_sitty_v1';

export default function App() {
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [activeBuildingCode, setActiveBuildingCode] = useState<string | null>(null);

  // Core App State
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [buildings, setBuildings] = useState<Building[]>(ORIGINAL_BUILDINGS);
  const [originalQuestions, setOriginalQuestions] = useState<Question[]>(ORIGINAL_QUESTION_BANK);
  const [aiQuestions, setAiQuestions] = useState<Question[]>([]);
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [recapLogs, setRecapLogs] = useState<RecapRecord[]>([]);

  // HUD & Controls State
  const [activePlayerIdx, setActivePlayerIdx] = useState(0);
  const [moveMode, setMoveMode] = useState<'manual' | 'auto'>('manual');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [dpadState, setDpadState] = useState({ up: false, down: false, left: false, right: false });
  const [nearbyBuilding, setNearbyBuilding] = useState<Building | { isCanteen: true } | null>(null);

  // Projected 3D-to-2D coordinates
  const [projectedCoords, setProjectedCoords] = useState<{
    players: { id: string; name: string; x: number; y: number; visible: boolean }[];
    buildings: { code: string; name: string; icon: string; color: string; x: number; y: number; visible: boolean }[];
    monument: { x: number; y: number; visible: boolean };
  } | null>(null);

  // Camera action signal for World3D
  const [cameraSignal, setCameraSignal] = useState<{
    type: 'rotate' | 'zoom' | 'focus' | 'teleportPlaza' | 'teleportBuilding';
    value?: any;
    id: number;
  } | null>(null);

  // Toast notification state
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'info' | 'success' | 'warning' } | null>(null);

  const showToast = useCallback((text: string, type: 'info' | 'success' | 'warning' = 'info') => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg((prev) => (prev?.text === text ? null : prev));
    }, 2800);
  }, []);

  // Load saved state from LocalStorage on initial mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.settings) setSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
        if (parsed.buildings && parsed.buildings.length > 0) setBuildings(parsed.buildings);
        if (parsed.originalQuestions && parsed.originalQuestions.length > 0) setOriginalQuestions(parsed.originalQuestions);
        if (parsed.aiQuestions) setAiQuestions(parsed.aiQuestions);
        if (parsed.players && parsed.players.length === 4) setPlayers(parsed.players);
        if (parsed.recapLogs) setRecapLogs(parsed.recapLogs);
      }
    } catch (e) {
      console.warn('Failed to load LocalStorage:', e);
    }
  }, []);

  // Save state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          settings,
          buildings,
          originalQuestions,
          aiQuestions,
          players,
          recapLogs,
        })
      );
    } catch (e) {
      console.warn('Failed to save LocalStorage:', e);
    }
  }, [settings, buildings, originalQuestions, aiQuestions, players, recapLogs]);

  // Handle Game Start
  const handleStartAdventure = () => {
    setIsGameStarted(true);
    soundManager.enabled = audioEnabled;
    soundManager.startBGM();
    soundManager.playSFX('correct');
    showToast('Selamat datang di Kota Algoritma Edublox!', 'success');
  };

  const handleReturnHome = () => {
    setIsGameStarted(false);
    setActiveModal(null);
  };

  const handleToggleAudio = () => {
    const isNowOn = soundManager.toggle();
    setAudioEnabled(isNowOn);
    showToast(isNowOn ? 'Musik & Efek Suara Aktif' : 'Musik Dinonaktifkan', 'info');
  };

  const handleToggleMoveMode = () => {
    const nextMode = moveMode === 'manual' ? 'auto' : 'manual';
    setMoveMode(nextMode);
    showToast(`Mode gerak diubah ke: ${nextMode.toUpperCase()}`, 'info');
  };

  const handleSetDpad = (dir: 'up' | 'down' | 'left' | 'right', val: boolean) => {
    setDpadState((prev) => ({ ...prev, [dir]: val }));
  };

  // Camera Actions
  const handleRotateCamera = (delta: number) => {
    setCameraSignal({ type: 'rotate', value: delta, id: Date.now() });
  };
  const handleZoomCamera = (delta: number) => {
    setCameraSignal({ type: 'zoom', value: delta, id: Date.now() });
  };
  const handleFocusCamera = () => {
    setCameraSignal({ type: 'focus', id: Date.now() });
    showToast('Kamera difokuskan ke pemain aktif', 'info');
  };
  const handleTeleportToPlaza = () => {
    setCameraSignal({ type: 'teleportPlaza', id: Date.now() });
    showToast(`${players[activePlayerIdx].name} kembali ke Plaza Utama!`, 'info');
  };
  const handleTeleportToBuilding = (code: string) => {
    const b = buildings.find((x) => x.code === code);
    setCameraSignal({ type: 'teleportBuilding', value: code, id: Date.now() });
    if (b) showToast(`Teleport ke ${b.name}`, 'success');
  };

  // Jump Action
  const handleJumpPlayer = () => {
    const updated = [...players];
    const p = updated[activePlayerIdx];
    if (p.y <= 0.01) {
      p.vy = 0.32 * (p.jumpBoost || 1);
      setPlayers(updated);
      soundManager.playSFX('jump');
    }
  };

  // Building modal interactions
  const handleEnterBuilding = (code: string) => {
    setActiveBuildingCode(code);
    setActiveModal('building');
    soundManager.playSFX('select');
  };

  const handleEnterNearbyBuilding = () => {
    if (!nearbyBuilding) return;
    if ('isCanteen' in nearbyBuilding) {
      setActiveModal('canteen');
    } else {
      handleEnterBuilding(nearbyBuilding.code);
    }
  };

  // Canteen Purchase
  const handleBuyCanteenItem = (item: CanteenItem) => {
    const updated = [...players];
    const p = updated[activePlayerIdx];
    p.coins -= item.price;
    if (item.id === 'jetpack') {
      p.jumpBoost = 1.65;
    }
    setPlayers(updated);
    showToast(`${p.name} berhasil membeli ${item.name}!`, 'success');
  };

  // Log student activity & auto-sync to Google Sheets Webhook
  const handleLogActivity = (record: Omit<RecapRecord, 'timestamp' | 'className'>) => {
    const newEntry: RecapRecord = {
      timestamp: new Date().toLocaleString('id-ID'),
      className: settings.className,
      ...record,
    };
    setRecapLogs((prev) => [newEntry, ...prev]);

    // Send to Google Sheets Webhook if provided
    if (settings.webhookUrl && settings.webhookUrl.startsWith('http')) {
      fetch(settings.webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry),
      }).catch(() => {});
    }
  };

  const getQuestionCountForBuilding = (code: string) => {
    const orig = originalQuestions.filter((q) => q.buildingCode === code).length;
    const ai = aiQuestions.filter((q) => q.buildingCode === code).length;
    return orig + ai;
  };

  const activeBuilding = buildings.find((b) => b.code === activeBuildingCode);
  const questionsForActiveBuilding = activeBuildingCode
    ? [
        ...originalQuestions.filter((q) => q.buildingCode === activeBuildingCode),
        ...aiQuestions.filter((q) => q.buildingCode === activeBuildingCode),
      ]
    : [];

  return (
    <div className="relative w-full h-full overflow-hidden font-body select-none">
      {/* 3D WebGL Canvas */}
      <World3D
        buildings={buildings}
        players={players}
        activePlayerIdx={activePlayerIdx}
        moveMode={moveMode}
        dpadState={dpadState}
        onNearbyBuildingChange={setNearbyBuilding}
        onEnterBuilding={handleEnterBuilding}
        onProjectedCoordsChange={setProjectedCoords}
        cameraControlAction={cameraSignal}
      />

      {/* In-Game HUD (Visible after Start) */}
      {isGameStarted && (
        <HUD
          settings={settings}
          buildings={buildings}
          players={players}
          activePlayerIdx={activePlayerIdx}
          onSelectPlayer={setActivePlayerIdx}
          moveMode={moveMode}
          onToggleMoveMode={handleToggleMoveMode}
          audioEnabled={audioEnabled}
          onToggleAudio={handleToggleAudio}
          onReturnHome={handleReturnHome}
          onOpenModal={(id) => setActiveModal(id)}
          nearbyBuilding={nearbyBuilding}
          onEnterNearbyBuilding={handleEnterNearbyBuilding}
          onTeleportToBuilding={handleTeleportToBuilding}
          onTeleportToPlaza={handleTeleportToPlaza}
          onRotateCamera={handleRotateCamera}
          onZoomCamera={handleZoomCamera}
          onFocusCamera={handleFocusCamera}
          onJumpPlayer={handleJumpPlayer}
          onSetDpad={handleSetDpad}
          projectedCoords={projectedCoords}
          onSelectBuildingDirect={handleEnterBuilding}
          getQuestionCount={getQuestionCountForBuilding}
        />
      )}

      {/* Start Screen (Menu Awal) */}
      {!isGameStarted && (
        <StartScreen
          settings={settings}
          onStartAdventure={handleStartAdventure}
          onOpenModal={(id) => setActiveModal(id)}
          totalBuildings={buildings.length}
          totalOriginalQuestions={originalQuestions.length}
        />
      )}

      {/* Toast Notification Container */}
      {toastMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] pointer-events-none w-[90%] max-w-md animate-pop">
          <div
            className={`px-4 py-3 rounded-2xl border-2 shadow-xl font-bold text-sm text-center ${
              toastMsg.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-300'
                : toastMsg.type === 'warning'
                ? 'bg-amber-500 text-white border-yellow-200'
                : 'bg-slate-800 text-white border-sky-400'
            }`}
          >
            {toastMsg.text}
          </div>
        </div>
      )}

      {/* MODAL 1: Building Study & Quiz */}
      {activeModal === 'building' && activeBuilding && (
        <BuildingModal
          building={activeBuilding}
          onClose={() => setActiveModal(null)}
          questions={questionsForActiveBuilding}
          originalQuestions={originalQuestions}
          aiQuestions={aiQuestions}
          players={players}
          activePlayerIdx={activePlayerIdx}
          settings={settings}
          onUpdatePlayers={setPlayers}
          onLogActivity={handleLogActivity}
          onOpenRecap={() => setActiveModal('recap')}
        />
      )}

      {/* MODAL 2: Avatar & 4-Player Customization */}
      {activeModal === 'avatar' && (
        <AvatarModal
          players={players}
          onClose={() => setActiveModal(null)}
          onSave={(updated) => {
            setPlayers(updated);
            showToast('Karakter avatar & nama siswa diperbarui!', 'success');
          }}
        />
      )}

      {/* MODAL 3: Kantin Edublox Shop */}
      {activeModal === 'canteen' && (
        <CanteenModal
          player={players[activePlayerIdx]}
          onClose={() => setActiveModal(null)}
          onBuyItem={handleBuyCanteenItem}
        />
      )}

      {/* MODAL 4: Teacher Panel & Gemini AI Question Generator */}
      {activeModal === 'teacher' && (
        <TeacherModal
          settings={settings}
          onSaveSettings={(newSettings) => {
            setSettings(newSettings);
            showToast('Pengaturan guru berhasil disimpan!', 'success');
          }}
          buildings={buildings}
          onUpdateBuildings={setBuildings}
          originalQuestions={originalQuestions}
          onUpdateOriginalQuestions={setOriginalQuestions}
          aiQuestions={aiQuestions}
          onUpdateAiQuestions={setAiQuestions}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* MODAL 5: Rekap Nilai & Export Spreadsheet */}
      {activeModal === 'recap' && (
        <RecapModal
          logs={recapLogs}
          buildings={buildings}
          players={players}
          webhookUrl={settings.webhookUrl}
          onSaveWebhookUrl={(url) => setSettings((prev) => ({ ...prev, webhookUrl: url }))}
          onClearLogs={() => setRecapLogs([])}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* MODAL 6: Panduan Bermain */}
      {activeModal === 'guide' && <GuideModal onClose={() => setActiveModal(null)} />}

      {/* MODAL 7: Mobile Buildings List Teleport */}
      {activeModal === 'buildingsList' && (
        <MobileBuildingsListModal
          buildings={buildings}
          onTeleport={handleTeleportToBuilding}
          onEnter={handleEnterBuilding}
          onClose={() => setActiveModal(null)}
          getQuestionCount={getQuestionCountForBuilding}
        />
      )}
    </div>
  );
}
