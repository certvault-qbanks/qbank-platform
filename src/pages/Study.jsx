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
  Flag, BookOpen, RotateCcw, BarChart3, Timer, Play, X, Send, Square, Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PaywallModal from "../components/paywall/PaywallModal";

const STUDY_MODES = {
  tutor:       { name: "Tutor Mode",  desc: "Untimed · Submit to see feedback", icon: Brain, timed: false, showImmediate: true },
  timed_exam:  { name: "Timed Exam",  desc: "Timed · Review at end",            icon: Timer, timed: true,  showImmediate: false },
  timed_tutor: { name: "Timed Tutor", desc: "Timed · Pauses for feedback",      icon: Zap,   timed: true,  showImmediate: true, pauseOnAnswer: true },
};

// ─── Explanation Card ────────────────────────────────────
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

// ─── Sidebar Question Navigator (NBME-style) ────────────
function Sidebar({ total, current, submitted, flagged, onSelect, showCorrectness }) {
  return (
    <div className="w-14 md:w-16 bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden flex-shrink-0">
      {/* Legend */}
      <div className="p-2 border-b border-slate-100 space-y-1">
        <div className="flex items-center gap-1.5 text-[9px] text-slate-500"><div className="w-2 h-2 rounded-full bg-blue-600" />Current</div>
        {showCorrectness ? (
          <>
            <div className="flex items-center gap-1.5 text-[9px] text-slate-500"><div className="w-2 h-2 rounded-full bg-emerald-500" />Correct</div>
            <div className="flex items-center gap-1.5 text-[9px] text-slate-500"><div className="w-2 h-2 rounded-full bg-red-500" />Wrong</div>
          </>
        ) : (
          <div className="flex items-center gap-1.5 text-[9px] text-slate-500"><div className="w-2 h-2 rounded-full bg-slate-800" />Done</div>
        )}
        <div className="flex items-center gap-1.5 text-[9px] text-slate-500"><div className="w-2 h-2 rounded-full border-2 border-slate-300 bg-white" />Open</div>
        <div className="flex items-center gap-1.5 text-[9px] text-slate-500"><Flag className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />Flag</div>
      </div>

      {/* Question numbers */}
      <div className="flex-1 overflow-y-auto p-1 space-y-0.5">
        {Array.from({ length: total }, (_, i) => {
          const ans = submitted[i];
          const isCurrent = i === current;
          const isFlagged = flagged.includes(i);

          let dotColor = "border-2 border-slate-300 bg-white"; // unanswered
          if (isCurrent) {
            dotColor = "bg-blue-600 border-2 border-blue-600";
          } else if (ans) {
            if (showCorrectness) {
              dotColor = ans.correct ? "bg-emerald-500 border-2 border-emerald-500" : "bg-red-500 border-2 border-red-500";
            } else {
              dotColor = "bg-slate-800 border-2 border-slate-800";
            }
          }

          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              className={`w-full flex items-center gap-1.5 px-1.5 py-1 rounded-md text-xs transition-all ${
                isCurrent ? 'bg-blue-50 font-bold text-blue-700' : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotColor}`} />
              <span className="flex-1 text-left">{i + 1}</span>
              {isFlagged && <Flag className="w-2.5 h-2.5 text-amber-500 fill-amber-500 flex-shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Main Study Component
// ═══════════════════════════════════════════════════════════
export default function Study() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState("setup");
  const [mode, setMode] = useState(null);
  const [allQuestions, setAllQuestions] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted] = useState({});
  const [flagged, setFlagged] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerPaused, setTimerPaused] = useState(false);
  const [questionStart, setQuestionStart] = useState(Date.now());
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sessionId, setSessionId] = useState(null); // Track saved session for review
  const [user, setUser] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [filters, setFilters] = useState({ category: "all", difficulty: "all", count: "20" });

  const CATEGORIES = [{ value: "all", label: "All Categories" }, ...qbank.categories];
  const freeLimit = qbank.trial.freeQuestions || 50;

  // ─── Load questions ──────────────────────────────────
  useEffect(() => {
    (async () => {
      setIsLoadingQuestions(true);
      try {
        const [dbQ, u] = await Promise.all([Question.list(), User.me()]);
        setUser(u);
        const isPaid = u.subscription_status === 'active' || u.subscription_status === 'paid';
        if (!isPaid && (u.questions_answered_count || 0) >= freeLimit) setShowPaywall(true);
        setAllQuestions(dbQ.length > 0 ? dbQ : (qbank.sampleQuestions || []).map(sq => ({
          id: sq.id, category: sq.category, difficulty: sq.difficulty,
          question_text: sq.stem || sq.question, options: sq.options,
          explanation: sq.educational_objective || '', reference: sq.bottom_line || '', tags: sq.related_topics || [],
        })));
      } catch (e) { console.error(e); setAllQuestions([]); }
      setIsLoadingQuestions(false);
    })();
  }, []);

  // ─── Timer ───────────────────────────────────────────
  useEffect(() => {
    if (phase !== "active" || !mode || !STUDY_MODES[mode].timed) return;
    const iv = setInterval(() => {
      if (!timerPaused) setTimeLeft(p => { if (p <= 1) { endBlock(); return 0; } return p - 1; });
    }, 1000);
    return () => clearInterval(iv);
  }, [phase, mode, timerPaused]);

  useEffect(() => {
    setQuestionStart(Date.now());
    if (submitted[currentIdx]) setSelectedOption(submitted[currentIdx].selected);
    else setSelectedOption(null);
  }, [currentIdx]);

  // ─── Keyboard ────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;
      if (phase !== "active" && phase !== "review") return;
      if (e.key === "ArrowRight") { e.preventDefault(); nextQ(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prevQ(); }
      else if ("abcd".includes(e.key?.toLowerCase()) && phase === "active" && !submitted[currentIdx]) {
        e.preventDefault(); setSelectedOption("abcd".indexOf(e.key.toLowerCase()));
      } else if (e.key === "Enter" && phase === "active" && selectedOption !== null && !submitted[currentIdx]) {
        e.preventDefault(); submitAnswer();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, currentIdx, selectedOption, submitted, questions]);

  // ─── Start session ───────────────────────────────────
  const startSession = () => {
    const isPaid = user?.subscription_status === 'active' || user?.subscription_status === 'paid';
    if (!isPaid && (user?.questions_answered_count || 0) >= freeLimit) { setShowPaywall(true); return; }

    let pool = [...allQuestions];
    if (filters.category !== "all") pool = pool.filter(q => q.category === filters.category);
    if (filters.difficulty !== "all") pool = pool.filter(q => q.difficulty === filters.difficulty);
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const qs = pool.slice(0, Math.min(parseInt(filters.count) || 20, 40, pool.length));
    if (qs.length === 0) return;

    setQuestions(qs); setSubmitted({}); setSelectedOption(null); setFlagged([]);
    setCurrentIdx(0); setSessionStartTime(Date.now()); setSessionId(null); setPhase("active");
    if (STUDY_MODES[mode].timed) { setTimeLeft(qs.length * 90); setTimerPaused(false); }
  };

  // ─── Submit answer ───────────────────────────────────
  const submitAnswer = async () => {
    if (selectedOption === null || submitted[currentIdx]) return;
    const q = questions[currentIdx];
    const isCorrect = q.options[selectedOption]?.is_correct;
    const timeSpent = Math.round((Date.now() - questionStart) / 1000);
    setSubmitted(prev => ({ ...prev, [currentIdx]: { selected: selectedOption, correct: isCorrect, timeSpent } }));
    if (mode === "timed_tutor") setTimerPaused(true);

    // Save per-question + update trial count
    if (user) {
      const newCount = (user.questions_answered_count || 0) + 1;
      setUser(prev => ({ ...prev, questions_answered_count: newCount }));
      try {
        await UserProgress.create({ question_id: q.id, is_correct: isCorrect, selected_option: selectedOption, time_spent: timeSpent, mode: STUDY_MODES[mode]?.timed ? 'exam' : 'study' });
        await User.updateMyUserData({ questions_answered_count: newCount });
      } catch (e) { console.error(e); }
    }
  };

  // ─── End block ───────────────────────────────────────
  const endBlock = useCallback(async () => {
    setPhase("results");
    const totalTime = Math.floor((Date.now() - (sessionStartTime || Date.now())) / 1000);
    const correctCount = Object.values(submitted).filter(a => a.correct).length;
    const totalAnswered = Object.keys(submitted).length;
    const score = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
    try {
      const session = await StudySession.create({
        session_type: STUDY_MODES[mode]?.timed ? 'exam' : 'study',
        category: filters.category, total_questions: questions.length,
        correct_answers: correctCount, total_time: totalTime,
        score_percentage: score, difficulty_filter: filters.difficulty,
      });
      setSessionId(session?.id || null);
    } catch (e) { console.error(e); }
  }, [submitted, questions, mode, filters, sessionStartTime]);

  const nextQ = () => { if (currentIdx < questions.length - 1) { setCurrentIdx(p => p + 1); setTimerPaused(false); } };
  const prevQ = () => { if (currentIdx > 0) setCurrentIdx(p => p - 1); };
  const toggleFlag = () => setFlagged(p => p.includes(currentIdx) ? p.filter(i => i !== currentIdx) : [...p, currentIdx]);
  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const modeConfig = mode ? STUDY_MODES[mode] : null;
  const currentQ = questions[currentIdx];
  const currentSubmitted = submitted[currentIdx];
  const showExplanation = !!currentSubmitted && modeConfig?.showImmediate;
  const labels = ["A", "B", "C", "D"];
  const isPaid = user?.subscription_status === 'active' || user?.subscription_status === 'paid';
  const questionsRemaining = isPaid ? null : Math.max(0, freeLimit - (user?.questions_answered_count || 0));

  if (showPaywall) return <div className="min-h-screen p-4 md:p-8"><PaywallModal questionsAnswered={user?.questions_answered_count || freeLimit} /></div>;

  // ═══ SETUP ═══════════════════════════════════════════
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

        {questionsRemaining !== null && (
          <div className={`mb-6 p-4 rounded-xl border-2 flex items-center justify-between ${questionsRemaining <= 5 ? 'border-red-200 bg-red-50' : questionsRemaining <= 15 ? 'border-amber-200 bg-amber-50' : 'border-blue-200 bg-blue-50'}`}>
            <div className="flex items-center gap-3">
              <Clock className={`w-5 h-5 ${questionsRemaining <= 5 ? 'text-red-600' : 'text-blue-600'}`} />
              <div><p className="font-semibold text-sm">Free Trial</p><p className="text-xs text-slate-600">{questionsRemaining} of {freeLimit} remaining</p></div>
            </div>
            <Progress value={((freeLimit - questionsRemaining) / freeLimit) * 100} className="w-24 h-2" />
          </div>
        )}

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
            <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Questions (max 40)</label>
              <Select value={filters.count} onValueChange={v => setFilters(p => ({ ...p, count: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="5">5</SelectItem><SelectItem value="10">10</SelectItem><SelectItem value="20">20</SelectItem><SelectItem value="30">30</SelectItem><SelectItem value="40">40 (Full Block)</SelectItem></SelectContent></Select></div>
          </div>
          {!isLoadingQuestions && <p className="text-xs text-slate-500 mt-2">{filteredCount} questions match your filters</p>}
        </div>

        <Button onClick={startSession} disabled={!mode || isLoadingQuestions || filteredCount === 0}
          className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg gap-3">
          <Play className="w-5 h-5" />{isLoadingQuestions ? "Loading..." : !mode ? "Select a mode" : `Start ${STUDY_MODES[mode].name}`}
        </Button>
        <div className="text-center mt-4 text-[11px] text-slate-400 bg-slate-50 rounded-lg p-2.5"><strong>Keyboard:</strong> A/B/C/D = select · Enter = submit · ← → = navigate</div>
      </div>
    );
  }

  // ═══ RESULTS ═════════════════════════════════════════
  if (phase === "results") {
    const totalSubmitted = Object.keys(submitted).length;
    const correct = Object.values(submitted).filter(a => a.correct).length;
    const incorrect = totalSubmitted - correct;
    const skipped = questions.length - totalSubmitted;
    const pct = totalSubmitted > 0 ? Math.round((correct / totalSubmitted) * 100) : 0;
    const catStats = {};
    Object.entries(submitted).forEach(([idx, ans]) => {
      const cat = questions[parseInt(idx)]?.category || 'unknown';
      if (!catStats[cat]) catStats[cat] = { correct: 0, total: 0 };
      catStats[cat].total++;
      if (ans.correct) catStats[cat].correct++;
    });

    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="text-center mb-8">
          <div className={`text-7xl font-bold mb-3 ${pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{pct}%</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Block Complete</h2>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Badge className="bg-emerald-100 text-emerald-700 border-0 gap-1"><CheckCircle className="w-3.5 h-3.5" />{correct} Correct</Badge>
            <Badge className="bg-red-100 text-red-700 border-0 gap-1"><XCircle className="w-3.5 h-3.5" />{incorrect} Incorrect</Badge>
            {skipped > 0 && <Badge className="bg-slate-100 text-slate-700 border-0 gap-1">{skipped} Skipped</Badge>}
          </div>
          <p className="text-sm text-slate-500 mt-2">Results saved</p>
        </div>
        {Object.keys(catStats).length > 0 && (
          <Card className="border-0 shadow-lg bg-white mb-6">
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-blue-600" />Performance by Domain</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(catStats).map(([cat, s]) => {
                const catPct = Math.round((s.correct / s.total) * 100);
                return (<div key={cat}><div className="flex justify-between text-sm mb-1"><span className="text-slate-700 truncate">{qbank.categories.find(c => c.value === cat)?.label || cat}</span><span className={`font-semibold ${catPct >= 80 ? 'text-emerald-600' : catPct >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{s.correct}/{s.total}</span></div><Progress value={catPct} className="h-2" /></div>);
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

  // ═══ REVIEW ══════════════════════════════════════════
  if (phase === "review") {
    const rQ = questions[currentIdx];
    const rAns = submitted[currentIdx];
    return (
      <div className="flex h-full">
        <Sidebar total={questions.length} current={currentIdx} submitted={submitted} flagged={flagged} onSelect={setCurrentIdx} showCorrectness={true} />
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between gap-4 px-4 py-3 bg-white border-b border-slate-200">
            <Button variant="ghost" size="sm" onClick={() => setPhase("results")} className="gap-2"><ArrowLeft className="w-4 h-4" />Results</Button>
            <span className="text-sm font-semibold text-slate-700">Item {currentIdx + 1} of {questions.length}</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={prevQ} disabled={currentIdx === 0}><ArrowLeft className="w-4 h-4" /></Button>
              <Button variant="outline" size="sm" onClick={nextQ} disabled={currentIdx === questions.length - 1}><ArrowRight className="w-4 h-4" /></Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 md:p-6">
            <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-6">
              <div>
                <div className="flex gap-2 mb-4">
                  <Badge variant="outline">Q{currentIdx + 1}</Badge>
                  <Badge className="capitalize bg-slate-100 text-slate-700">{qbank.categories.find(c => c.value === rQ?.category)?.label || rQ?.category}</Badge>
                  {rAns ? <Badge className={rAns.correct ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}>{rAns.correct ? "Correct" : "Incorrect"}</Badge>
                    : <Badge className="bg-slate-300 text-slate-700">Skipped</Badge>}
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
      </div>
    );
  }

  // ═══ ACTIVE SESSION ══════════════════════════════════
  if (!currentQ) return <div className="p-12 text-center text-slate-500">No questions available.</div>;
  const isSubmittedQ = !!currentSubmitted;

  return (
    <div className="flex h-full">
      {/* ─── Left Sidebar (NBME-style) ─────────────────── */}
      <Sidebar total={questions.length} current={currentIdx} submitted={submitted} flagged={flagged} onSelect={setCurrentIdx} showCorrectness={modeConfig?.showImmediate} />

      {/* ─── Main Content ──────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-slate-200">
          <span className="text-sm font-bold text-slate-800">Item {currentIdx + 1} of {questions.length}</span>

          <div className="flex items-center gap-1 ml-2">
            <Button variant="outline" size="sm" className="h-8 px-2.5" onClick={prevQ} disabled={currentIdx === 0}><ArrowLeft className="w-3.5 h-3.5" /></Button>
            <Button variant="outline" size="sm" className="h-8 px-2.5" onClick={nextQ} disabled={currentIdx === questions.length - 1}><ArrowRight className="w-3.5 h-3.5" /></Button>
          </div>

          {/* Mark/Flag */}
          <Button
            variant={flagged.includes(currentIdx) ? "default" : "outline"}
            size="sm"
            className={`h-8 gap-1.5 ${flagged.includes(currentIdx) ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}`}
            onClick={toggleFlag}
          >
            <Flag className={`w-3.5 h-3.5 ${flagged.includes(currentIdx) ? 'fill-white' : ''}`} />
            <span className="text-xs">{flagged.includes(currentIdx) ? 'Marked' : 'Mark'}</span>
          </Button>

          <div className="flex-1" />

          {/* Trial counter */}
          {questionsRemaining !== null && (
            <Badge variant="outline" className={`text-xs ${questionsRemaining <= 5 ? 'border-red-300 text-red-600' : 'border-blue-300 text-blue-600'}`}>
              {Math.max(0, questionsRemaining)} free left
            </Badge>
          )}

          {/* Timer */}
          {modeConfig?.timed && (
            <div className={`px-3 py-1.5 rounded-lg font-mono text-sm font-bold ${timeLeft < 60 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-blue-50 text-blue-700'}`}>
              {formatTime(timeLeft)}{timerPaused && " ⏸"}
            </div>
          )}

          {/* End Block button always visible */}
          <Button variant="outline" size="sm" className="h-8 text-xs text-slate-600" onClick={() => { if (confirm("End this block?")) endBlock(); }}>
            <Square className="w-3 h-3 mr-1" />End Block
          </Button>
        </div>

        {/* Question Area */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <div className={`max-w-5xl mx-auto ${showExplanation ? 'grid lg:grid-cols-2 gap-6 items-start' : ''}`}>
            <AnimatePresence mode="wait">
              <motion.div key={currentIdx} initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} transition={{ duration: 0.15 }}>
                <Card className="border-0 shadow-lg bg-white mb-4">
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className="capitalize bg-slate-100 text-slate-700 border-0">
                        {qbank.categories.find(c => c.value === currentQ.category)?.label || currentQ.category?.replace(/_/g, ' ')}
                      </Badge>
                      <Badge className={`border-0 ${currentQ.difficulty === 'basic' ? 'bg-emerald-100 text-emerald-700' : currentQ.difficulty === 'advanced' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {currentQ.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className="text-base md:text-lg font-semibold text-slate-900 leading-relaxed">
                      {currentQ.question_text}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-2.5">
                    {currentQ.options.map((opt, i) => {
                      const isSelected = selectedOption === i;
                      const isCorrect = opt.is_correct;
                      let cls = "w-full p-4 text-left rounded-xl border-2 transition-all ";
                      if (!isSubmittedQ) {
                        cls += isSelected ? "border-blue-500 bg-blue-50 shadow-sm" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 cursor-pointer";
                      } else if (showExplanation) {
                        cls += isCorrect ? "border-emerald-400 bg-emerald-50" : (currentSubmitted.selected === i) ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50";
                      } else {
                        cls += (currentSubmitted.selected === i) ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-slate-50";
                      }
                      return (
                        <button key={i} onClick={() => !isSubmittedQ && setSelectedOption(i)} disabled={isSubmittedQ} className={cls}>
                          <div className="flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              showExplanation && isCorrect ? 'border-emerald-500 bg-emerald-500 text-white' :
                              showExplanation && currentSubmitted?.selected === i && !isCorrect ? 'border-red-500 bg-red-500 text-white' :
                              isSelected && !isSubmittedQ ? 'border-blue-500 bg-blue-500 text-white' :
                              isSubmittedQ && currentSubmitted?.selected === i ? 'border-blue-500 bg-blue-500 text-white' :
                              'border-slate-300 text-slate-500'
                            }`}>{labels[i]}</div>
                            <span className="flex-1 text-sm font-medium text-slate-800 text-left">{opt.text}</span>
                            {showExplanation && isCorrect && <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
                            {showExplanation && currentSubmitted?.selected === i && !isCorrect && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                          </div>
                        </button>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Submit / Status */}
                <div className="flex justify-center mb-4">
                  {!isSubmittedQ && selectedOption !== null && (
                    <Button onClick={submitAnswer} className="gap-2 h-11 px-8 bg-gradient-to-r from-blue-600 to-blue-700 shadow-md">
                      <Send className="w-4 h-4" />Submit Answer
                    </Button>
                  )}
                  {!isSubmittedQ && selectedOption === null && (
                    <p className="text-sm text-slate-400">Select an answer, then submit</p>
                  )}
                  {isSubmittedQ && !modeConfig?.showImmediate && (
                    <p className="text-sm text-blue-600 font-medium flex items-center gap-1"><CheckCircle className="w-4 h-4" />Answer submitted</p>
                  )}
                  {isSubmittedQ && modeConfig?.showImmediate && (
                    <span className={`text-sm font-bold ${currentSubmitted.correct ? 'text-emerald-600' : 'text-red-600'}`}>
                      {currentSubmitted.correct ? '✓ Correct' : '✗ Incorrect'}
                    </span>
                  )}
                </div>

                {/* Proceed to Next */}
                {isSubmittedQ && currentIdx < questions.length - 1 && (
                  <div className="flex justify-center">
                    <Button onClick={nextQ} className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700">
                      Proceed to Next Item<ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {isSubmittedQ && currentIdx === questions.length - 1 && (
                  <div className="flex justify-center">
                    <Button onClick={endBlock} className="gap-2 bg-gradient-to-r from-slate-700 to-slate-800">
                      <Square className="w-4 h-4" />End Block
                    </Button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {showExplanation && <ExplanationCard question={currentQ} selectedOption={currentSubmitted?.selected} />}
          </div>
        </div>
      </div>
    </div>
  );
}
