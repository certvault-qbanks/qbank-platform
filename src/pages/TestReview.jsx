import React, { useState, useEffect } from "react";
import { StudySession, UserProgress, Question } from "@/entities/all";
import { qbank } from "@/configs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, ArrowRight, CheckCircle, XCircle, Flag, BookOpen,
  BarChart3, Clock, RotateCcw
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";

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

function Sidebar({ total, current, answers, onSelect }) {
  return (
    <div className="w-14 md:w-16 bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden flex-shrink-0">
      <div className="p-2 border-b border-slate-100 space-y-1">
        <div className="flex items-center gap-1.5 text-[9px] text-slate-500"><div className="w-2 h-2 rounded-full bg-blue-600" />Current</div>
        <div className="flex items-center gap-1.5 text-[9px] text-slate-500"><div className="w-2 h-2 rounded-full bg-emerald-500" />Correct</div>
        <div className="flex items-center gap-1.5 text-[9px] text-slate-500"><div className="w-2 h-2 rounded-full bg-red-500" />Wrong</div>
        <div className="flex items-center gap-1.5 text-[9px] text-slate-500"><div className="w-2 h-2 rounded-full border-2 border-slate-300 bg-white" />Skipped</div>
      </div>
      <div className="flex-1 overflow-y-auto p-1 space-y-0.5">
        {Array.from({ length: total }, (_, i) => {
          const ans = answers[i];
          const isCurrent = i === current;
          let dotColor = "border-2 border-slate-300 bg-white";
          if (isCurrent) dotColor = "bg-blue-600 border-2 border-blue-600";
          else if (ans) dotColor = ans.correct ? "bg-emerald-500 border-2 border-emerald-500" : "bg-red-500 border-2 border-red-500";
          return (
            <button key={i} onClick={() => onSelect(i)}
              className={`w-full flex items-center gap-1.5 px-1.5 py-1 rounded-md text-xs transition-all ${isCurrent ? 'bg-blue-50 font-bold text-blue-700' : 'hover:bg-slate-50 text-slate-600'}`}>
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotColor}`} />
              <span className="flex-1 text-left">{i + 1}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function TestReview() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const labels = ["A", "B", "C", "D"];

  useEffect(() => {
    if (!sessionId) { setError("No session ID provided."); setIsLoading(false); return; }

    (async () => {
      setIsLoading(true);
      try {
        // Load session info
        const sessions = await StudySession.list("-created_date");
        const thisSession = sessions.find(s => s.id === sessionId);
        if (!thisSession) { setError("Session not found."); setIsLoading(false); return; }
        setSession(thisSession);

        // Load user progress to find which questions were answered
        const allProgress = await UserProgress.list("-created_date");

        // Load all questions from DB
        const allQuestions = await Question.list();
        const questionMap = {};
        allQuestions.forEach(q => { questionMap[q.id] = q; });

        // Find progress entries that match this session's timeframe
        // Since we don't store session_id on user_progress, we match by time window
        const sessionDate = new Date(thisSession.created_date);
        const windowStart = new Date(sessionDate.getTime() - (thisSession.total_time || 3600) * 1000 - 60000);
        const windowEnd = new Date(sessionDate.getTime() + 60000);

        // Get progress entries in the time window, limited to session question count
        const sessionProgress = allProgress
          .filter(p => {
            const pDate = new Date(p.created_date);
            return pDate >= windowStart && pDate <= windowEnd;
          })
          .slice(0, thisSession.total_questions || 50);

        // Build questions and answers from progress
        const reviewQuestions = [];
        const reviewAnswers = {};

        if (sessionProgress.length > 0) {
          sessionProgress.forEach((prog, idx) => {
            const q = questionMap[prog.question_id];
            if (q) {
              reviewQuestions.push(q);
              reviewAnswers[idx] = {
                selected: prog.selected_option,
                correct: prog.is_correct,
                timeSpent: prog.time_spent || 0,
              };
            }
          });
        }

        // If we couldn't reconstruct from progress, show a sample from the category
        if (reviewQuestions.length === 0) {
          let pool = allQuestions;
          if (thisSession.category && thisSession.category !== 'all') {
            pool = pool.filter(q => q.category === thisSession.category);
          }
          const sampleCount = Math.min(thisSession.total_questions || 20, pool.length);
          for (let i = 0; i < sampleCount; i++) {
            reviewQuestions.push(pool[i]);
          }
          setError("Could not load exact questions from this session. Showing questions from the same category.");
        }

        setQuestions(reviewQuestions);
        setAnswers(reviewAnswers);
      } catch (e) {
        console.error(e);
        setError("Error loading session data.");
      }
      setIsLoading(false);
    })();
  }, [sessionId]);

  // Keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); if (currentIdx < questions.length - 1) setCurrentIdx(p => p + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); if (currentIdx > 0) setCurrentIdx(p => p - 1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentIdx, questions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-500">Loading session review...</p>
        </div>
      </div>
    );
  }

  if (!session || questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Session Not Found</h2>
        <p className="text-slate-500 mb-6">{error || "Could not load this session for review."}</p>
        <Button onClick={() => navigate(createPageUrl("TestHistory"))} className="gap-2">
          <ArrowLeft className="w-4 h-4" />Back to History
        </Button>
      </div>
    );
  }

  const rQ = questions[currentIdx];
  const rAns = answers[currentIdx];
  const score = session.score_percentage || 0;

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <Sidebar total={questions.length} current={currentIdx} answers={answers} onSelect={setCurrentIdx} />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-white border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(createPageUrl("TestHistory"))} className="gap-2">
              <ArrowLeft className="w-4 h-4" />History
            </Button>
            <div className="hidden sm:block h-5 w-px bg-slate-200" />
            <div className="hidden sm:flex items-center gap-2">
              <Badge className={`${score >= 80 ? 'bg-emerald-100 text-emerald-700' : score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'} border-0`}>
                {score}%
              </Badge>
              <span className="text-xs text-slate-500">
                {session.correct_answers}/{session.total_questions} correct
              </span>
            </div>
          </div>

          <span className="text-sm font-semibold text-slate-700">Item {currentIdx + 1} of {questions.length}</span>

          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => { if (currentIdx > 0) setCurrentIdx(p => p - 1); }} disabled={currentIdx === 0}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => { if (currentIdx < questions.length - 1) setCurrentIdx(p => p + 1); }} disabled={currentIdx === questions.length - 1}>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-700">{error}</div>
        )}

        {/* Question Content */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-6">
            <AnimatePresence mode="wait">
              <motion.div key={currentIdx} initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} transition={{ duration: 0.15 }}>
                <div className="flex gap-2 mb-4">
                  <Badge variant="outline">Q{currentIdx + 1}</Badge>
                  <Badge className="capitalize bg-slate-100 text-slate-700">{qbank.categories.find(c => c.value === rQ?.category)?.label || rQ?.category}</Badge>
                  {rAns ? (
                    <Badge className={rAns.correct ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}>
                      {rAns.correct ? "Correct" : "Incorrect"}
                    </Badge>
                  ) : (
                    <Badge className="bg-slate-300 text-slate-700">Skipped</Badge>
                  )}
                </div>

                <h2 className="text-lg font-semibold text-slate-900 leading-relaxed mb-5">{rQ?.question_text}</h2>

                <div className="space-y-2.5">
                  {rQ?.options.map((opt, i) => {
                    const isCorrect = opt.is_correct;
                    const isSelected = rAns?.selected === i;
                    return (
                      <div key={i} className={`p-4 rounded-xl border-2 ${isCorrect ? 'border-emerald-400 bg-emerald-50' : isSelected ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            isCorrect ? 'border-emerald-500 bg-emerald-500 text-white' :
                            isSelected ? 'border-red-500 bg-red-500 text-white' :
                            'border-slate-300 text-slate-500'
                          }`}>{labels[i]}</div>
                          <span className="flex-1 text-sm font-medium text-slate-800">{opt.text}</span>
                          {isCorrect && <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
                          {isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Time spent on this question */}
                {rAns?.timeSpent > 0 && (
                  <div className="flex items-center gap-1.5 mt-4 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    Answered in {rAns.timeSpent}s
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Explanation */}
            {rQ && <ExplanationCard question={rQ} selectedOption={rAns?.selected} />}
          </div>
        </div>
      </div>
    </div>
  );
}
