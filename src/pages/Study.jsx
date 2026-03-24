import React, { useState, useEffect, useCallback } from "react";
import { Question, StudySession, UserProgress, User } from "@/entities/all";
import { qbank } from "@/configs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Brain, Clock, Zap, ArrowLeft, ArrowRight, CheckCircle, XCircle,
  Flag, BookOpen, RotateCcw, BarChart3, Timer, Play, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STUDY_MODES = {
  tutor:       { name: "Tutor Mode",  desc: "Untimed · Instant feedback",  icon: Brain, timed: false, showImmediate: true },
  timed_exam:  { name: "Timed Exam",  desc: "Timed · Review at end",       icon: Timer, timed: true,  showImmediate: false },
  timed_tutor: { name: "Timed Tutor", desc: "Timed · Pauses for feedback", icon: Zap,   timed: true,  showImmediate: true, pauseOnAnswer: true },
};

function ExplanationCard({ question, selectedOption }) {
  const labels = ["A", "B", "C", "D"];
  return (
    <Card className="border-0 shadow-lg bg-white overflow-hidden">
      <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
        <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-1">Explanation</div>
        <p className="text-sm font-medium text-slate-800 leading-relaxed">{question.explanation || "Review the correct answer."}</p>
      </div>
      <div className="p-5 space-y-3">
        {question.options.map((opt, i) => {
          const isCorrect = opt.is_correct;
          const isSelected = i === selectedOption;
          return (
            <div key={i} className={`p-3 rounded-lg border ${isCorrect ? 'border-emerald-200 bg-emerald-50' : isSelected ? 'border-red-200 bg-red-50' : 'border-slate-100 bg-slate-50'}`}>
              <span className="text-sm font-semibold text-slate-800">
                {labels[i]}. {isCorrect && <span className="text-emerald-600">✓ </span>}{isSelected && !isCorrect && <span className="text-red-600">✗ </span>}{opt.text}
              </span>
            </div>
          );
        })}
      </div>
      {question.reference && (
        <div className="px-5 py-4 bg-amber-50 border-t border-amber-100">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1">Reference</div>
          <p className="text-sm font-medium text-slate-800">{question.reference}</p>
        </div>
      )}
      {question.tags?.length > 0 && (
        <div className="px-5 py-3 border-t border-slate-100 flex flex-wrap gap-1.5">
          {question.tags.map((tag, i) => <Badge key={i} variant="secondary" className="text-[10px]">{tag}</Badge>)}
        </div>
      )}
    </Card>
  );
}

