import React, { useState, useEffect } from "react";
import { StudySession, UserProgress, Question, User } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { qbank } from "@/configs";
import {
  Clock, Target, Award, TrendingUp, Brain, Zap, ArrowRight, PlayCircle,
  BookOpen, CheckCircle, XCircle, BarChart3, Calendar, ChevronRight, Timer
} from "lucide-react";
import { motion } from "framer-motion";

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Dashboard() {
  const [sessions, setSessions] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [progress, setProgress] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const [u, s, p, q] = await Promise.all([
          User.me(),
          StudySession.list("-created_date"),
          UserProgress.list(),
          Question.list(),
        ]);
        setUser(u);
        setAllSessions(s);
        setSessions(s.slice(0, 5)); // Recent 5
        setProgress(p);
        setQuestions(q);
      } catch (e) { console.error(e); }
      setIsLoading(false);
    })();
  }, []);

  // ─── Compute Stats ───────────────────────────────────
  const totalQuestions = questions.length;
  const totalAnswered = progress.length;
  const uniqueAnswered = new Set(progress.map(p => p.question_id)).size;
  const correctCount = progress.filter(p => p.is_correct).length;
  const overallAccuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
  const completionPct = totalQuestions > 0 ? Math.round((uniqueAnswered / totalQuestions) * 100) : 0;
  const avgScore = allSessions.length > 0 ? Math.round(allSessions.reduce((s, x) => s + (x.score_percentage || 0), 0) / allSessions.length) : 0;
  const totalStudyTime = allSessions.reduce((s, x) => s + (x.total_time || 0), 0);
  const studyHours = (totalStudyTime / 3600).toFixed(1);

  const isPaid = user?.subscription_status === 'active' || user?.subscription_status === 'paid';
  const freeLimit = qbank.trial.freeQuestions || 50;
  const questionsUsed = user?.questions_answered_count || 0;
  const freeRemaining = Math.max(0, freeLimit - questionsUsed);
  const isNewUser = questionsUsed === 0 && allSessions.length === 0;

  // ─── Category Stats (all 7 domains) ──────────────────
  const categoryStats = qbank.categories.map(cat => {
    const catQuestions = questions.filter(q => q.category === cat.value);
    const catProgress = progress.filter(p => {
      const q = questions.find(x => x.id === p.question_id);
      return q?.category === cat.value;
    });
    const catCorrect = catProgress.filter(p => p.is_correct).length;
    const catUnique = new Set(catProgress.map(p => p.question_id)).size;
    return {
      ...cat,
      total: catQuestions.length,
      attempted: catUnique,
      correct: catCorrect,
      totalAttempts: catProgress.length,
      accuracy: catProgress.length > 0 ? Math.round((catCorrect / catProgress.length) * 100) : 0,
      completion: catQuestions.length > 0 ? Math.round((catUnique / catQuestions.length) * 100) : 0,
    };
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* ─── Header ──────────────────────────────────── */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">
            {isNewUser ? `Welcome to ${qbank.fullName}` : `Welcome back`}{user ? `, ${user.full_name?.split(' ')[0] || 'Student'}` : ''}!
          </h1>
          <p className="text-slate-500">
            {isNewUser ? "Let's start your certification journey." : `${uniqueAnswered} of ${totalQuestions} questions completed · ${overallAccuracy}% accuracy`}
          </p>
        </div>

        {/* ─── New User CTA ────────────────────────────── */}
        {isNewUser && (
          <Card className="mb-8 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <PlayCircle className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">Start Your Free Trial</h3>
                  <p className="text-slate-700 mb-4">
                    <strong>{freeLimit} free questions</strong> across {qbank.categories.length} exam domains with instant feedback and detailed explanations.
                  </p>
                  <Link to={createPageUrl("Study")}>
                    <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg gap-2">
                      <PlayCircle className="w-5 h-5" />Start Studying
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── Trial Banner (non-paid, non-new) ────────── */}
        {!isPaid && !isNewUser && (
          <div className={`mb-6 p-4 rounded-xl border-2 flex items-center justify-between ${freeRemaining <= 5 ? 'border-red-200 bg-red-50' : freeRemaining <= 15 ? 'border-amber-200 bg-amber-50' : 'border-blue-200 bg-blue-50'}`}>
            <div className="flex items-center gap-3">
              <Clock className={`w-5 h-5 ${freeRemaining <= 5 ? 'text-red-600' : 'text-blue-600'}`} />
              <div>
                <p className="font-semibold text-sm">Free Trial: {freeRemaining} questions remaining</p>
                <p className="text-xs text-slate-600">{questionsUsed} of {freeLimit} used</p>
              </div>
            </div>
            <Link to={createPageUrl("Upgrade")}>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs">Upgrade<ArrowRight className="w-3.5 h-3.5" /></Button>
            </Link>
          </div>
        )}

        {/* ─── Quick Actions ───────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link to={createPageUrl("Study")}>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-blue-500 to-blue-600 text-white h-full">
              <CardContent className="p-6">
                <div className="flex justify-between mb-4"><Brain className="w-10 h-10" /><ArrowRight className="w-5 h-5 opacity-70" /></div>
                <h3 className="text-xl font-bold mb-1">Study Mode</h3>
                <p className="text-sm text-white/80">Practice with instant feedback</p>
              </CardContent>
            </Card>
          </Link>
          <Link to={createPageUrl("PracticeTests")}>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-purple-500 to-purple-600 text-white h-full">
              <CardContent className="p-6">
                <div className="flex justify-between mb-4"><Timer className="w-10 h-10" /><ArrowRight className="w-5 h-5 opacity-70" /></div>
                <h3 className="text-xl font-bold mb-1">Practice Tests</h3>
                <p className="text-sm text-white/80">Timed exam simulations</p>
              </CardContent>
            </Card>
          </Link>
          <Link to={createPageUrl("TestHistory")}>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-emerald-500 to-emerald-600 text-white h-full">
              <CardContent className="p-6">
                <div className="flex justify-between mb-4"><BarChart3 className="w-10 h-10" /><ArrowRight className="w-5 h-5 opacity-70" /></div>
                <h3 className="text-xl font-bold mb-1">Test History</h3>
                <p className="text-sm text-white/80">Review past sessions</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* ─── Stats Cards ─────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-blue-50"><BookOpen className="w-5 h-5 text-blue-600" /></div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Progress</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">{uniqueAnswered}<span className="text-base text-slate-400 font-normal">/{totalQuestions}</span></p>
              <Progress value={completionPct} className="h-1.5 mt-2" />
              <p className="text-xs text-slate-500 mt-1">{completionPct}% complete</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-emerald-50"><Target className="w-5 h-5 text-emerald-600" /></div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Accuracy</p>
              </div>
              <p className={`text-2xl font-bold ${overallAccuracy >= 80 ? 'text-emerald-600' : overallAccuracy >= 60 ? 'text-amber-600' : totalAnswered === 0 ? 'text-slate-400' : 'text-red-600'}`}>
                {totalAnswered > 0 ? `${overallAccuracy}%` : '—'}
              </p>
              <p className="text-xs text-slate-500 mt-1">{correctCount} correct of {totalAnswered} answered</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-purple-50"><Zap className="w-5 h-5 text-purple-600" /></div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Sessions</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">{allSessions.length}</p>
              <p className="text-xs text-slate-500 mt-1">Avg score: {allSessions.length > 0 ? `${avgScore}%` : '—'}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-amber-50"><Clock className="w-5 h-5 text-amber-600" /></div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Study Time</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">{studyHours}<span className="text-base text-slate-400 font-normal">h</span></p>
              <p className="text-xs text-slate-500 mt-1">{allSessions.length > 0 ? `${Math.round(totalStudyTime / allSessions.length / 60)}min avg/session` : 'Start studying'}</p>
            </CardContent>
          </Card>
        </div>

        {/* ─── Domain Breakdown (all 7) ────────────────── */}
        {!isNewUser && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">Performance by Domain</h2>
              <Link to={createPageUrl("Study")}>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">Study All<ArrowRight className="w-3.5 h-3.5" /></Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categoryStats.map((cat, i) => (
                <motion.div key={cat.value} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link to={`${createPageUrl("Study")}?category=${cat.value}`}>
                    <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-all cursor-pointer group">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-1.5 h-12 rounded-full bg-gradient-to-b ${cat.color} flex-shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="text-sm font-semibold text-slate-900 truncate">{cat.label}</h3>
                              <div className="flex items-center gap-2">
                                {cat.totalAttempts > 0 && (
                                  <span className={`text-sm font-bold ${cat.accuracy >= 80 ? 'text-emerald-600' : cat.accuracy >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                                    {cat.accuracy}%
                                  </span>
                                )}
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                              </div>
                            </div>
                            <Progress value={cat.completion} className="h-1.5 mb-1" />
                            <div className="flex justify-between text-[11px] text-slate-400">
                              <span>{cat.attempted}/{cat.total} questions</span>
                              {cat.totalAttempts > 0 && <span>{cat.correct}/{cat.totalAttempts} correct</span>}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Recent Sessions ─────────────────────────── */}
        {sessions.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">Recent Sessions</h2>
              <Link to={createPageUrl("TestHistory")}>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">View All<ArrowRight className="w-3.5 h-3.5" /></Button>
              </Link>
            </div>
            <div className="space-y-2">
              {sessions.map((s) => {
                const score = s.score_percentage || 0;
                const catLabel = s.category === 'all' ? 'All Categories' : qbank.categories.find(c => c.value === s.category)?.label || s.category || 'Mixed';
                return (
                  <Link key={s.id} to={`${createPageUrl("TestReview")}?session_id=${s.id}`}>
                    <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-all cursor-pointer mb-2">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
                          score >= 80 ? 'bg-emerald-100' : score >= 60 ? 'bg-amber-100' : 'bg-red-100'
                        }`}>
                          <span className={`text-sm font-bold ${score >= 80 ? 'text-emerald-700' : score >= 60 ? 'text-amber-700' : 'text-red-700'}`}>{score}%</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <Badge variant="outline" className="text-[10px]">{s.session_type === 'study' ? 'Study' : 'Exam'}</Badge>
                            <span className="text-sm font-medium text-slate-700 truncate">{catLabel}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span>{s.correct_answers}/{s.total_questions} correct</span>
                            <span>{formatDate(s.created_date)}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
