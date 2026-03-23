import React, { useState, useEffect } from "react";
import { StudySession, User } from "@/entities/all";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, Calendar, Clock, Target, Trash2, Search, TrendingUp, Award, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
export default function TestHistoryPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]); const [isLoading, setIsLoading] = useState(true);
  useEffect(() => { (async () => { setIsLoading(true); try { const u = await User.me(); const s = await StudySession.filter({created_by:u.email},"-created_date"); setSessions(s.map(x=>({...x,completed_at:x.created_date,total_time_seconds:x.total_time||0}))); } catch(e){} setIsLoading(false); })(); }, []);
  const del = async (s) => { try { await StudySession.delete(s.id); setSessions(p=>p.filter(x=>x.id!==s.id)); } catch(e){} };
  const sc = s => s >= 80 ? 'text-emerald-600 bg-emerald-50' : s >= 70 ? 'text-blue-600 bg-blue-50' : s >= 60 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50';
  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div></div>;
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 md:p-8"><div className="max-w-7xl mx-auto">
      <div className="mb-8"><div className="flex items-center gap-3 mb-2"><History className="w-8 h-8 text-blue-600"/><h1 className="text-3xl font-bold">Test History</h1></div></div>
      {sessions.length === 0 ? <Card className="border-0 shadow-lg bg-white"><CardContent className="p-12 text-center"><History className="w-16 h-16 text-slate-300 mx-auto mb-4"/><h3 className="text-xl font-semibold mb-2">No Tests Yet</h3><Button onClick={()=>navigate(createPageUrl("PracticeTests"))}>Take a Practice Test</Button></CardContent></Card>
      : <div className="space-y-4">{sessions.map(s=>(
        <Card key={s.id} className="border-0 shadow-lg bg-white"><CardContent className="p-4 md:p-6"><div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div><div className="flex flex-wrap items-center gap-2 mb-2"><Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">{s.session_type}</Badge><Badge variant="outline">{s.total_questions} Q</Badge><span className="text-sm text-slate-600 flex items-center gap-1"><Calendar className="w-4 h-4"/>{format(new Date(s.completed_at),"MMM d, yyyy h:mm a")}</span></div>
            <div className="flex items-center gap-4 text-sm text-slate-600"><span className="flex items-center gap-1"><Clock className="w-4 h-4"/>{Math.floor(s.total_time_seconds/60)}m</span><span className="flex items-center gap-1"><Target className="w-4 h-4"/>{s.correct_answers}/{s.total_questions}</span></div></div>
          <div className="flex items-center gap-3"><div className={`text-center px-4 py-2 rounded-lg ${sc(s.score_percentage)}`}><div className="text-2xl font-bold">{s.score_percentage}%</div></div>
            <AlertDialog><AlertDialogTrigger asChild><Button variant="outline" size="icon" className="text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4"/></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete?</AlertDialogTitle><AlertDialogDescription>Permanently delete this test.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={()=>del(s)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
          </div></div></CardContent></Card>
      ))}</div>}
    </div></div>
  );
}
