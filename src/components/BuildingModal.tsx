import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Compass,
  BookOpen,
  UserCheck,
  Users,
  Grid,
  Clock,
  CheckCircle,
  XCircle,
  HelpCircle,
  Trophy,
  ArrowRight,
  RotateCcw,
  Table,
  Lock,
} from 'lucide-react';
import { Building, Question, Player, AppSettings, QuizMode, ShuffledQuestion, RecapRecord } from '../types';
import { soundManager } from '../utils/audio';

interface BuildingModalProps {
  building: Building;
  onClose: () => void;
  questions: Question[];
  originalQuestions: Question[];
  aiQuestions: Question[];
  players: Player[];
  activePlayerIdx: number;
  settings: AppSettings;
  onUpdatePlayers: (players: Player[]) => void;
  onLogActivity: (record: Omit<RecapRecord, 'timestamp' | 'className'>) => void;
  onOpenRecap: () => void;
}

export const BuildingModal: React.FC<BuildingModalProps> = ({
  building,
  onClose,
  questions,
  originalQuestions,
  aiQuestions,
  players,
  activePlayerIdx,
  settings,
  onUpdatePlayers,
  onLogActivity,
  onOpenRecap,
}) => {
  const [viewState, setViewState] = useState<'intro' | 'study' | 'quiz' | 'summary'>('intro');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'original' | 'ai'>('all');
  const [countSelection, setCountSelection] = useState<number>(settings.questionsPerSession || 10);
  const [quizMode, setQuizMode] = useState<QuizMode>('individu');

  // Active quiz session state
  const [quizQuestions, setQuizQuestions] = useState<ShuffledQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(settings.quizDuration || 30);
  const [isAnswered, setIsAnswered] = useState(false);

  // Single player chosen answer
  const [chosenAnswer, setChosenAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);

  // Split4 answers per player [P1, P2, P3, P4]
  const [splitAnswers, setSplitAnswers] = useState<(('A' | 'B' | 'C' | 'D') | null)[]>([null, null, null, null]);

  // Scores tracked within this session [P1, P2, P3, P4]
  const [sessionScores, setSessionScores] = useState<number[]>([0, 0, 0, 0]);
  const [sessionCorrect, setSessionCorrect] = useState<number[]>([0, 0, 0, 0]);

  const origCount = originalQuestions.filter((q) => q.buildingCode === building.code).length;
  const aiCount = aiQuestions.filter((q) => q.buildingCode === building.code).length;

  function shuffle<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function prepareShuffledQuestion(rawQ: Question): ShuffledQuestion {
    const keys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
    const entries = keys.map((k) => ({ origKey: k, text: rawQ.options[k] }));
    const shuffled = shuffle(entries);
    const newOptions: { A: string; B: string; C: string; D: string } = { A: '', B: '', C: '', D: '' };
    let newAnswer: 'A' | 'B' | 'C' | 'D' = 'A';

    keys.forEach((k, idx) => {
      newOptions[k] = shuffled[idx].text;
      if (shuffled[idx].origKey === rawQ.answer) {
        newAnswer = k;
      }
    });

    return {
      ...rawQ,
      shuffledOptions: newOptions,
      shuffledAnswer: newAnswer,
    };
  }

  const startQuiz = (mode: QuizMode) => {
    let pool: Question[] = [];
    if (sourceFilter === 'original') {
      pool = originalQuestions.filter((q) => q.buildingCode === building.code);
    } else if (sourceFilter === 'ai') {
      pool = aiQuestions.filter((q) => q.buildingCode === building.code);
    } else {
      pool = questions;
    }

    if (pool.length === 0) {
      alert('Belum ada soal pada kategori yang dipilih!');
      return;
    }

    const randomized = shuffle(pool)
      .slice(0, Math.min(countSelection, pool.length))
      .map(prepareShuffledQuestion);

    setQuizMode(mode);
    setQuizQuestions(randomized);
    setCurrentIndex(0);
    setTimeLeft(settings.quizDuration || 30);
    setIsAnswered(false);
    setChosenAnswer(null);
    setSplitAnswers([null, null, null, null]);
    setSessionScores([0, 0, 0, 0]);
    setSessionCorrect([0, 0, 0, 0]);
    setViewState('quiz');
    soundManager.playSFX('select');
  };

  // Timer countdown
  useEffect(() => {
    if (viewState !== 'quiz' || isAnswered) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (quizMode === 'split4') {
            handleSplitTimeout();
          } else {
            handleSingleAnswer(null, true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [viewState, isAnswered, currentIndex, quizMode]);

  const handleSingleAnswer = (opt: ('A' | 'B' | 'C' | 'D') | null, isTimeout = false) => {
    if (isAnswered) return;
    setIsAnswered(true);
    setChosenAnswer(opt);

    const q = quizQuestions[currentIndex];
    const isCorrect = !isTimeout && opt === q.shuffledAnswer;
    const pts = isCorrect ? Number(settings.pointsCorrect || 100) : 0;
    const coins = isCorrect ? Number(settings.coinsCorrect || 25) : 0;

    const updated = [...players];
    const p = updated[activePlayerIdx];
    if (isCorrect) {
      p.score += pts;
      p.coins += coins;
      setSessionScores((prev) => {
        const next = [...prev];
        next[activePlayerIdx] += pts;
        return next;
      });
      setSessionCorrect((prev) => {
        const next = [...prev];
        next[activePlayerIdx] += 1;
        return next;
      });
      soundManager.playSFX('correct');
      setTimeout(() => soundManager.playSFX('coin'), 220);
      confetti({ particleCount: 45, spread: 60, origin: { y: 0.6 } });
    } else {
      soundManager.playSFX('wrong');
    }
    onUpdatePlayers(updated);

    onLogActivity({
      studentName: quizMode === 'kelompok' ? `Tim ${p.name}` : p.name,
      playerId: p.id,
      buildingCode: building.code,
      materi: q.materi,
      submateri: q.submateri,
      origNum: q.origNum,
      question: q.question,
      studentAnswer: isTimeout ? 'Waktu Habis' : `${opt}. ${q.shuffledOptions[opt!]}`,
      correctAnswer: `${q.shuffledAnswer}. ${q.shuffledOptions[q.shuffledAnswer]}`,
      isCorrect,
      points: pts,
      totalScore: p.score,
    });
  };

  const handleSelectSplit = (playerIdx: number, opt: 'A' | 'B' | 'C' | 'D') => {
    if (isAnswered) return;
    if (splitAnswers[playerIdx] !== null) return;

    soundManager.playSFX('select');
    const nextAnswers = [...splitAnswers];
    nextAnswers[playerIdx] = opt as any;
    setSplitAnswers(nextAnswers);

    // If all 4 players answered, automatically reveal
    if (nextAnswers.every((ans) => ans !== null)) {
      revealSplit(nextAnswers);
    }
  };

  const handleSplitTimeout = () => {
    revealSplit(splitAnswers);
  };

  const revealSplit = (currentSplitAns: (('A' | 'B' | 'C' | 'D') | null)[]) => {
    if (isAnswered) return;
    setIsAnswered(true);

    const q = quizQuestions[currentIndex];
    const pts = Number(settings.pointsCorrect || 100);
    const coins = Number(settings.coinsCorrect || 25);
    const updated = [...players];
    let anyCorrect = false;

    players.forEach((p, idx) => {
      const chosen = currentSplitAns[idx];
      const isCorrect = chosen === q.shuffledAnswer;
      if (isCorrect) {
        anyCorrect = true;
        updated[idx].score += pts;
        updated[idx].coins += coins;
        setSessionScores((prev) => {
          const next = [...prev];
          next[idx] += pts;
          return next;
        });
        setSessionCorrect((prev) => {
          const next = [...prev];
          next[idx] += 1;
          return next;
        });
      }

      onLogActivity({
        studentName: p.name,
        playerId: p.id,
        buildingCode: building.code,
        materi: q.materi,
        submateri: q.submateri,
        origNum: q.origNum,
        question: q.question,
        studentAnswer: chosen ? `${chosen}. ${q.shuffledOptions[chosen]}` : 'Tidak Menjawab',
        correctAnswer: `${q.shuffledAnswer}. ${q.shuffledOptions[q.shuffledAnswer]}`,
        isCorrect,
        points: isCorrect ? pts : 0,
        totalScore: updated[idx].score,
      });
    });

    onUpdatePlayers(updated);
    if (anyCorrect) {
      soundManager.playSFX('correct');
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.55 } });
    } else {
      soundManager.playSFX('wrong');
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < quizQuestions.length) {
      setCurrentIndex((prev) => prev + 1);
      setTimeLeft(settings.quizDuration || 30);
      setIsAnswered(false);
      setChosenAnswer(null);
      setSplitAnswers([null, null, null, null]);
    } else {
      setViewState('summary');
      soundManager.playSFX('correct');
      confetti({ particleCount: 100, spread: 90, origin: { y: 0.5 } });
    }
  };

  const activeP = players[activePlayerIdx] || players[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/65 backdrop-blur-sm overflow-y-auto select-none">
      <div className="blox-card w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden animate-pop shadow-2xl">
        {/* Modal Header */}
        <div
          className="p-4 sm:p-5 text-white flex items-center justify-between shadow-md"
          style={{ background: `linear-gradient(135deg, ${building.color}, #0f172a)` }}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl shadow">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider bg-black/30 px-2.5 py-0.5 rounded-full">
                GEDUNG {building.code}
              </span>
              <h2 className="text-lg sm:text-2xl font-bold mt-0.5">{building.name}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50">
          {viewState === 'intro' && (
            <div className="space-y-5 animate-pop">
              {/* Summary card */}
              <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-100 text-indigo-800">
                    {building.submateri}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {origCount} Soal Asli {aiCount > 0 ? `+ ${aiCount} Soal AI` : ''}
                  </span>
                </div>
                <h3 className="font-display font-bold text-lg text-slate-800 mb-2">Ringkasan Materi Pembelajaran</h3>
                <p className="text-slate-700 leading-relaxed text-sm sm:text-base">{building.summary}</p>
              </div>

              {/* Quiz Configuration & Launchpad */}
              <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm space-y-4">
                <h3 className="font-display font-bold text-lg text-slate-800">Pilih Mode Belajar & Kuis Interaktif</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Sumber Bank Soal:</label>
                    <select
                      value={sourceFilter}
                      onChange={(e) => setSourceFilter(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border-2 border-slate-200 font-bold text-sm bg-slate-50"
                    >
                      <option value="all">Semua Soal Gedung Ini ({questions.length} Soal)</option>
                      <option value="original">Hanya Bank Soal Asli Dokumen ({origCount} Soal)</option>
                      {aiCount > 0 && <option value="ai">Hanya Bank Soal Tambahan AI ({aiCount} Soal)</option>}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Jumlah Soal Sesi Ini:</label>
                    <select
                      value={countSelection}
                      onChange={(e) => setCountSelection(parseInt(e.target.value, 10))}
                      className="w-full p-2.5 rounded-xl border-2 border-slate-200 font-bold text-sm bg-slate-50"
                    >
                      <option value={5}>5 Soal</option>
                      <option value={10}>10 Soal</option>
                      <option value={15}>Semua ({questions.length} Soal)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                  <button
                    onClick={() => {
                      setViewState('study');
                      soundManager.playSFX('select');
                    }}
                    className="blox-btn p-4 bg-gradient-to-b from-sky-400 to-blue-600 text-white text-left flex flex-col justify-between"
                  >
                    <BookOpen className="w-6 h-6 mb-2" />
                    <div>
                      <div className="text-base font-bold">Mulai Belajar</div>
                      <div className="text-[11px] text-sky-100 font-normal">Baca kartu konsep & pembahasan</div>
                    </div>
                  </button>

                  <button
                    onClick={() => startQuiz('individu')}
                    className="blox-btn p-4 bg-gradient-to-b from-emerald-400 to-green-600 text-white text-left flex flex-col justify-between"
                  >
                    <UserCheck className="w-6 h-6 mb-2" />
                    <div>
                      <div className="text-base font-bold">Kuis Individu</div>
                      <div className="text-[11px] text-emerald-100 font-normal">Pemain: {activeP.name}</div>
                    </div>
                  </button>

                  <button
                    onClick={() => startQuiz('kelompok')}
                    className="blox-btn p-4 bg-gradient-to-b from-amber-400 to-orange-500 text-white text-left flex flex-col justify-between"
                  >
                    <Users className="w-6 h-6 mb-2" />
                    <div>
                      <div className="text-base font-bold">Kuis Berkelompok</div>
                      <div className="text-[11px] text-amber-100 font-normal">Diskusi tim bersama</div>
                    </div>
                  </button>

                  <button
                    onClick={() => startQuiz('split4')}
                    className="blox-btn p-4 bg-gradient-to-b from-purple-500 to-indigo-600 text-white text-left flex flex-col justify-between"
                  >
                    <Grid className="w-6 h-6 mb-2" />
                    <div>
                      <div className="text-base font-bold">Kuis Serentak 4P</div>
                      <div className="text-[11px] text-purple-100 font-normal">4-Way Split Screen P1–P4</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Flashcard Study Mode */}
          {viewState === 'study' && (
            <div className="space-y-4 animate-pop">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setViewState('intro')}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition"
                >
                  ← Kembali ke Pilihan Mode
                </button>
                <button
                  onClick={() => startQuiz('individu')}
                  className="blox-btn px-5 py-2 bg-emerald-500 text-white text-sm flex items-center gap-1.5"
                >
                  <span>Siap Mulai Kuis</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {questions.map((q, i) => (
                  <div key={q.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
                      <span>
                        Kartu Konsep #{i + 1} (No. Asli: {q.origNum})
                      </span>
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Kunci: {q.answer}
                      </span>
                    </div>
                    <div className="font-bold text-slate-800 mb-2">{q.question}</div>
                    <div className="text-xs bg-blue-50 text-blue-900 p-2.5 rounded-xl border border-blue-100">
                      <span className="font-bold">Jawaban Benar ({q.answer}):</span> {q.options[q.answer]}
                      <br />
                      <span className="font-bold">Pembahasan:</span> {q.explanation || 'Belum tersedia pembahasan.'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Quiz View */}
          {viewState === 'quiz' && quizQuestions.length > 0 && (
            <div className="space-y-4 animate-pop">
              {quizMode === 'split4' ? (
                /* 4-WAY SPLIT SCREEN */
                <div className="space-y-3">
                  {/* Top Bar for Split */}
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-xl bg-purple-600 text-white font-display font-bold text-xs">
                        4-WAY SPLIT SCREEN
                      </span>
                      <span className="font-bold text-sm text-slate-700">
                        Soal {currentIndex + 1} / {quizQuestions.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-800 font-display font-bold text-sm flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{timeLeft}s</span>
                      </span>
                      {!isAnswered && (
                        <button
                          onClick={() => revealSplit(splitAnswers)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition"
                        >
                          Periksa Semua Jawaban
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Shared Question */}
                  <div className="bg-white p-4 rounded-2xl border-2 border-indigo-200 shadow-sm">
                    <div className="text-xs font-bold text-indigo-600 mb-1">
                      {quizQuestions[currentIndex].submateri} • No. Asli #{quizQuestions[currentIndex].origNum}
                    </div>
                    <div className="font-display font-bold text-base sm:text-lg text-slate-900">
                      {quizQuestions[currentIndex].question}
                    </div>
                  </div>

                  {/* 4 Player Split Panels */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {players.map((p, idx) => {
                      const panelColors = [
                        'border-blue-400 bg-blue-50/70',
                        'border-pink-400 bg-pink-50/70',
                        'border-amber-400 bg-amber-50/70',
                        'border-emerald-400 bg-emerald-50/70',
                      ];
                      const badgeColors = ['bg-blue-600', 'bg-pink-600', 'bg-amber-600', 'bg-emerald-600'];
                      const chosen = splitAnswers[idx];

                      return (
                        <div key={p.id} className={`p-3 rounded-2xl border-2 ${panelColors[idx]} flex flex-col justify-between shadow-sm`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded-lg text-white text-xs font-bold ${badgeColors[idx]}`}>{p.id}</span>
                              <span className="font-bold text-xs sm:text-sm text-slate-800 truncate max-w-[120px]">{p.name}</span>
                            </div>
                            <span className="text-xs font-bold text-slate-500">
                              {chosen !== null ? (
                                <span className="text-indigo-700 flex items-center gap-1">
                                  <Lock className="w-3 h-3" /> Terkunci
                                </span>
                              ) : (
                                `Skor Sesi: ${sessionScores[idx]}`
                              )}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5">
                            {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                              const isCorrectAnswer = opt === quizQuestions[currentIndex].shuffledAnswer;
                              let btnClass = 'p-2 rounded-xl border-2 text-left text-xs font-bold transition flex items-start gap-1.5 ';

                              if (isAnswered) {
                                if (isCorrectAnswer) {
                                  btnClass += 'bg-emerald-500 border-emerald-700 text-white';
                                } else if (chosen === opt && !isCorrectAnswer) {
                                  btnClass += 'bg-rose-500 border-rose-700 text-white';
                                } else {
                                  btnClass += 'bg-white border-slate-200 text-slate-400 opacity-50';
                                }
                              } else {
                                if (chosen === opt) {
                                  btnClass += 'bg-indigo-600 border-indigo-800 text-white';
                                } else if (chosen !== null) {
                                  btnClass += 'bg-white border-slate-200 text-slate-500 opacity-50';
                                } else {
                                  btnClass += 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800';
                                }
                              }

                              return (
                                <button
                                  key={opt}
                                  disabled={isAnswered || chosen !== null}
                                  onClick={() => handleSelectSplit(idx, opt)}
                                  className={btnClass}
                                >
                                  <span className="px-1.5 py-0.5 rounded bg-black/10 font-display">{opt}</span>
                                  <span className="line-clamp-2">{quizQuestions[currentIndex].shuffledOptions[opt]}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Feedback on answer reveal */}
                  {isAnswered && (
                    <div className="p-4 rounded-2xl bg-white border-2 border-indigo-400 animate-pop shadow-md space-y-2">
                      <div className="text-xs sm:text-sm text-slate-800">
                        <span className="font-bold text-emerald-700">
                          Kunci Jawaban: {quizQuestions[currentIndex].shuffledAnswer}.{' '}
                          {quizQuestions[currentIndex].shuffledOptions[quizQuestions[currentIndex].shuffledAnswer]}
                        </span>
                        <br />
                        <span className="font-bold text-indigo-700">Pembahasan:</span>{' '}
                        {quizQuestions[currentIndex].explanation || 'Belum tersedia pembahasan.'}
                      </div>
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={handleNextQuestion}
                          className="blox-btn px-6 py-2 bg-indigo-600 text-white text-sm flex items-center gap-1.5"
                        >
                          <span>{currentIndex + 1 >= quizQuestions.length ? 'Lihat Peringkat Akhir' : 'Soal Berikutnya'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* SINGLE PLAYER / GROUP QUIZ */
                <div className="space-y-4">
                  {/* Header Progress & Timer */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-display font-bold text-xs">
                        {quizMode === 'kelompok' ? `KUIS BERKELOMPOK (Tim ${activeP.name})` : `KUIS INDIVIDU (${activeP.name})`}
                      </span>
                      <div className="flex items-center gap-3 text-sm font-bold">
                        <span className="text-slate-700">
                          Soal <span className="text-indigo-600">{currentIndex + 1}</span>/{quizQuestions.length}
                        </span>
                        <span className="text-emerald-600 flex items-center gap-1">
                          <Trophy className="w-4 h-4" />
                          <span>Skor Sesi: {sessionScores[activePlayerIdx]}</span>
                        </span>
                        <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-800 font-display flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{timeLeft}s</span>
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-blue-500 transition-all duration-300"
                        style={{ width: `${Math.round(((currentIndex + 1) / quizQuestions.length) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Question Card */}
                  <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm">
                    <div className="text-xs font-bold text-slate-400 mb-1">
                      {quizQuestions[currentIndex].submateri} • Soal Asli No. {quizQuestions[currentIndex].origNum}
                    </div>
                    <h3 className="font-display font-bold text-lg sm:text-xl text-slate-900 leading-snug mb-4">
                      {quizQuestions[currentIndex].question}
                    </h3>

                    <div className="grid grid-cols-1 gap-2.5">
                      {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                        const isCorrectKey = opt === quizQuestions[currentIndex].shuffledAnswer;
                        let btnStyle =
                          'w-full p-3.5 rounded-2xl border-2 text-left font-bold transition flex items-center gap-3 ';

                        if (isAnswered) {
                          if (isCorrectKey) {
                            btnStyle += 'bg-emerald-100 border-emerald-500 text-emerald-950 shadow-sm';
                          } else if (chosenAnswer === opt && !isCorrectKey) {
                            btnStyle += 'bg-rose-100 border-rose-500 text-rose-950 shadow-sm';
                          } else {
                            btnStyle += 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                          }
                        } else {
                          btnStyle += 'bg-slate-50 hover:bg-blue-50 border-slate-200 hover:border-blue-400 text-slate-800';
                        }

                        return (
                          <button
                            key={opt}
                            disabled={isAnswered}
                            onClick={() => handleSingleAnswer(opt)}
                            className={btnStyle}
                          >
                            <span className="w-9 h-9 rounded-xl bg-white border-2 border-slate-300 flex items-center justify-center font-display text-base text-indigo-700 shrink-0">
                              {opt}
                            </span>
                            <span className="text-sm sm:text-base">{quizQuestions[currentIndex].shuffledOptions[opt]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Feedback Area */}
                  {isAnswered && (
                    <div
                      className={`p-4 rounded-2xl border-2 ${
                        chosenAnswer === quizQuestions[currentIndex].shuffledAnswer
                          ? 'bg-emerald-50 border-emerald-400'
                          : 'bg-rose-50 border-rose-400'
                      } animate-pop shadow-md space-y-2`}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={`font-display font-bold text-base ${
                            chosenAnswer === quizQuestions[currentIndex].shuffledAnswer ? 'text-emerald-700' : 'text-rose-700'
                          } flex items-center gap-2`}
                        >
                          {chosenAnswer === quizQuestions[currentIndex].shuffledAnswer ? (
                            <>
                              <CheckCircle className="w-5 h-5 text-emerald-600" />
                              <span>BENAR! +{settings.pointsCorrect} Poin & +{settings.coinsCorrect} Koin</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-5 h-5 text-rose-600" />
                              <span>KURANG TEPAT! Jawaban benar: {quizQuestions[currentIndex].shuffledAnswer}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-xs sm:text-sm text-slate-700 bg-white/80 p-3 rounded-xl border border-slate-200">
                        <span className="font-bold text-indigo-700 flex items-center gap-1 mb-0.5">
                          <HelpCircle className="w-3.5 h-3.5" /> Pembahasan:
                        </span>
                        {quizQuestions[currentIndex].explanation || 'Belum tersedia pembahasan.'}
                      </div>
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={handleNextQuestion}
                          className="blox-btn px-6 py-2.5 bg-indigo-600 text-white text-sm flex items-center gap-1.5"
                        >
                          <span>{currentIndex + 1 >= quizQuestions.length ? 'Lihat Hasil Akhir' : 'Soal Berikutnya'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quiz Summary View */}
          {viewState === 'summary' && (
            <div className="space-y-5 text-center animate-pop max-w-2xl mx-auto py-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-400 text-white text-3xl flex items-center justify-center shadow-lg border-4 border-white animate-float">
                <Trophy className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-display font-bold text-2xl text-slate-800">Sesi Kuis Selesai!</h3>
                <p className="text-sm text-slate-600">{building.name} • Hasil otomatis tersimpan ke Rekap Nilai</p>
              </div>

              {/* Leaderboard */}
              <div className="text-left space-y-2">
                <div className="text-xs font-bold uppercase text-slate-500 px-1">Peringkat Pemain</div>
                {players
                  .map((p, idx) => ({
                    ...p,
                    sessionScore: sessionScores[idx],
                    sessionCorrect: sessionCorrect[idx],
                  }))
                  .sort((a, b) => b.sessionScore - a.sessionScore || b.score - a.score)
                  .map((r, i) => (
                    <div
                      key={r.id}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border ${
                        i === 0 ? 'bg-amber-50 border-amber-400 shadow-sm' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-8 h-8 rounded-xl ${
                            i === 0 ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'
                          } font-display font-bold flex items-center justify-center`}
                        >
                          #{i + 1}
                        </span>
                        <div>
                          <div className="font-bold text-slate-800 text-sm">
                            {r.name} <span className="text-xs text-slate-400 font-normal">({r.id})</span>
                          </div>
                          <div className="text-xs text-slate-500">
                            Benar: {r.sessionCorrect}/{quizQuestions.length} • Total Koin: {r.coins}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-display font-bold text-lg text-indigo-700">+{r.sessionScore} Poin</div>
                        <div className="text-[11px] font-bold text-slate-400">Total Akumulasi: {r.score}</div>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="flex flex-wrap justify-center gap-3 pt-3">
                <button
                  onClick={() => setViewState('intro')}
                  className="blox-btn px-6 py-3 bg-emerald-500 text-white text-sm flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Mainkan Lagi</span>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onOpenRecap();
                  }}
                  className="blox-btn px-6 py-3 bg-rose-500 text-white text-sm flex items-center gap-1.5"
                >
                  <Table className="w-4 h-4" />
                  <span>Buka Rekap Nilai</span>
                </button>
                <button onClick={onClose} className="blox-btn px-6 py-3 bg-slate-600 text-white text-sm">
                  Kembali ke Kota 3D
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