function QuestionNav({ total, current, answers, flagged, onSelect }) {
  return (
    <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1.5">
      {Array.from({ length: total }, (_, i) => {
        const ans = answers[i];
        const isCurrent = i === current;
        return (
          <button key={i} onClick={() => onSelect(i)}
            className={`relative aspect-square rounded-lg text-xs font-semibold transition-all ${
              isCurrent ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300'
              : ans ? (ans.correct ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}>
            {i + 1}
            {flagged.includes(i) && <Flag className="absolute -top-1 -right-1 w-2.5 h-2.5 text-amber-500 fill-amber-500" />}
          </button>
        );
      })}
    </div>
  );
}

export default function Study() {
  const [phase, setPhase] = useState("setup");
  const [mode, setMode] = useState(null);
  const [allQuestions, setAllQuestions] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerPaused, setTimerPaused] = useState(false);
  const [questionStart, setQuestionStart] = useState(Date.now());
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [user, setUser] = useState(null);
  const [showNav, setShowNav] = useState(false);
  const [filters, setFilters] = useState({ category: "all", difficulty: "all", count: "20" });

  const CATEGORIES = [{ value: "all", label: "All Categories" }, ...qbank.categories];

  // Load questions
  useEffect(() => {
    (async () => {
      setIsLoadingQuestions(true);
      try {
        const [dbQ, u] = await Promise.all([Question.list(), User.me()]);
        setUser(u);
        setAllQuestions(dbQ.length > 0 ? dbQ : (qbank.sampleQuestions || []).map(sq => ({
          id: sq.id, category: sq.category, difficulty: sq.difficulty,
          question_text: sq.stem || sq.question, options: sq.options,
          explanation: sq.educational_objective || '', reference: sq.bottom_line || '', tags: sq.related_topics || [],
        })));
      } catch (e) { console.error(e); setAllQuestions([]); }
      setIsLoadingQuestions(false);
    })();
  }, []);

  // Timer
  useEffect(() => {
    if (phase !== "active" || !mode || !STUDY_MODES[mode].timed) return;
    const iv = setInterval(() => { if (!timerPaused) setTimeLeft(p => { if (p <= 1) { finishSession(); return 0; } return p - 1; }); }, 1000);
    return () => clearInterval(iv);
  }, [phase, mode, timerPaused]);

  useEffect(() => { setQuestionStart(Date.now()); }, [currentIdx]);

  // Keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;
      if (phase !== "active" && phase !== "review") return;
      if (e.key === "ArrowRight") { e.preventDefault(); nextQ(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prevQ(); }
      else if ("abcd".includes(e.key?.toLowerCase()) && phase === "active" && !answers[currentIdx]) {
        e.preventDefault(); handleAnswer("abcd".indexOf(e.key.toLowerCase()));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, currentIdx, answers, questions]);

  const startSession = () => {
    let pool = [...allQuestions];
    if (filters.category !== "all") pool = pool.filter(q => q.category === filters.category);
    if (filters.difficulty !== "all") pool = pool.filter(q => q.difficulty === filters.difficulty);
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const qs = pool.slice(0, Math.min(parseInt(filters.count) || 20, pool.length));
    if (qs.length === 0) return;
    setQuestions(qs); setAnswers({}); setFlagged([]); setCurrentIdx(0);
    setSessionStartTime(Date.now()); setPhase("active");
    if (STUDY_MODES[mode].timed) { setTimeLeft(qs.length * 90); setTimerPaused(false); }
  };

  const handleAnswer = (optIdx) => {
    if (answers[currentIdx]) return;
    const q = questions[currentIdx];
    setAnswers(prev => ({ ...prev, [currentIdx]: { selected: optIdx, correct: q.options[optIdx]?.is_correct, timeSpent: Math.round((Date.now() - questionStart) / 1000) } }));
    if (mode === "timed_tutor") setTimerPaused(true);
  };

  const finishSession = useCallback(async () => {
    setPhase("results");
    const totalTime = Math.floor((Date.now() - (sessionStartTime || Date.now())) / 1000);
    const correctCount = Object.values(answers).filter(a => a.correct).length;
    const totalAnswered = Object.keys(answers).length;
    const score = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
    try {
      await StudySession.create({ session_type: STUDY_MODES[mode]?.timed ? 'exam' : 'study', category: filters.category, total_questions: questions.length, correct_answers: correctCount, total_time: totalTime, score_percentage: score, difficulty_filter: filters.difficulty });
      for (const [idx, ans] of Object.entries(answers)) {
        const q = questions[parseInt(idx)];
        if (q) await UserProgress.create({ question_id: q.id, is_correct: ans.correct, selected_option: ans.selected, time_spent: ans.timeSpent || 0, mode: STUDY_MODES[mode]?.timed ? 'exam' : 'study' });
      }
      if (user) await User.updateMyUserData({ questions_answered_count: (user.questions_answered_count || 0) + totalAnswered });
    } catch (e) { console.error("Error saving:", e); }
  }, [answers, questions, mode, filters, sessionStartTime, user]);

  const nextQ = () => { if (currentIdx < questions.length - 1) { setCurrentIdx(p => p + 1); setTimerPaused(false); } };
  const prevQ = () => { if (currentIdx > 0) setCurrentIdx(p => p - 1); };
  const toggleFlag = () => setFlagged(p => p.includes(currentIdx) ? p.filter(i => i !== currentIdx) : [...p, currentIdx]);
  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const modeConfig = mode ? STUDY_MODES[mode] : null;
  const currentQ = questions[currentIdx];
  const currentAns = answers[currentIdx];
  const showExplanation = !!currentAns && modeConfig?.showImmediate;
  const labels = ["A", "B", "C", "D"];

  // ═══ SETUP ═══
  if (phase === "setup") {
    const filteredCount = (() => {
      let pool = allQuestions;
      if (filters.category !== "all") pool = pool.filter(q => q.category === filters.category);
      if (filters.difficulty !== "all") pool = pool.filter(q => q.difficulty === filters.difficulty);
      return pool.length;
    })();
    return (
      <div className="max-w-3xl mx-auto p-6 md:p-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl mb-4 shadow-lg"><BookOpen className="w-7 h-7 text-white" /></div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Study Mode</h1>
          <p className="text-slate-500">{isLoadingQuestions ? "Loading..." : `${allQuestions.length} questions available`}</p>
        </div>
        <div className="mb-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Choose Mode</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.entries(STUDY_MODES).map(([key, m]) => {
              const Icon = m.icon;
              return (
                <button key={key} onClick={() => setMode(key)}
                  className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all ${mode === key ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <Icon className={`w-7 h-7 ${mode === key ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="font-semibold text-sm">{m.name}</span>
                  <span className="text-[11px] text-slate-500 text-center">{m.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="mb-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Block Settings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Category</label>
              <Select value={filters.category} onValueChange={v => setFilters(p => ({ ...p, category: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
            <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Difficulty</label>
              <Select value={filters.difficulty} onValueChange={v => setFilters(p => ({ ...p, difficulty: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Levels</SelectItem><SelectItem value="basic">Basic</SelectItem><SelectItem value="intermediate">Intermediate</SelectItem><SelectItem value="advanced">Advanced</SelectItem></SelectContent></Select></div>
            <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Questions</label>
              <Select value={filters.count} onValueChange={v => setFilters(p => ({ ...p, count: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="5">5</SelectItem><SelectItem value="10">10</SelectItem><SelectItem value="20">20</SelectItem><SelectItem value="40">40 (Full Block)</SelectItem><SelectItem value="100">100</SelectItem></SelectContent></Select></div>
          </div>
          {!isLoadingQuestions && <p className="text-xs text-slate-500 mt-2">{filteredCount} questions match your filters</p>}
        </div>
        <Button onClick={startSession} disabled={!mode || isLoadingQuestions || filteredCount === 0} className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg gap-3">
          <Play className="w-5 h-5" />{isLoadingQuestions ? "Loading..." : !mode ? "Select a mode" : `Start ${STUDY_MODES[mode].name}`}
        </Button>
        <div className="text-center mt-4 text-[11px] text-slate-400 bg-slate-50 rounded-lg p-2.5"><strong>Keyboard:</strong> A/B/C/D = answer · ← → = navigate</div>
      </div>
    );
  }

  // ═══ RESULTS ═══
  if (phase === "results") {
    const total = Object.keys(answers).length;
    const correct = Object.values(answers).filter(a => a.correct).length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const catStats = {};
    Object.entries(answers).forEach(([idx, ans]) => {
      const cat = questions[parseInt(idx)]?.category || 'unknown';
      if (!catStats[cat]) catStats[cat] = { correct: 0, total: 0 };
      catStats[cat].total++;
      if (ans.correct) catStats[cat].correct++;
    });
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="text-center mb-8">
          <div className={`text-7xl font-bold mb-3 ${pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{pct}%</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Block Complete</h2>
          <p className="text-slate-500">{correct} of {total} correct · Results saved</p>
        </div>
        {Object.keys(catStats).length > 1 && (
          <Card className="border-0 shadow-lg bg-white mb-6">
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-blue-600" />Performance by Domain</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(catStats).map(([cat, s]) => {
                const catPct = Math.round((s.correct / s.total) * 100);
                return (
                  <div key={cat}><div className="flex justify-between text-sm mb-1"><span className="text-slate-700 truncate">{qbank.categories.find(c => c.value === cat)?.label || cat}</span><span className={`font-semibold ${catPct >= 80 ? 'text-emerald-600' : catPct >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{s.correct}/{s.total}</span></div><Progress value={catPct} className="h-2" /></div>
                );
              })}
            </CardContent>
          </Card>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={() => { setPhase("setup"); setMode(null); }} className="flex-1 gap-2 h-12"><RotateCcw className="w-4 h-4" />New Block</Button>
          <Button onClick={() => { setCurrentIdx(0); setPhase("review"); }} className="flex-1 gap-2 h-12 bg-gradient-to-r from-blue-600 to-blue-700"><BookOpen className="w-4 h-4" />Review Answers</Button>
        </div>
      </div>
    );
  }

  // ═══ REVIEW ═══
  if (phase === "review") {
    const rQ = questions[currentIdx];
    const rAns = answers[currentIdx];
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-white border-b border-slate-200">
          <Button variant="ghost" size="sm" onClick={() => setPhase("results")} className="gap-2"><ArrowLeft className="w-4 h-4" />Results</Button>
          <span className="text-sm font-semibold text-slate-600">Review {currentIdx + 1}/{questions.length}</span>
          <div className="flex gap-1"><Button variant="ghost" size="icon" onClick={prevQ} disabled={currentIdx === 0}><ArrowLeft className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={nextQ} disabled={currentIdx === questions.length - 1}><ArrowRight className="w-4 h-4" /></Button></div>
        </div>
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-6">
            <div>
              <div className="flex gap-2 mb-4">
                <Badge variant="outline">Q{currentIdx + 1}</Badge>
                <Badge className="capitalize bg-slate-100 text-slate-700">{qbank.categories.find(c => c.value === rQ?.category)?.label || rQ?.category}</Badge>
                <Badge className={rAns?.correct ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}>{rAns?.correct ? "Correct" : "Incorrect"}</Badge>
              </div>
              <h2 className="text-lg font-semibold text-slate-900 leading-relaxed mb-5">{rQ?.question_text}</h2>
              <div className="space-y-2.5">
                {rQ?.options.map((opt, i) => {
                  const isCorrect = opt.is_correct; const isSelected = rAns?.selected === i;
                  return (
                    <div key={i} className={`p-4 rounded-xl border-2 ${isCorrect ? 'border-emerald-400 bg-emerald-50' : isSelected ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${isCorrect ? 'border-emerald-500 bg-emerald-500 text-white' : isSelected ? 'border-red-500 bg-red-500 text-white' : 'border-slate-300 text-slate-500'}`}>{labels[i]}</div>
                        <span className="flex-1 text-sm font-medium text-slate-800">{opt.text}</span>
                        {isCorrect && <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
                        {isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <ExplanationCard question={rQ} selectedOption={rAns?.selected} />
          </div>
        </div>
      </div>
    );
  }

  // ═══ ACTIVE SESSION ═══
  if (!currentQ) return <div className="p-12 text-center text-slate-500">No questions available.</div>;

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-slate-200">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { if (confirm("End block? Progress will be saved.")) finishSession(); }}><X className="w-4 h-4 text-slate-400" /></Button>
        <div className="flex items-center gap-2">{modeConfig && <modeConfig.icon className="w-4 h-4 text-blue-600" />}<span className="text-sm font-semibold text-slate-700 hidden sm:inline">{modeConfig?.name}</span></div>
        <div className="flex-1 mx-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1"><span>Q{currentIdx + 1}/{questions.length}</span><span>{Object.keys(answers).length} answered</span></div>
          <Progress value={((currentIdx + 1) / questions.length) * 100} className="h-1.5" />
        </div>
        {modeConfig?.timed && <div className={`px-3 py-1.5 rounded-lg font-mono text-sm font-bold ${timeLeft < 60 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-blue-50 text-blue-700'}`}>{formatTime(timeLeft)}{timerPaused && " ⏸"}</div>}
        <Button variant="ghost" size="icon" className={`h-8 w-8 ${flagged.includes(currentIdx) ? 'text-amber-500' : 'text-slate-400'}`} onClick={toggleFlag}><Flag className={`w-4 h-4 ${flagged.includes(currentIdx) ? 'fill-amber-500' : ''}`} /></Button>
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowNav(!showNav)}>{showNav ? "Hide" : "Nav"}</Button>
      </div>

      {/* Navigator */}
      <AnimatePresence>{showNav && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-white border-b border-slate-200">
          <div className="p-4"><QuestionNav total={questions.length} current={currentIdx} answers={answers} flagged={flagged} onSelect={setCurrentIdx} /></div>
        </motion.div>
      )}</AnimatePresence>

      {/* Question */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className={`max-w-5xl mx-auto ${showExplanation ? 'grid lg:grid-cols-2 gap-6 items-start' : ''}`}>
          <AnimatePresence mode="wait">
            <motion.div key={currentIdx} initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} transition={{ duration: 0.2 }}>
              <Card className="border-0 shadow-lg bg-white mb-4">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline" className="font-semibold">Q{currentIdx + 1}</Badge>
                    <Badge className="capitalize bg-slate-100 text-slate-700 border-0">{qbank.categories.find(c => c.value === currentQ.category)?.label || currentQ.category?.replace(/_/g, ' ')}</Badge>
                    <Badge className={`border-0 ${currentQ.difficulty === 'basic' ? 'bg-emerald-100 text-emerald-700' : currentQ.difficulty === 'advanced' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{currentQ.difficulty}</Badge>
                  </div>
                  <CardTitle className="text-base md:text-lg font-semibold text-slate-900 leading-relaxed">{currentQ.question_text}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {currentQ.options.map((opt, i) => {
                    const isSelected = currentAns?.selected === i;
                    const isCorrect = opt.is_correct;
                    let cls = "w-full p-4 text-left rounded-xl border-2 transition-all ";
                    if (!currentAns) cls += isSelected ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 cursor-pointer";
                    else if (showExplanation) cls += isCorrect ? "border-emerald-400 bg-emerald-50" : isSelected ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50";
                    else cls += isSelected ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-slate-50";
                    return (
                      <button key={i} onClick={() => !currentAns && handleAnswer(i)} disabled={!!currentAns} className={cls}>
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${showExplanation && isCorrect ? 'border-emerald-500 bg-emerald-500 text-white' : showExplanation && isSelected && !isCorrect ? 'border-red-500 bg-red-500 text-white' : isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300 text-slate-500'}`}>{labels[i]}</div>
                          <span className="flex-1 text-sm font-medium text-slate-800 text-left">{opt.text}</span>
                          {showExplanation && isCorrect && <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
                          {showExplanation && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
              {currentAns && !modeConfig?.showImmediate && <div className="text-center text-sm text-blue-600 font-medium">Answer recorded</div>}
            </motion.div>
          </AnimatePresence>
          {showExplanation && <ExplanationCard question={currentQ} selectedOption={currentAns?.selected} />}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white border-t border-slate-200">
        <Button variant="outline" size="sm" onClick={prevQ} disabled={currentIdx === 0} className="gap-1.5"><ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">Previous</span></Button>
        <div>{currentAns && modeConfig?.showImmediate && <span className={`text-sm font-bold ${currentAns.correct ? 'text-emerald-600' : 'text-red-600'}`}>{currentAns.correct ? '✓ Correct' : '✗ Incorrect'}</span>}</div>
        {currentIdx === questions.length - 1 ? (
          <Button size="sm" onClick={finishSession} className="gap-1.5 bg-gradient-to-r from-emerald-600 to-emerald-700"><CheckCircle className="w-4 h-4" />Submit</Button>
        ) : (
          <Button size="sm" onClick={nextQ} className="gap-1.5 bg-gradient-to-r from-blue-600 to-blue-700">Next<ArrowRight className="w-4 h-4" /></Button>
        )}
      </div>
    </div>
  );
}
