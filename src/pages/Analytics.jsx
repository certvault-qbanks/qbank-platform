import React, { useState, useEffect } from "react";
import { StudySession, UserProgress, Question, User } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Target, Clock, Brain, Award } from "lucide-react";
export default function AnalyticsPage() {
  const [sessions, setSessions] = useState([]); const [progress, setProgress] = useState([]); const [questions, setQuestions] = useState([]); const [isLoading, setIsLoading] = useState(true);
  useEffect(() => { (async () => { setIsLoading(true); try { const u = await User.me(); const [s,p,q] = await Promise.all([StudySession.filter({created_by:u.email},"-created_date"),UserProgress.filter({created_by:u.email},"-created_date"),Question.list()]); setSessions(s); setProgress(p); setQuestions(q); } catch(e){} setIsLoading(false); })(); }, []);
  const ans = progress.length, correct = progress.filter(p=>p.is_correct).length;
  const acc = ans > 0 ? Math.round((correct/ans)*100) : 0;
  const avgScore = sessions.length > 0 ? Math.round(sessions.reduce((s,x)=>s+x.score_percentage,0)/sessions.length) : 0;
  const trend = [...sessions].sort((a,b)=>new Date(a.created_date)-new Date(b.created_date)).slice(-10).map((s,i)=>({session:`S${i+1}`,score:s.score_percentage}));
  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div></div>;
  return (
    <div className="p-4 md:p-8 min-h-screen"><div className="max-w-7xl mx-auto">
      <div className="mb-8"><h1 className="text-3xl font-bold mb-2">Performance Analytics</h1><p className="text-lg text-slate-600">Track your progress</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[{icon:Brain,l:"Answered",v:ans,c:"blue"},{icon:Target,l:"Accuracy",v:`${acc}%`,c:"emerald"},{icon:Award,l:"Avg Score",v:`${avgScore}%`,c:"purple"},{icon:TrendingUp,l:"Sessions",v:sessions.length,c:"amber"}].map(({icon:I,l,v,c})=>(
          <Card key={l} className="border-0 shadow-lg bg-white/80"><CardHeader className="p-4"><div className="flex items-center gap-3"><div className={`p-2 rounded-lg bg-${c}-100`}><I className={`w-5 h-5 text-${c}-600`}/></div><div><p className="text-sm text-slate-600">{l}</p><p className="text-2xl font-bold">{v}</p></div></div></CardHeader></Card>
        ))}
      </div>
      <Card className="border-0 shadow-lg bg-white/80"><CardHeader><CardTitle>Performance Trend</CardTitle></CardHeader><CardContent>
        {trend.length > 0 ? <ResponsiveContainer width="100%" height={400}><LineChart data={trend}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="session"/><YAxis domain={[0,100]}/><Tooltip/><Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} dot={{fill:'#3b82f6',r:6}}/></LineChart></ResponsiveContainer>
          : <div className="text-center py-12 text-slate-500">Complete study sessions to see trends.</div>}
      </CardContent></Card>
    </div></div>
  );
}
