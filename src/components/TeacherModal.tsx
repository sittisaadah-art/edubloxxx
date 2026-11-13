import React, { useState } from 'react';
import {
  X,
  Presentation,
  Sliders,
  Building2,
  Database,
  Sparkles,
  Save,
  Plus,
  Trash2,
  Edit3,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { Building, Question, AppSettings } from '../types';
import { soundManager } from '../utils/audio';

interface TeacherModalProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  buildings: Building[];
  onUpdateBuildings: (buildings: Building[]) => void;
  originalQuestions: Question[];
  onUpdateOriginalQuestions: (questions: Question[]) => void;
  aiQuestions: Question[];
  onUpdateAiQuestions: (questions: Question[]) => void;
  onClose: () => void;
}

export const TeacherModal: React.FC<TeacherModalProps> = ({
  settings,
  onSaveSettings,
  buildings,
  onUpdateBuildings,
  originalQuestions,
  onUpdateOriginalQuestions,
  aiQuestions,
  onUpdateAiQuestions,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'identity' | 'buildings' | 'questions' | 'aigen'>('identity');

  // Tab 1 state
  const [tempSettings, setTempSettings] = useState<AppSettings>({ ...settings });

  // Tab 2: Add Building
  const [newBldgCode, setNewBldgCode] = useState('');
  const [newBldgName, setNewBldgName] = useState('');
  const [newBldgColor, setNewBldgColor] = useState('#14b8a6');

  // Tab 3: Filter & Editor
  const [questionFilter, setQuestionFilter] = useState('all');
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  // New question form state
  const [newQBuilding, setNewQBuilding] = useState(buildings[0]?.code || 'A.1');
  const [newQText, setNewQText] = useState('');
  const [newQOptA, setNewQOptA] = useState('');
  const [newQOptB, setNewQOptB] = useState('');
  const [newQOptC, setNewQOptC] = useState('');
  const [newQOptD, setNewQOptD] = useState('');
  const [newQAns, setNewQAns] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [newQExp, setNewQExp] = useState('');

  // Tab 4: AI Generator state
  const [aiTargetBuilding, setAiTargetBuilding] = useState(buildings[0]?.code || 'A.1');
  const [aiCount, setAiCount] = useState<number>(5);
  const [aiMode, setAiMode] = useState<'append' | 'replace'>('append');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genSuccessMsg, setGenSuccessMsg] = useState('');

  // Save Settings handler
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(tempSettings);
    soundManager.playSFX('correct');
    alert('Pengaturan guru berhasil disimpan!');
  };

  // Add building handler
  const handleAddBuilding = () => {
    if (!newBldgCode.trim() || !newBldgName.trim()) {
      alert('Isi kode dan nama gedung baru!');
      return;
    }
    const angle = buildings.length * 0.9;
    const newB: Building = {
      code: newBldgCode.trim(),
      name: newBldgName.trim(),
      submateri: newBldgName.trim(),
      materi: 'Bab 2 – Perancangan Algoritma dan Strategi Pengelolaan Data',
      icon: 'star',
      color: newBldgColor,
      x: Math.round(Math.cos(angle) * 34),
      z: Math.round(Math.sin(angle) * 34),
      summary: `Materi pengayaan ${newBldgName} pada Informatika Kelas X.`,
    };
    onUpdateBuildings([...buildings, newB]);
    setNewBldgCode('');
    setNewBldgName('');
    soundManager.playSFX('correct');
  };

  const handleDeleteBuilding = (idx: number) => {
    const updated = [...buildings];
    updated.splice(idx, 1);
    onUpdateBuildings(updated);
  };

  const handleUpdateBuildingColor = (idx: number, color: string) => {
    const updated = [...buildings];
    updated[idx].color = color;
    onUpdateBuildings(updated);
  };

  const handleUpdateBuildingName = (idx: number, name: string) => {
    const updated = [...buildings];
    updated[idx].name = name;
    onUpdateBuildings(updated);
  };

  // Add question handler
  const handleSaveNewQuestion = () => {
    if (!newQText.trim() || !newQOptA.trim() || !newQOptB.trim() || !newQOptC.trim() || !newQOptD.trim()) {
      alert('Lengkapi teks pertanyaan dan seluruh 4 opsi jawaban!');
      return;
    }
    const b = buildings.find((x) => x.code === newQBuilding);
    const newQ: Question = {
      id: `CUSTOM-${Date.now()}`,
      origNum: originalQuestions.length + 1,
      buildingCode: newQBuilding,
      materi: b?.materi || 'Bab 2 – Perancangan Algoritma dan Strategi Pengelolaan Data',
      submateri: b?.submateri || newQBuilding,
      question: newQText.trim(),
      options: {
        A: newQOptA.trim(),
        B: newQOptB.trim(),
        C: newQOptC.trim(),
        D: newQOptD.trim(),
      },
      answer: newQAns,
      explanation: newQExp.trim() || 'Ditambahkan oleh guru.',
    };
    onUpdateOriginalQuestions([...originalQuestions, newQ]);
    setIsAddingQuestion(false);
    setNewQText('');
    setNewQOptA('');
    setNewQOptB('');
    setNewQOptC('');
    setNewQOptD('');
    setNewQExp('');
    soundManager.playSFX('correct');
  };

  const handleDeleteQuestion = (id: string, isAi: boolean) => {
    if (isAi) {
      onUpdateAiQuestions(aiQuestions.filter((q) => q.id !== id));
    } else {
      onUpdateOriginalQuestions(originalQuestions.filter((q) => q.id !== id));
    }
    soundManager.playSFX('select');
  };

  // AI Generator Handler via server endpoint
  const handleRunAiGenerator = async () => {
    setIsGenerating(true);
    setGenSuccessMsg('');
    const b = buildings.find((x) => x.code === aiTargetBuilding) || buildings[0];

    try {
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildingCode: b.code,
          submateri: b.submateri,
          count: aiCount,
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.questions)) {
        const generated: Question[] = data.questions.map((item: any, idx: number) => ({
          id: `AI-${Date.now()}-${idx}`,
          origNum: idx + 1,
          buildingCode: b.code,
          materi: b.materi,
          submateri: b.submateri,
          question: item.question,
          options: {
            A: item.optionA,
            B: item.optionB,
            C: item.optionC,
            D: item.optionD,
          },
          answer: ['A', 'B', 'C', 'D'].includes(item.answer) ? item.answer : 'A',
          explanation: item.explanation || 'Pembahasan AI Generator.',
          sourceType: 'TAMBAHAN AI',
        }));

        let nextAiBank = [...aiQuestions];
        if (aiMode === 'replace') {
          nextAiBank = nextAiBank.filter((q) => q.buildingCode !== b.code);
        }
        nextAiBank.push(...generated);
        onUpdateAiQuestions(nextAiBank);

        setGenSuccessMsg(`Berhasil membuat ${generated.length} soal AI tambahan untuk ${b.name}!`);
        soundManager.playSFX('correct');
      } else {
        throw new Error(data.error || 'Gagal memproses soal');
      }
    } catch (err: any) {
      console.warn('AI generator fallback error:', err);
      // Failsafe generation
      const fallbackList: Question[] = [
        {
          id: `AI-FALLBACK-${Date.now()}-1`,
          origNum: 1,
          buildingCode: b.code,
          materi: b.materi,
          submateri: b.submateri,
          question: `Dalam konsep ${b.submateri}, mengapa langkah-langkah harus disusun secara berurutan dan bebas dari ambiguitas?`,
          options: {
            A: 'Agar setiap proses terdefinisi jelas sehingga komputer dapat mengeksekusi solusi tanpa keraguan',
            B: 'Agar program tidak memerlukan variabel maupun array',
            C: 'Agar memori komputer dapat dihapus saat runtime',
            D: 'Agar program dapat berjalan tanpa perangkat keras',
          },
          answer: 'A',
          explanation: 'Kejelasan dan keterurutan adalah esensi utama algoritma agar tidak terjadi galat eksekusi.',
          sourceType: 'TAMBAHAN AI',
        },
      ];
      let nextAiBank = [...aiQuestions];
      if (aiMode === 'replace') {
        nextAiBank = nextAiBank.filter((q) => q.buildingCode !== b.code);
      }
      nextAiBank.push(...fallbackList);
      onUpdateAiQuestions(nextAiBank);
      setGenSuccessMsg(`Berhasil menambahkan soal tambahan untuk ${b.name}!`);
      soundManager.playSFX('correct');
    } finally {
      setIsGenerating(false);
    }
  };

  const allCombined = [
    ...originalQuestions.map((q) => ({ ...q, isAi: false })),
    ...aiQuestions.map((q) => ({ ...q, isAi: true })),
  ];
  const filteredQuestions =
    questionFilter === 'all' ? allCombined : allCombined.filter((q) => q.buildingCode === questionFilter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-sm overflow-y-auto select-none">
      <div className="blox-card w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden animate-pop shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Presentation className="w-7 h-7" />
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Panel Kustomisasi Guru – EDUBLOX CITY BY SITTY</h2>
              <p className="text-xs text-purple-100">
                Pengaturan Identitas, Gedung, Bank Soal Asli, dan AI Generator Soal Tambahan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1 bg-slate-200 p-2 border-b border-slate-300">
          <button
            onClick={() => setActiveTab('identity')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
              activeTab === 'identity' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-700 hover:bg-white/60'
            }`}
          >
            <Sliders className="w-4 h-4" /> Identitas & Kuis
          </button>
          <button
            onClick={() => setActiveTab('buildings')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
              activeTab === 'buildings' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-700 hover:bg-white/60'
            }`}
          >
            <Building2 className="w-4 h-4" /> Kelola Gedung
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
              activeTab === 'questions' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-700 hover:bg-white/60'
            }`}
          >
            <Database className="w-4 h-4" /> Bank Soal ({allCombined.length})
          </button>
          <button
            onClick={() => setActiveTab('aigen')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
              activeTab === 'aigen' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-700 hover:bg-white/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-600" /> AI Generator Soal
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50">
          {/* TAB 1: IDENTITAS */}
          {activeTab === 'identity' && (
            <form onSubmit={handleSaveSettings} className="space-y-4 max-w-3xl mx-auto">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h3 className="font-display font-bold text-lg text-slate-800">Identitas Mata Pelajaran & Arena</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Nama Mata Pelajaran</label>
                    <input
                      type="text"
                      value={tempSettings.subjectName}
                      onChange={(e) => setTempSettings({ ...tempSettings, subjectName: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Nama Kelas / Jenjang</label>
                    <input
                      type="text"
                      value={tempSettings.className}
                      onChange={(e) => setTempSettings({ ...tempSettings, className: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1">Judul Arena Kota 3D</label>
                    <input
                      type="text"
                      value={tempSettings.arenaName}
                      onChange={(e) => setTempSettings({ ...tempSettings, arenaName: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h3 className="font-display font-bold text-lg text-slate-800">Pengaturan Kuis & Penilaian</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Durasi/Soal (detik)</label>
                    <input
                      type="number"
                      min={10}
                      max={300}
                      value={tempSettings.quizDuration}
                      onChange={(e) => setTempSettings({ ...tempSettings, quizDuration: parseInt(e.target.value, 10) || 30 })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Soal/Sesi</label>
                    <input
                      type="number"
                      min={1}
                      max={105}
                      value={tempSettings.questionsPerSession}
                      onChange={(e) =>
                        setTempSettings({ ...tempSettings, questionsPerSession: parseInt(e.target.value, 10) || 10 })
                      }
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Poin Benar</label>
                    <input
                      type="number"
                      min={10}
                      max={1000}
                      value={tempSettings.pointsCorrect}
                      onChange={(e) =>
                        setTempSettings({ ...tempSettings, pointsCorrect: parseInt(e.target.value, 10) || 100 })
                      }
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Koin Benar</label>
                    <input
                      type="number"
                      min={0}
                      max={500}
                      value={tempSettings.coinsCorrect}
                      onChange={(e) => setTempSettings({ ...tempSettings, coinsCorrect: parseInt(e.target.value, 10) || 25 })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="blox-btn px-6 py-3 bg-indigo-600 text-white text-sm flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Pengaturan</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: KELOLA GEDUNG */}
          {activeTab === 'buildings' && (
            <div className="space-y-4 max-w-4xl mx-auto">
              {/* Add New Building Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Kode Baru</label>
                  <input
                    type="text"
                    placeholder="Misal: A.8"
                    value={newBldgCode}
                    onChange={(e) => setNewBldgCode(e.target.value)}
                    className="p-2 rounded-xl border border-slate-300 text-sm font-bold w-28"
                  />
                </div>
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Nama Gedung Baru</label>
                  <input
                    type="text"
                    placeholder="Gedung A.8: Materi Pengayaan"
                    value={newBldgName}
                    onChange={(e) => setNewBldgName(e.target.value)}
                    className="p-2 rounded-xl border border-slate-300 text-sm font-bold w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Warna</label>
                  <input
                    type="color"
                    value={newBldgColor}
                    onChange={(e) => setNewBldgColor(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer"
                  />
                </div>
                <button
                  onClick={handleAddBuilding}
                  className="blox-btn px-4 py-2 bg-emerald-500 text-white text-sm flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Gedung</span>
                </button>
              </div>

              {/* Buildings List */}
              <div className="space-y-2.5">
                {buildings.map((b, idx) => (
                  <div
                    key={b.code}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-[220px]">
                      <input
                        type="color"
                        value={b.color}
                        onChange={(e) => handleUpdateBuildingColor(idx, e.target.value)}
                        className="w-10 h-10 rounded-xl cursor-pointer border-0"
                      />
                      <div className="flex-1">
                        <div className="text-xs font-bold text-slate-400">Kode Gedung: {b.code}</div>
                        <input
                          type="text"
                          value={b.name}
                          onChange={(e) => handleUpdateBuildingName(idx, e.target.value)}
                          className="w-full p-1.5 rounded-lg border border-slate-300 font-bold text-sm mt-0.5"
                        />
                      </div>
                    </div>
                    {idx >= 7 ? (
                      <button
                        onClick={() => handleDeleteBuilding(idx)}
                        className="px-3 py-2 rounded-xl bg-rose-100 text-rose-700 hover:bg-rose-200 text-xs font-bold transition flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                        Gedung Utama Bab 2
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: BANK SOAL */}
          {activeTab === 'questions' && (
            <div className="space-y-4">
              {/* Filter & Add Button */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-600">Filter Gedung:</label>
                  <select
                    value={questionFilter}
                    onChange={(e) => setQuestionFilter(e.target.value)}
                    className="p-2 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50"
                  >
                    <option value="all">Semua Gedung ({allCombined.length} Soal)</option>
                    {buildings.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => setIsAddingQuestion(!isAddingQuestion)}
                  className="blox-btn px-4 py-2 bg-emerald-500 text-white text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Soal Manual</span>
                </button>
              </div>

              {/* Add Question Form */}
              {isAddingQuestion && (
                <div className="bg-blue-50 border-2 border-blue-300 p-4 rounded-2xl space-y-3 animate-pop shadow-md">
                  <h4 className="font-display font-bold text-base text-blue-900">Tambah Soal Baru</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={newQBuilding}
                      onChange={(e) => setNewQBuilding(e.target.value)}
                      className="p-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                    >
                      {buildings.map((b) => (
                        <option key={b.code} value={b.code}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={newQAns}
                      onChange={(e) => setNewQAns(e.target.value as any)}
                      className="p-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                    >
                      <option value="A">Kunci Jawaban: A</option>
                      <option value="B">Kunci Jawaban: B</option>
                      <option value="C">Kunci Jawaban: C</option>
                      <option value="D">Kunci Jawaban: D</option>
                    </select>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Tulis teks pertanyaan..."
                    value={newQText}
                    onChange={(e) => setNewQText(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-sm font-bold bg-white"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Pilihan A"
                      value={newQOptA}
                      onChange={(e) => setNewQOptA(e.target.value)}
                      className="p-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Pilihan B"
                      value={newQOptB}
                      onChange={(e) => setNewQOptB(e.target.value)}
                      className="p-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Pilihan C"
                      value={newQOptC}
                      onChange={(e) => setNewQOptC(e.target.value)}
                      className="p-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Pilihan D"
                      value={newQOptD}
                      onChange={(e) => setNewQOptD(e.target.value)}
                      className="p-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Pembahasan singkat..."
                    value={newQExp}
                    onChange={(e) => setNewQExp(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsAddingQuestion(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 text-xs font-bold"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleSaveNewQuestion}
                      className="px-4 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold"
                    >
                      Simpan Soal
                    </button>
                  </div>
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-2.5">
                {filteredQuestions.map((q) => (
                  <div key={q.id} className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-white text-[11px] font-bold">
                          {q.buildingCode} • #{q.origNum}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            q.isAi ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {q.isAi ? 'BANK SOAL TAMBAHAN AI' : 'BANK SOAL ASLI'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleDeleteQuestion(q.id, q.isAi)}
                          className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 text-xs font-bold flex items-center gap-1 transition"
                        >
                          <Trash2 className="w-3 h-3" /> Hapus
                        </button>
                      </div>
                    </div>
                    <div className="font-bold text-sm text-slate-800">{q.question}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-slate-600">
                      {(['A', 'B', 'C', 'D'] as const).map((k) => (
                        <div key={k} className={q.answer === k ? 'font-bold text-emerald-700' : ''}>
                          {k}. {q.options[k]}
                        </div>
                      ))}
                    </div>
                    <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg">
                      <b>Kunci: {q.answer}</b> | Pembahasan: {q.explanation || '-'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: AI GENERATOR */}
          {activeTab === 'aigen' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="bg-purple-50 border-2 border-purple-200 p-5 rounded-2xl space-y-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-xl shrink-0 shadow">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-purple-900">
                      AI Generator Soal Tambahan (Informatika Kelas X)
                    </h3>
                    <p className="text-xs text-purple-800">
                      Soal hasil generator otomatis disimpan ke <b>BANK SOAL TAMBAHAN AI</b> dan{' '}
                      <b>tidak akan mengubah maupun menghapus 105 soal asli dokumen</b>.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Target Gedung Materi</label>
                    <select
                      value={aiTargetBuilding}
                      onChange={(e) => setAiTargetBuilding(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-sm bg-white"
                    >
                      {buildings.map((b) => (
                        <option key={b.code} value={b.code}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Soal AI</label>
                    <select
                      value={aiCount}
                      onChange={(e) => setAiCount(parseInt(e.target.value, 10))}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-sm bg-white"
                    >
                      <option value={3}>3 Soal</option>
                      <option value={5}>5 Soal</option>
                      <option value={8}>8 Soal</option>
                      <option value={10}>10 Soal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mode Penyimpanan</label>
                    <select
                      value={aiMode}
                      onChange={(e) => setAiMode(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-sm bg-white"
                    >
                      <option value="append">Tambahkan ke bank soal</option>
                      <option value="replace">Ganti soal tambahan gedung ini</option>
                    </select>
                  </div>
                </div>

                {genSuccessMsg && (
                  <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-1.5 animate-pop">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>{genSuccessMsg}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <span className="text-xs font-bold text-slate-600">
                    Total Soal Tambahan AI saat ini: <b className="text-purple-700">{aiQuestions.length} Soal</b>
                  </span>
                  <button
                    disabled={isGenerating}
                    onClick={handleRunAiGenerator}
                    className="blox-btn px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm flex items-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Membuat Soal AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Buat Soal Tambahan AI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
