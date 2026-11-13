import React, { useState } from 'react';
import {
  X,
  PieChart,
  FileSpreadsheet,
  Copy,
  Trash2,
  Globe,
  Save,
  Check,
} from 'lucide-react';
import { RecapRecord, Building, Player } from '../types';
import { soundManager } from '../utils/audio';

interface RecapModalProps {
  logs: RecapRecord[];
  buildings: Building[];
  players: Player[];
  webhookUrl: string;
  onSaveWebhookUrl: (url: string) => void;
  onClearLogs: () => void;
  onClose: () => void;
}

export const RecapModal: React.FC<RecapModalProps> = ({
  logs,
  buildings,
  players,
  webhookUrl,
  onSaveWebhookUrl,
  onClearLogs,
  onClose,
}) => {
  const [studentFilter, setStudentFilter] = useState('all');
  const [buildingFilter, setBuildingFilter] = useState('all');
  const [localWebhook, setLocalWebhook] = useState(webhookUrl);
  const [copiedNotice, setCopiedNotice] = useState(false);

  const uniqueStudents = [...new Set(logs.map((l) => l.studentName))];
  const filtered = logs.filter((l) => {
    if (studentFilter !== 'all' && l.studentName !== studentFilter) return false;
    if (buildingFilter !== 'all' && l.buildingCode !== buildingFilter) return false;
    return true;
  });

  const totalActs = filtered.length;
  const correctCount = filtered.filter((l) => l.isCorrect).length;
  const wrongCount = totalActs - correctCount;
  const accuracy = totalActs > 0 ? Math.round((correctCount / totalActs) * 100) : 0;
  const highestScore = players.reduce((max, p) => Math.max(max, p.score), 0);

  const exportCSV = () => {
    if (logs.length === 0) {
      alert('Belum ada data rekap nilai untuk diekspor!');
      return;
    }
    const headers = [
      'Waktu',
      'Kelas',
      'Nama Siswa',
      'ID Pemain',
      'Kode Gedung',
      'Materi',
      'Submateri',
      'No Soal',
      'Pertanyaan',
      'Jawaban Siswa',
      'Kunci Jawaban',
      'Status',
      'Poin',
      'Skor Total',
    ];

    const rows = logs.map((l) =>
      [
        l.timestamp,
        l.className,
        l.studentName,
        l.playerId,
        l.buildingCode,
        l.materi,
        l.submateri,
        l.origNum,
        l.question,
        l.studentAnswer,
        l.correctAnswer,
        l.isCorrect ? 'BENAR' : 'SALAH',
        l.points,
        l.totalScore,
      ]
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
        .join(',')
    );

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rekap_Nilai_Edublox_City_By_Sitty_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    soundManager.playSFX('coin');
  };

  const copyTSV = () => {
    if (logs.length === 0) {
      alert('Belum ada data rekap nilai untuk disalin!');
      return;
    }
    const headers = [
      'Waktu',
      'Kelas',
      'Nama Siswa',
      'ID Pemain',
      'Kode Gedung',
      'Submateri',
      'No Soal',
      'Pertanyaan',
      'Jawaban Siswa',
      'Kunci',
      'Status',
      'Poin',
      'Skor Total',
    ];

    const rows = logs.map((l) =>
      [
        l.timestamp,
        l.className,
        l.studentName,
        l.playerId,
        l.buildingCode,
        l.submateri,
        l.origNum,
        l.question,
        l.studentAnswer,
        l.correctAnswer,
        l.isCorrect ? 'BENAR' : 'SALAH',
        l.points,
        l.totalScore,
      ]
        .map((v) => String(v ?? '').replace(/\t|\n/g, ' '))
        .join('\t')
    );

    const tsv = [headers.join('\t'), ...rows].join('\n');
    navigator.clipboard.writeText(tsv).then(() => {
      setCopiedNotice(true);
      soundManager.playSFX('coin');
      setTimeout(() => setCopiedNotice(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-sm overflow-y-auto select-none">
      <div className="blox-card w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden animate-pop shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-600 to-pink-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PieChart className="w-7 h-7" />
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Rekap Nilai & Ekspor Spreadsheet</h2>
              <p className="text-xs text-rose-100">
                Pencatatan otomatis aktivitas kuis siswa, statistik akurasi, CSV UTF-8, TSV, & Google Sheets
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

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50 space-y-4">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-sm">
              <div className="text-[11px] font-bold text-slate-400">Siswa Aktif</div>
              <div className="font-display font-bold text-xl text-slate-800">{Math.max(uniqueStudents.length, 4)}</div>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-sm">
              <div className="text-[11px] font-bold text-slate-400">Total Aktivitas</div>
              <div className="font-display font-bold text-xl text-blue-600">{totalActs}</div>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-sm">
              <div className="text-[11px] font-bold text-slate-400">Jawaban Benar</div>
              <div className="font-display font-bold text-xl text-emerald-600">{correctCount}</div>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-sm">
              <div className="text-[11px] font-bold text-slate-400">Jawaban Salah</div>
              <div className="font-display font-bold text-xl text-rose-600">{wrongCount}</div>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-sm">
              <div className="text-[11px] font-bold text-slate-400">Akurasi</div>
              <div className="font-display font-bold text-xl text-purple-600">{accuracy}%</div>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-sm">
              <div className="text-[11px] font-bold text-slate-400">Skor Tertinggi</div>
              <div className="font-display font-bold text-xl text-amber-600">{highestScore}</div>
            </div>
          </div>

          {/* Filters & Export Actions */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={studentFilter}
                onChange={(e) => setStudentFilter(e.target.value)}
                className="p-2 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50"
              >
                <option value="all">Semua Siswa</option>
                {uniqueStudents.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select
                value={buildingFilter}
                onChange={(e) => setBuildingFilter(e.target.value)}
                className="p-2 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50"
              >
                <option value="all">Semua Gedung</option>
                {buildings.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.code}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={exportCSV}
                className="blox-btn px-3.5 py-2 bg-emerald-600 text-white text-xs flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Download CSV UTF-8 BOM</span>
              </button>
              <button
                onClick={copyTSV}
                className="blox-btn px-3.5 py-2 bg-sky-600 text-white text-xs flex items-center gap-1.5"
              >
                {copiedNotice ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedNotice ? 'Tersalin!' : 'Salin Tabel TSV (Paste Sheets)'}</span>
              </button>
              <button
                onClick={onClearLogs}
                className="px-3 py-2 rounded-xl bg-rose-100 text-rose-700 hover:bg-rose-200 text-xs font-bold flex items-center gap-1 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Log</span>
              </button>
            </div>
          </div>

          {/* Webhook Sync */}
          <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-2xl flex flex-wrap items-center gap-2 shadow-sm">
            <span className="text-xs font-bold text-indigo-900 flex items-center gap-1">
              <Globe className="w-4 h-4" />
              <span>Google Sheets Webhook (Apps Script):</span>
            </span>
            <input
              type="text"
              value={localWebhook}
              onChange={(e) => setLocalWebhook(e.target.value)}
              placeholder="Tempel URL Web App Google Apps Script..."
              className="flex-1 min-w-[200px] p-2 rounded-xl border border-indigo-300 text-xs font-bold bg-white"
            />
            <button
              onClick={() => {
                onSaveWebhookUrl(localWebhook);
                soundManager.playSFX('correct');
                alert('URL Webhook berhasil disimpan!');
              }}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center gap-1 hover:bg-indigo-700 transition"
            >
              <Save className="w-3.5 h-3.5" /> Simpan Webhook
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-2.5">Waktu</th>
                  <th className="p-2.5">Nama Siswa</th>
                  <th className="p-2.5">Gedung</th>
                  <th className="p-2.5">Pertanyaan</th>
                  <th className="p-2.5">Jawaban Siswa</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5 text-right">Poin</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.slice(0, 100).map((l, idx) => (
                    <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="p-2 whitespace-nowrap text-slate-500">{l.timestamp}</td>
                      <td className="p-2 font-bold text-slate-800">
                        {l.studentName} ({l.playerId})
                      </td>
                      <td className="p-2 font-bold text-indigo-700">{l.buildingCode}</td>
                      <td className="p-2 max-w-[240px] truncate" title={l.question}>
                        {l.question}
                      </td>
                      <td className="p-2 max-w-[180px] truncate">{l.studentAnswer}</td>
                      <td className="p-2 font-bold">
                        <span
                          className={`px-2 py-0.5 rounded-full ${
                            l.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {l.isCorrect ? 'BENAR' : 'SALAH'}
                        </span>
                      </td>
                      <td className="p-2 font-display font-bold text-right text-indigo-700">+{l.points}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-sm text-slate-400 font-bold">
                      Belum ada catatan aktivitas pengerjaan kuis. Masuk ke salah satu gedung materi untuk mulai bermain!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
