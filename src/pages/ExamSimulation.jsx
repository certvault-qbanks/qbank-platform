import React, { useState, useEffect, useCallback } from "react";
import { Question, StudySession, UserProgress, User } from "@/entities/all";
import { qbank } from "@/configs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Clock, ArrowLeft, ArrowRight, CheckCircle, XCircle, Trophy, RotateCcw,
  Flag, BookOpen, Send, Square, BarChart3, AlertTriangle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import PaywallModal from "../components/paywall/PaywallModal";

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
    </Card>
  );
}

// ─── Sidebar ─────────────────────────────────────────────
function Sidebar({ total, current, submitted, flagged, onSelect, showCorrectness }) {
  return (
    <div className="w-14 md:w-16 bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden flex-shrink-0">
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
      <div className="flex-1 overflow-y-auto p-1 space-y-0.5">
        {Array.from({ length: total }, (_, i) => {
          const ans = submitted[i];
          const isCurrent = i === current;
          const isFlagged = flagged.includes(i);
          let dotColor = "border-2 border-slate-300 bg-white";
          if (isCurrent) dotColor = "bg-blue-600 border-2 border-blue-600";
          else if (ans) {
            if (showCorrectness) dotColor = ans.correct ? "bg-emerald-500 border-2 border-emerald-500" : "bg-red-500 border-2 border-red-500";
            else dotColor = "bg-slate-800 border-2 border-slate-800";
          }
          return (
            <button key={i} onClick={() => onSelect(i)}
              className={`w-full flex items-center gap-1.5 px-1.5 py-1 rounded-md text-xs transition-all ${isCurrent ? 'bg-blue-50 font-bold text-blue-700' : 'hover:bg-slate-50 text-slate-600'}`}>
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
export default function ExamSimulationPage() {
  const navigate = useNavigate();
  const examId = new URLSearchParams(window.location.search).get('exam') || qbank.exams[0]?.id;
  const examConfig = qbank.exams.find(e => e.id === examId) || qbank.exams[0];

  const [phase, setPhase] = useState("active"); // active | results | review
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted] = useState({});
  const [flagged, setFlagged] = useState([]);
  const [timeLeft, setTimeLeft] = useState((examConfig?.timeLimit || 60) * 60);
  const [startTime] = useState(Date.now());
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [user, setUser] = useState(null);

  const labels = ["A", "B", "C", "D"];

  // ─── Load questions ──────────────────────────────────
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const u = await User.me(); setUser(u);
        if (u.subscription_status !== 'paid' && u.subscription_status !== 'active' && (u.questions_answered_count || 0) >= qbank.trial.freeQuestions) {
          setShowPaywall(true); setIsLoading(false); return;
        }
        let qs = await Question.list();
        if (examConfig?.categories?.length > 0) {
          const filtered = qs.filter(q => examConfig.categories.includes(q.category));
          if (filtered.length > 0) qs = filtered;
        }
        for (let i = qs.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [qs[i], qs[j]] = [qs[j], qs[i]]; }
        setQuestions(qs.slice(0, Math.min(examConfig?.questionCount || 100, qs.length)));
      } catch (e) { console.error(e); }
      setIsLoading(false);
    })();
  }, []);

  // ─── Timer ───────────────────────────────────────────
  useEffect(() => {
    if (phase !== "active" || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(p => { if (p <= 1) { endExam(); return 0; } return p - 1; }), 1000);
    return () => clearInterval(t);
  }, [phase, timeLeft]);

  // Reset selected option on navigation
  useEffect(() => {
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

  // ─── Submit single answer ────────────────────────────
  const submitAnswer = () => {
    if (selectedOption === null || submitted[currentIdx]) return;
    const q = questions[currentIdx];
    const isCorrect = q.options[selectedOption]?.is_correct;
    setSubmitted(prev => ({ ...prev, [currentIdx]: { selected: selectedOption, correct: isCorrect } }));
  };

  // ─── End exam ────────────────────────────────────────
  const endExam = useCallback(async () => {
    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    let correct = 0;
    // Count from submitted answers
    Object.values(submitted).forEach(a => { if (a.correct) correct++; });
    const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    const passed = score >= (examConfig?.passingScore || 70);
    setResults({ totalQuestions: questions.length, correctAnswers: correct, score, timeSpent: totalTime, passed, answeredCount: Object.keys(submitted).length });
    setPhase("results");

    try {
      await StudySession.create({ session_type: 'exam', category: examId, total_questions: questions.length, correct_answers: correct, total_time: totalTime, score_percentage: score });
      // Save individual progress
      for (const [idx, ans] of Object.entries(submitted)) {
        const q = questions[parseInt(idx)];
        if (q) {
          await UserProgress.create({ question_id: q.id, is_correct: ans.correct, selected_option: ans.selected, time_spent: 0, mode: 'exam' });
        }
      }
      if (user) await User.updateMyUserData({ questions_answered_count: (user.questions_answered_count || 0) + Object.keys(submitted).length });
    } catch (e) { console.error(e); }
  }, [startTime, questions, submitted, examConfig, examId, user]);

  const nextQ = () => { if (currentIdx < questions.length - 1) setCurrentIdx(p => p + 1); };
  const prevQ = () => { if (currentIdx > 0) setCurrentIdx(p => p - 1); };
  const toggleFlag = () => setFlagged(p => p.includes(currentIdx) ? p.filter(i => i !== currentIdx) : [...p, currentIdx]);
  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" /></div>;
  if (showPaywall) return <div className="min-h-screen p-8"><PaywallModal questionsAnswered={user?.questions_answered_count || 50} /></div>;

  // ═══ RESULTS ═════════════════════════════════════════
  if (phase === "results" && results) {
    const skipped = questions.length - results.answeredCount;
    const incorrect = results.answeredCount - results.correctAnswers;

    // Domain breakdown
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
          <Trophy className={`w-16 h-16 mx-auto mb-4 ${results.passed ? 'text-emerald-500' : 'text-amber-500'}`} />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{examConfig?.name} Complete</h1>
          <div className={`text-7xl font-bold mb-3 ${results.score >= 80 ? 'text-emerald-600' : results.score >= (examConfig?.passingScore || 70) ? 'text-blue-600' : 'text-red-600'}`}>
            {results.score}%
          </div>
          <Badge className={`text-lg px-4 py-2 ${results.passed ? 'bg-emerald-500' : 'bg-red-500'} text-white border-0`}>
            {results.passed ? 'PASSED' : `Need ${examConfig?.passingScore || 70}% to pass`}
          </Badge>
          <div className="flex items-center justify-center gap-3 flex-wrap mt-4">
            <Badge className="bg-emerald-100 text-emerald-700 border-0 gap-1"><CheckCircle className="w-3.5 h-3.5" />{results.correctAnswers} Correct</Badge>
            <Badge className="bg-red-100 text-red-700 border-0 gap-1"><XCircle className="w-3.5 h-3.5" />{incorrect} Incorrect</Badge>
            {skipped > 0 && <Badge className="bg-slate-100 text-slate-700 border-0 gap-1">{skipped} Skipped</Badge>}
          </div>
          <p className="text-sm text-slate-500 mt-2">
            {formatTime(results.timeSpent)} elapsed · Results saved
          </p>
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
          <Button variant="outline" onClick={() => navigate(createPageUrl("PracticeTests"))} className="flex-1 gap-2 h-12"><RotateCcw className="w-4 h-4" />Try Again</Button>
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

  // ═══ ACTIVE EXAM ═════════════════════════════════════
  const currentQ = questions[currentIdx];
  if (!currentQ) return <div className="p-12 text-center text-slate-500">No questions available.</div>;
  const isSubmittedQ = !!submitted[currentIdx];

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <Sidebar total={questions.length} current={currentIdx} submitted={submitted} flagged={flagged} onSelect={setCurrentIdx} showCorrectness={false} />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-slate-200">
          <span className="text-sm font-bold text-slate-800">Item {currentIdx + 1} of {questions.length}</span>

          <div className="flex items-center gap-1 ml-2">
            <Button variant="outline" size="sm" className="h-8 px-2.5" onClick={prevQ} disabled={currentIdx === 0}><ArrowLeft className="w-3.5 h-3.5" /></Button>
            <Button variant="outline" size="sm" className="h-8 px-2.5" onClick={nextQ} disabled={currentIdx === questions.length - 1}><ArrowRight className="w-3.5 h-3.5" /></Button>
          </div>

          <Button
            variant={flagged.includes(currentIdx) ? "default" : "outline"}
            size="sm"
            className={`h-8 gap-1.5 ${flagged.includes(currentIdx) ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}`}
            onClick={toggleFlag}
          >
            <Flag className={`w-3.5 h-3.5 ${flagged.includes(currentIdx) ? 'fill-white' : ''}`} />
            <span className="text-xs hidden sm:inline">{flagged.includes(currentIdx) ? 'Marked' : 'Mark'}</span>
          </Button>

          <div className="flex-1" />

          <span className="text-xs text-slate-500 hidden sm:inline">{Object.keys(submitted).length}/{questions.length} answered</span>

          {/* Timer */}
          <div className={`px-3 py-1.5 rounded-lg font-mono text-sm font-bold ${timeLeft < 300 ? 'bg-red-100 text-red-700 animate-pulse' : timeLeft < 600 ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
            <Clock className="w-3.5 h-3.5 inline mr-1.5" />{formatTime(timeLeft)}
          </div>

          <Button variant="outline" size="sm" className="h-8 text-xs text-slate-600" onClick={() => {
            const unanswered = questions.length - Object.keys(submitted).length;
            const msg = unanswered > 0
              ? `You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. End exam?`
              : "End exam and see your results?";
            if (confirm(msg)) endExam();
          }}>
            <Square className="w-3 h-3 mr-1" />End Exam
          </Button>
        </div>

        {/* Question Content */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-3xl mx-auto">
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
                      let cls = "w-full p-4 text-left rounded-xl border-2 transition-all ";
                      if (!isSubmittedQ) {
                        cls += isSelected ? "border-blue-500 bg-blue-50 shadow-sm" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 cursor-pointer";
                      } else {
                        cls += (submitted[currentIdx].selected === i) ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-slate-50";
                      }
                      return (
                        <button key={i} onClick={() => !isSubmittedQ && setSelectedOption(i)} disabled={isSubmittedQ} className={cls}>
                          <div className="flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              isSelected && !isSubmittedQ ? 'border-blue-500 bg-blue-500 text-white' :
                              isSubmittedQ && submitted[currentIdx]?.selected === i ? 'border-blue-500 bg-blue-500 text-white' :
                              'border-slate-300 text-slate-500'
                            }`}>{labels[i]}</div>
                            <span className="flex-1 text-sm font-medium text-slate-800 text-left">{opt.text}</span>
                          </div>
                        </button>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Submit / Proceed */}
                <div className="flex justify-center mb-4">
                  {!isSubmittedQ && selectedOption !== null && (
                    <Button onClick={submitAnswer} className="gap-2 h-11 px-8 bg-gradient-to-r from-blue-600 to-blue-700 shadow-md">
                      <Send className="w-4 h-4" />Submit Answer
                    </Button>
                  )}
                  {!isSubmittedQ && selectedOption === null && (
                    <p className="text-sm text-slate-400">Select an answer, then submit</p>
                  )}
                  {isSubmittedQ && (
                    <p className="text-sm text-blue-600 font-medium flex items-center gap-1"><CheckCircle className="w-4 h-4" />Answer locked</p>
                  )}
                </div>

                {isSubmittedQ && currentIdx < questions.length - 1 && (
                  <div className="flex justify-center">
                    <Button onClick={nextQ} className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700">
                      Proceed to Next Item<ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {isSubmittedQ && currentIdx === questions.length - 1 && (
                  <div className="flex justify-center">
                    <Button onClick={() => {
                      const unanswered = questions.length - Object.keys(submitted).length;
                      const msg = unanswered > 0 ? `You have ${unanswered} unanswered. End exam?` : "End exam?";
                      if (confirm(msg)) endExam();
                    }} className="gap-2 bg-gradient-to-r from-slate-700 to-slate-800">
                      <Square className="w-4 h-4" />End Exam
                    </Button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
