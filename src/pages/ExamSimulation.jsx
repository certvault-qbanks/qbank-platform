import React, { useState, useEffect, useCallback } from "react";
import { Question, StudySession, User } from "@/entities/all";
import { qbank } from "@/configs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowLeft, ArrowRight, CheckCircle, AlertTriangle, Trophy, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import PaywallModal from "../components/paywall/PaywallModal";

export default function ExamSimulationPage() {
  const navigate = useNavigate();
  const examId = new URLSearchParams(window.location.search).get('exam') || qbank.exams[0]?.id;
  const examConfig = qbank.exams.find(e => e.id === examId) || qbank.exams[0];

  const [examState, setExamState] = useState('active');
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState((examConfig?.timeLimit || 60) * 60);
  const [startTime] = useState(Date.now());
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [user, setUser] = useState(null);

  const submitExam = useCallback(async () => {
    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    let correct = 0;
    questions.forEach((q, i) => { if (answers[i] !== undefined && q.options[answers[i]]?.is_correct) correct++; });
    const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    setResults({ totalQuestions: questions.length, correctAnswers: correct, score, timeSpent: totalTime, passed: score >= (examConfig?.passingScore || 70) });
    setExamState('completed');
    try {
      await StudySession.create({ session_type: 'exam', category: examId, total_questions: questions.length, correct_answers: correct, total_time: totalTime, score_percentage: score });
      if (user) await User.updateMyUserData({ questions_answered_count: (user.questions_answered_count || 0) + questions.length });
    } catch(e) { console.error(e); }
  }, [startTime, questions, answers, examConfig, examId, user]);

  useEffect(() => { if (examState === 'active' && timeLeft > 0) { const t = setInterval(() => setTimeLeft(p => { if (p <= 1) { submitExam(); return 0; } return p - 1; }), 1000); return () => clearInterval(t); } }, [examState, timeLeft, submitExam]);

  useEffect(() => { (async () => { setIsLoading(true); try {
    const u = await User.me(); setUser(u);
    if (u.subscription_status !== 'paid' && u.subscription_status !== 'active' && (u.questions_answered_count || 0) >= qbank.trial.freeQuestions) { setShowPaywall(true); setIsLoading(false); return; }
    let qs = await Question.list();
    if (examConfig?.categories) qs = qs.filter(q => examConfig.categories.includes(q.category));
    for (let i = qs.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [qs[i], qs[j]] = [qs[j], qs[i]]; }
    setQuestions(qs.slice(0, Math.min(examConfig?.questionCount || 50, qs.length)));
  } catch(e) { console.error(e); } setIsLoading(false); })(); }, []);

  const fmt = s => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div></div>;
  if (showPaywall) return <div className="min-h-screen p-8"><PaywallModal questionsAnswered={user?.questions_answered_count || 50} /></div>;

  if (examState === 'completed') return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto text-center">
        <Trophy className={`w-20 h-20 mx-auto mb-4 ${results.passed ? 'text-emerald-600' : 'text-amber-600'}`} />
        <h1 className="text-3xl font-bold mb-2">{examConfig?.name} Complete!</h1>
        <Card className="border-0 shadow-2xl bg-white my-8"><CardHeader className="p-8 text-center"><div className={`text-7xl font-bold mb-2 ${results.score >= 80 ? 'text-emerald-600' : results.score >= (examConfig?.passingScore||70) ? 'text-blue-600' : 'text-red-600'}`}>{results.score}%</div><CardTitle>{results.correctAnswers}/{results.totalQuestions} correct</CardTitle><Badge className={`mt-4 text-lg px-4 py-2 ${results.passed ? 'bg-emerald-500' : 'bg-amber-500'} text-white`}>{results.passed ? 'PASSED' : `Need ${examConfig?.passingScore}%`}</Badge></CardHeader></Card>
        <div className="flex justify-center gap-4"><Button variant="outline" onClick={() => navigate(createPageUrl("PracticeTests"))} className="gap-2"><RotateCcw className="w-4 h-4" />Again</Button><Button onClick={() => navigate(createPageUrl("Analytics"))} className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600">Analytics<ArrowRight className="w-4 h-4" /></Button></div>
      </div>
    </div>
  );

  const q = questions[idx];
  if (!q) return <div className="p-12 text-center text-slate-600">No questions available. Add questions to Supabase.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center gap-4 mb-6 bg-white rounded-xl p-4 shadow-lg">
          <div><h2 className="text-xl font-bold">{examConfig?.name}</h2><p className="text-sm text-slate-600">Q{idx+1}/{questions.length} · {Object.keys(answers).length} answered</p></div>
          <div className={`px-4 py-3 rounded-xl font-mono font-bold text-lg ${timeLeft < 600 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-blue-100 text-blue-700'}`}><Clock className="w-5 h-5 inline mr-2" />{fmt(timeLeft)}</div>
        </div>
        <Progress value={((idx+1)/questions.length)*100} className="h-3 mb-6" />
        <AnimatePresence mode="wait"><motion.div key={idx} initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}}>
          <Card className="border-0 shadow-xl bg-white mb-6"><CardHeader className="p-6"><Badge variant="outline" className="mb-3">Q{idx+1}</Badge><CardTitle className="text-lg leading-relaxed">{q.question_text}</CardTitle></CardHeader>
            <CardContent className="p-6 pt-0"><div className="space-y-3">{q.options.map((opt,i) => (
              <button key={i} onClick={() => setAnswers(p => ({...p,[idx]:i}))} className={`w-full p-5 text-left rounded-xl border-2 transition-all ${answers[idx]===i ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                <div className="flex items-center gap-4"><div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-semibold ${answers[idx]===i ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300'}`}>{String.fromCharCode(65+i)}</div><span className="flex-1 font-medium">{opt.text}</span>{answers[idx]===i && <CheckCircle className="w-5 h-5 text-blue-500" />}</div>
              </button>
            ))}</div></CardContent></Card>
        </motion.div></AnimatePresence>
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setIdx(p => Math.max(0,p-1))} disabled={idx===0} className="gap-2"><ArrowLeft className="w-4 h-4" />Prev</Button>
          {idx === questions.length-1 ? <Button onClick={submitExam} className="gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 h-12 px-8"><CheckCircle className="w-5 h-5" />Submit</Button>
            : <Button onClick={() => setIdx(p => Math.min(questions.length-1,p+1))} className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 h-12 px-8">Next<ArrowRight className="w-4 h-4" /></Button>}
        </div>
      </div>
    </div>
  );
}
