import React, { useState, useEffect } from "react";
import { User, Question } from "@/entities/all";
import { qbank } from "@/configs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, CheckCircle, TrendingUp, Award, AlertCircle, ArrowRight, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PracticeTests() {
  const [user, setUser] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => { (async () => { setIsLoading(true); try { const [u, q] = await Promise.all([User.me(), Question.list()]); setUser(u); setQuestions(q); } catch(e) {} setIsLoading(false); })(); }, []);

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div></div>;
  const trialEnded = user?.subscription_status !== 'paid' && user?.subscription_status !== 'active' && (user?.questions_answered_count || 0) >= qbank.trial.freeQuestions;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8"><h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Certification Practice Tests</h1><p className="text-lg text-slate-600">{qbank.description}</p></div>
        {trialEnded && <Card className="mb-8 border-2 border-red-200 bg-gradient-to-r from-red-50 to-orange-50"><CardContent className="p-6 flex items-center justify-between gap-4"><div className="flex items-center gap-3"><AlertCircle className="w-6 h-6 text-red-600" /><div><h3 className="font-semibold">Free Trial Ended</h3><p className="text-sm text-slate-600">Upgrade to continue!</p></div></div><Link to={createPageUrl("Upgrade")}><Button className="bg-red-600 hover:bg-red-700">Upgrade</Button></Link></CardContent></Card>}
        <div className="grid lg:grid-cols-2 gap-8">
          {qbank.exams.map(exam => {
            const available = questions.filter(q => exam.categories.includes(q.category)).length;
            return (
              <Card key={exam.id} className="border-0 shadow-xl bg-white overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${exam.color}`} />
                <CardHeader className="p-6 md:p-8">
                  <div className="flex items-start justify-between mb-4"><div className={`p-4 rounded-2xl bg-gradient-to-br ${exam.color} shadow-lg`}><Award className="w-8 h-8 text-white" /></div><Badge className={`bg-gradient-to-r ${exam.color} text-white border-0`}>Official Sim</Badge></div>
                  <CardTitle className="text-2xl font-bold mb-2">{exam.name}</CardTitle><p className="text-sm text-slate-500 mb-3">{exam.fullName}</p><p className="text-slate-700">{exam.description}</p>
                </CardHeader>
                <CardContent className="p-6 md:p-8 pt-0">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-50 rounded-lg p-4"><div className="flex items-center gap-2 text-slate-600 mb-1"><FileText className="w-4 h-4" /><span className="text-xs font-semibold uppercase">Questions</span></div><div className="text-2xl font-bold">{exam.questionCount}</div></div>
                    <div className="bg-slate-50 rounded-lg p-4"><div className="flex items-center gap-2 text-slate-600 mb-1"><Clock className="w-4 h-4" /><span className="text-xs font-semibold uppercase">Time</span></div><div className="text-2xl font-bold">{Math.floor(exam.timeLimit/60)}h {exam.timeLimit%60}m</div></div>
                    <div className="bg-slate-50 rounded-lg p-4"><div className="flex items-center gap-2 text-slate-600 mb-1"><TrendingUp className="w-4 h-4" /><span className="text-xs font-semibold uppercase">Passing</span></div><div className="text-2xl font-bold">{exam.passingScore}%</div></div>
                    <div className="bg-slate-50 rounded-lg p-4"><div className="flex items-center gap-2 text-slate-600 mb-1"><BookOpen className="w-4 h-4" /><span className="text-xs font-semibold uppercase">Available</span></div><div className="text-2xl font-bold">{available}</div></div>
                  </div>
                  {exam.features && <div className="mb-6"><h4 className="font-semibold mb-3 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-600" />Included</h4><ul className="space-y-2">{exam.features.map((f,i) => <li key={i} className="flex items-center gap-2 text-sm text-slate-700"><div className="w-1.5 h-1.5 rounded-full bg-blue-600" />{f}</li>)}</ul></div>}
                  <Link to={trialEnded ? createPageUrl("Upgrade") : `${createPageUrl("ExamSimulation")}?exam=${exam.id}`}><Button className={`w-full h-12 bg-gradient-to-r ${exam.color} hover:opacity-90 text-lg font-semibold shadow-lg`}>{trialEnded ? "Upgrade to Unlock" : <>Start {exam.name}<ArrowRight className="w-5 h-5 ml-2" /></>}</Button></Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
