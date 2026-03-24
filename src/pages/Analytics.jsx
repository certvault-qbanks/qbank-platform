import React, { useState, useEffect } from "react";
import { StudySession, UserProgress, Question, User } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { qbank } from "@/configs";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import {
  TrendingUp, Target, Clock, Brain, Award, BookOpen, Zap,
  ArrowRight, CheckCircle, XCircle, AlertTriangle, BarChart3,
  ChevronUp, ChevronDown, Minus
} from "lucide-react";
import { motion } from "framer-motion";

export default function AnalyticsPage() {
  const [sessions, setSessions] = useState([]);
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
        setUser(u); setSessions(s); setProgress(p); setQuestions(q);
      } catch (e) { console.error(e); }
      setIsLoading(false);
    })();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
      </div>
    );
  }

  // ─── Core Stats ──────────────────────────────────────
  const totalAnswered = progress.length;
  const correctCount = progress.filter(p => p.is_correct).length;
  const uniqueAnswered = new Set(progress.map(p => p.question_id)).size;
  const overallAccuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
  const avgScore = sessions.length > 0 ? Math.round(sessions.reduce((s, x) => s + (x.score_percentage || 0), 0) / sessions.length) : 0;
  const totalTime = sessions.reduce((s, x) => s + (x.total_time || 0), 0);
  const avgTimePerQ = totalAnswered > 0 ? Math.round(progress.reduce((s, p) => s + (p.time_spent || 0), 0) / totalAnswered) : 0;

  // ─── Score Trend (last 20 sessions) ──────────────────
  const trendData = [...sessions]
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
    .slice(-20)
    .map((s, i) => ({
      label: new Date(s.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      score: s.score_percentage || 0,
      type: s.session_type,
    }));

  // Moving average (3-session window)
  const movingAvg = trendData.map((d, i) => {
    const window = trendData.slice(Math.max(0, i - 2), i + 1);
    return { ...d, avg: Math.round(window.reduce((s, x) => s + x.score, 0) / window.length) };
  });

  // ─── Domain Analysis ─────────────────────────────────
  const domainStats = qbank.categories.map(cat => {
    const catQuestions = questions.filter(q => q.category === cat.value);
    const catProgress = progress.filter(p => {
      const q = questions.find(x => x.id === p.question_id);
      return q?.category === cat.value;
    });
    const catCorrect = catProgress.filter(p => p.is_correct).length;
    const catUnique = new Set(catProgress.map(p => p.question_id)).size;
    const accuracy = catProgress.length > 0 ? Math.round((catCorrect / catProgress.length) * 100) : null;

    return {
      ...cat,
      total: catQuestions.length,
      attempted: catUnique,
      correct: catCorrect,
      totalAttempts: catProgress.length,
      accuracy,
      completion: catQuestions.length > 0 ? Math.round((catUnique / catQuestions.length) * 100) : 0,
    };
  });

  // Sort by accuracy for strengths/weaknesses
  const attempted = domainStats.filter(d => d.accuracy !== null);
  const strengths = [...attempted].sort((a, b) => b.accuracy - a.accuracy).slice(0, 3);
  const weaknesses = [...attempted].sort((a, b) => a.accuracy - b.accuracy).slice(0, 3);

  // Domain chart data
  const domainChartData = domainStats.map(d => ({
    name: d.label.length > 20 ? d.label.substring(0, 18) + '...' : d.label,
    fullName: d.label,
    accuracy: d.accuracy || 0,
    attempted: d.totalAttempts,
  }));

  // ─── Difficulty Breakdown ────────────────────────────
  const diffStats = ['basic', 'intermediate', 'advanced'].map(diff => {
    const diffProgress = progress.filter(p => {
      const q = questions.find(x => x.id === p.question_id);
      return q?.difficulty === diff;
    });
    const correct = diffProgress.filter(p => p.is_correct).length;
    return {
      label: diff.charAt(0).toUpperCase() + diff.slice(1),
      total: diffProgress.length,
      correct,
      accuracy: diffProgress.length > 0 ? Math.round((correct / diffProgress.length) * 100) : null,
    };
  });

  // ─── Recent Improvement ──────────────────────────────
  const recentSessions = sessions.slice(0, 5);
  const olderSessions = sessions.slice(5, 10);
  const recentAvg = recentSessions.length > 0 ? Math.round(recentSessions.reduce((s, x) => s + (x.score_percentage || 0), 0) / recentSessions.length) : null;
  const olderAvg = olderSessions.length > 0 ? Math.round(olderSessions.reduce((s, x) => s + (x.score_percentage || 0), 0) / olderSessions.length) : null;
  const improvement = recentAvg !== null && olderAvg !== null ? recentAvg - olderAvg : null;

  // ─── Empty State ─────────────────────────────────────
  if (totalAnswered === 0) {
    return (
      <div className="p-4 md:p-8 min-h-screen">
        <div className="max-w-2xl mx-auto text-center py-20">
          <BarChart3 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">No Data Yet</h1>
          <p className="text-slate-500 mb-6">Complete some study sessions to see your performance analytics here.</p>
          <Link to={createPageUrl("Study")}>
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 gap-2"><BookOpen className="w-4 h-4" />Start Studying</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">Performance Analytics</h1>
          <p className="text-slate-500">
            {uniqueAnswered} questions attempted · {sessions.length} sessions · {overallAccuracy}% overall accuracy
          </p>
        </div>

        {/* ─── Top Stats ───────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
          {[
            { label: "Accuracy", value: `${overallAccuracy}%`, sub: `${correctCount}/${totalAnswered}`, icon: Target, color: overallAccuracy >= 80 ? 'emerald' : overallAccuracy >= 60 ? 'amber' : 'red' },
            { label: "Avg Score", value: `${avgScore}%`, sub: `${sessions.length} sessions`, icon: Award, color: avgScore >= 80 ? 'emerald' : avgScore >= 60 ? 'amber' : 'blue' },
            { label: "Completion", value: `${Math.round((uniqueAnswered / questions.length) * 100)}%`, sub: `${uniqueAnswered}/${questions.length}`, icon: BookOpen, color: 'blue' },
            { label: "Avg Time/Q", value: `${avgTimePerQ}s`, sub: "per question", icon: Clock, color: 'purple' },
            { label: "Trend", value: improvement !== null ? `${improvement >= 0 ? '+' : ''}${improvement}%` : '—', sub: improvement !== null ? "vs previous" : "Need more data", icon: TrendingUp, color: improvement > 0 ? 'emerald' : improvement < 0 ? 'red' : 'slate' },
          ].map((stat, i) => (
            <Card key={i} className="border-0 shadow-sm bg-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className={`w-4 h-4 text-${stat.color}-600`} />
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{stat.label}</span>
                </div>
                <p className={`text-xl font-bold text-${stat.color}-600`}>{stat.value}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{stat.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* ─── Score Trend Chart ───────────────────────── */}
          <Card className="border-0 shadow-lg bg-white lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />Score Trend
                {improvement !== null && (
                  <Badge className={`ml-2 ${improvement > 0 ? 'bg-emerald-100 text-emerald-700' : improvement < 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'} border-0 gap-1`}>
                    {improvement > 0 ? <ChevronUp className="w-3 h-3" /> : improvement < 0 ? <ChevronDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    {improvement > 0 ? '+' : ''}{improvement}% vs earlier
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {movingAvg.length >= 2 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={movingAvg}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 13 }}
                      formatter={(value, name) => [
                        `${value}%`,
                        name === 'score' ? 'Score' : '3-Session Avg'
                      ]}
                    />
                    <Line type="monotone" dataKey="score" stroke="#93c5fd" strokeWidth={2} dot={{ fill: '#93c5fd', r: 3 }} name="score" />
                    <Line type="monotone" dataKey="avg" stroke="#2563eb" strokeWidth={3} dot={false} strokeDasharray="0" name="avg" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-slate-400 text-sm">Complete more sessions to see trends.</div>
              )}
            </CardContent>
          </Card>

          {/* ─── Strengths & Weaknesses ──────────────────── */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Target className="w-4 h-4 text-emerald-600" />Strengths & Weaknesses</CardTitle>
            </CardHeader>
            <CardContent>
              {attempted.length > 0 ? (
                <div className="space-y-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-2">Strongest Domains</p>
                    <div className="space-y-2">
                      {strengths.map(d => (
                        <div key={d.value} className="flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          <span className="text-xs text-slate-700 flex-1 truncate">{d.label}</span>
                          <span className="text-xs font-bold text-emerald-600">{d.accuracy}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-red-600 mb-2">Needs Improvement</p>
                    <div className="space-y-2">
                      {weaknesses.map(d => (
                        <Link key={d.value} to={`${createPageUrl("Study")}?category=${d.value}`} className="flex items-center gap-2 hover:bg-slate-50 rounded-lg p-1 -mx-1 transition-colors">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                          <span className="text-xs text-slate-700 flex-1 truncate">{d.label}</span>
                          <span className="text-xs font-bold text-red-600">{d.accuracy}%</span>
                          <ArrowRight className="w-3 h-3 text-slate-300" />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm">Answer questions to see analysis.</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ─── Domain Performance ───────────────────────── */}
        <Card className="border-0 shadow-lg bg-white mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-blue-600" />Accuracy by Domain</CardTitle>
          </CardHeader>
          <CardContent>
            {domainChartData.some(d => d.attempted > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={domainChartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 13 }}
                    formatter={(value, name, props) => [`${value}%`, `Accuracy (${props.payload.attempted} attempts)`]}
                  />
                  <Bar dataKey="accuracy" radius={[0, 6, 6, 0]} maxBarSize={28}>
                    {domainChartData.map((d, i) => (
                      <Cell key={i} fill={d.accuracy >= 80 ? '#10b981' : d.accuracy >= 60 ? '#f59e0b' : d.attempted > 0 ? '#ef4444' : '#e2e8f0'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-slate-400 text-sm">Answer questions to see domain breakdown.</div>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* ─── Domain Detail Table ─────────────────────── */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Domain Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {domainStats.map(d => (
                  <Link key={d.value} to={`${createPageUrl("Study")}?category=${d.value}`}>
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                      <div className={`w-1.5 h-8 rounded-full bg-gradient-to-b ${d.color} flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-semibold text-slate-800 truncate">{d.label}</span>
                          <span className={`text-xs font-bold ${d.accuracy !== null ? (d.accuracy >= 80 ? 'text-emerald-600' : d.accuracy >= 60 ? 'text-amber-600' : 'text-red-600') : 'text-slate-400'}`}>
                            {d.accuracy !== null ? `${d.accuracy}%` : '—'}
                          </span>
                        </div>
                        <Progress value={d.completion} className="h-1" />
                        <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                          <span>{d.attempted}/{d.total} seen</span>
                          {d.totalAttempts > 0 && <span>{d.correct}/{d.totalAttempts} correct</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ─── Difficulty Breakdown ────────────────────── */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Performance by Difficulty</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {diffStats.map(d => (
                  <div key={d.label}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={`border-0 text-[10px] ${
                          d.label === 'Basic' ? 'bg-emerald-100 text-emerald-700' :
                          d.label === 'Advanced' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>{d.label}</Badge>
                        <span className="text-xs text-slate-500">{d.total} attempts</span>
                      </div>
                      <span className={`text-sm font-bold ${d.accuracy !== null ? (d.accuracy >= 80 ? 'text-emerald-600' : d.accuracy >= 60 ? 'text-amber-600' : 'text-red-600') : 'text-slate-400'}`}>
                        {d.accuracy !== null ? `${d.accuracy}%` : '—'}
                      </span>
                    </div>
                    <Progress value={d.accuracy || 0} className="h-2.5" />
                    {d.total > 0 && (
                      <p className="text-[10px] text-slate-400 mt-1">{d.correct}/{d.total} correct</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Exam Readiness */}
              <div className="mt-8 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-2">Exam Readiness</p>
                <div className="flex items-center gap-3">
                  <div className={`text-3xl font-bold ${overallAccuracy >= 75 ? 'text-emerald-600' : overallAccuracy >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                    {overallAccuracy}%
                  </div>
                  <div className="text-xs text-slate-600">
                    {overallAccuracy >= 80
                      ? "You're performing above the typical passing threshold. Keep it up!"
                      : overallAccuracy >= 70
                        ? "You're close to the passing range. Focus on your weak domains."
                        : overallAccuracy >= 60
                          ? "Getting there. Prioritize your lowest-scoring domains."
                          : totalAnswered < 20
                            ? "Keep answering questions to get a reliable assessment."
                            : "Focus on fundamentals and review explanations carefully."
                    }
                  </div>
                </div>
                <div className="mt-2">
                  <Progress value={Math.min(100, Math.round(overallAccuracy / 75 * 100))} className="h-2" />
                  <p className="text-[10px] text-slate-400 mt-1">Target: 75% (CHC passing score)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
