import React, { useState, useEffect } from "react";
import { StudySession, UserProgress, Question, User } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { qbank } from "@/configs";
import { Clock, Target, Award, TrendingUp, Brain, Zap, ArrowRight, PlayCircle } from "lucide-react";
import StatsCard from "../components/dashboard/StatsCard";
import CategoryCard from "../components/dashboard/CategoryCard";
import RecentActivity from "../components/dashboard/RecentActivity";

export default function Dashboard() {
  const [sessions, setSessions] = useState([]);
  const [progress, setProgress] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => { loadData(); }, []);
  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      const [s, p, q] = await Promise.all([
        StudySession.filter({ created_by: currentUser.email }, "-created_date", 5),
        UserProgress.filter({ created_by: currentUser.email }, "-created_date"),
        Question.list()
      ]);
      setSessions(s); setProgress(p); setQuestions(q);
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  const stats = (() => {
    const ans = progress.length, correct = progress.filter(p => p.is_correct).length;
    return {
      totalQuestions: questions.length, answeredQuestions: ans,
      overallAccuracy: ans > 0 ? Math.round((correct / ans) * 100) : 0,
      recentSessions: sessions.length,
      averageScore: sessions.length > 0 ? Math.round(sessions.reduce((s, x) => s + x.score_percentage, 0) / sessions.length) : 0,
    };
  })();

  const categoryStats = qbank.categories.slice(0, 6).map(cat => {
    const cq = questions.filter(q => q.category === cat.value);
    const cp = progress.filter(p => { const q = questions.find(x => x.id === p.question_id); return q?.category === cat.value; });
    const correct = cp.filter(p => p.is_correct).length;
    return { category: cat.value, totalQuestions: cq.length, completedQuestions: cp.length, accuracy: cp.length > 0 ? Math.round((correct / cp.length) * 100) : 0 };
  });

  const isNewUser = (user?.questions_answered_count || 0) === 0 && sessions.length === 0;

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div></div>;

  return (
    <div className="p-4 md:p-6 lg:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
            {isNewUser ? `Welcome to ${qbank.fullName}` : `Welcome back`}{user ? `, ${user.full_name?.split(' ')[0] || 'Student'}` : ''}!
          </h1>
          <p className="text-base md:text-lg text-slate-600">{isNewUser ? "Let's start your certification journey" : "Continue your path to certification success"}</p>
        </div>

        {isNewUser && (
          <Card className="mb-8 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 shadow-lg">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0"><PlayCircle className="w-8 h-8 text-white" /></div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">Start Your Free Trial</h3>
                  <p className="text-slate-700 mb-4"><strong>{qbank.trial.freeQuestions} free questions</strong> with instant feedback and detailed explanations.</p>
                  <Link to={createPageUrl("Study")}><Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg"><PlayCircle className="w-5 h-5 mr-2" />Start First Question</Button></Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link to={createPageUrl("Study")}><Card className="border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-blue-500 to-blue-600 text-white h-full"><CardContent className="p-6"><div className="flex justify-between mb-4"><Brain className="w-10 h-10" /><ArrowRight className="w-5 h-5 opacity-70" /></div><h3 className="text-xl font-bold mb-2">Study Mode</h3><p className="text-sm text-white/90">Practice with instant feedback</p></CardContent></Card></Link>
          <Link to={createPageUrl("PracticeTests")}><Card className="border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-purple-500 to-purple-600 text-white h-full"><CardContent className="p-6"><div className="flex justify-between mb-4"><Clock className="w-10 h-10" /><ArrowRight className="w-5 h-5 opacity-70" /></div><h3 className="text-xl font-bold mb-2">Practice Tests</h3><p className="text-sm text-white/90">Full exam simulations</p></CardContent></Card></Link>
          <Link to={createPageUrl("Analytics")}><Card className="border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-emerald-500 to-emerald-600 text-white h-full"><CardContent className="p-6"><div className="flex justify-between mb-4"><TrendingUp className="w-10 h-10" /><ArrowRight className="w-5 h-5 opacity-70" /></div><h3 className="text-xl font-bold mb-2">Your Progress</h3><p className="text-sm text-white/90">Track performance</p></CardContent></Card></Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <StatsCard title="Answered" value={stats.answeredQuestions} subtitle={`of ${stats.totalQuestions}`} icon={Brain} trend={stats.answeredQuestions > 0 ? "Keep going!" : "Start studying"} bgGradient="from-blue-500 to-blue-600" />
          <StatsCard title="Accuracy" value={`${stats.overallAccuracy}%`} subtitle="All-time" icon={Target} trend={stats.overallAccuracy >= 80 ? "Excellent!" : "Keep practicing"} trendDirection={stats.overallAccuracy >= 80 ? 'up' : 'neutral'} bgGradient="from-emerald-500 to-emerald-600" />
          <StatsCard title="Sessions" value={stats.recentSessions} subtitle="Completed" icon={Zap} trend="Stay consistent" bgGradient="from-purple-500 to-purple-600" />
          <StatsCard title="Avg Score" value={`${stats.averageScore}%`} subtitle="Tests" icon={Award} trend={stats.averageScore >= 75 ? "Great!" : "Take a test"} trendDirection={stats.averageScore >= 75 ? 'up' : 'neutral'} bgGradient="from-amber-500 to-amber-600" />
        </div>

        {!isNewUser && (
          <div className="mb-8">
            <div className="flex justify-between mb-4"><h2 className="text-xl font-bold">Study by Category</h2><Link to={createPageUrl("Study")}><Button variant="outline" size="sm" className="gap-2">Browse All<ArrowRight className="w-4 h-4" /></Button></Link></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{categoryStats.map(c => <CategoryCard key={c.category} {...c} />)}</div>
          </div>
        )}
        {!isNewUser && <RecentActivity sessions={sessions} />}
      </div>
    </div>
  );
}
