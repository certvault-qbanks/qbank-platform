import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
export default function RecentActivity({ sessions = [] }) {
  return (
    <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
      <CardHeader className="p-6 border-b border-slate-100"><CardTitle className="flex items-center gap-2 text-lg font-bold"><Clock className="w-5 h-5 text-blue-600" />Recent Sessions</CardTitle></CardHeader>
      <CardContent className="p-6">
        {sessions.length > 0 ? <div className="space-y-4">{sessions.map(s => (
          <div key={s.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
            <div className="flex items-center gap-4">
              {s.score_percentage >= 80 ? <CheckCircle className="w-6 h-6 text-emerald-500" /> : <XCircle className="w-6 h-6 text-red-400" />}
              <div><div className="flex items-center gap-2 mb-1"><Badge className={s.session_type === 'study' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>{s.session_type}</Badge><span className="text-sm font-medium capitalize">{s.category?.replace(/_/g, ' ') || 'Mixed'}</span></div>
                <div className="text-xs text-slate-500">{format(new Date(s.created_date), "MMM d, yyyy 'at' h:mm a")}</div></div>
            </div>
            <div className="text-right"><div className={`text-lg font-bold ${s.score_percentage >= 80 ? 'text-emerald-600' : s.score_percentage >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{s.score_percentage}%</div><div className="text-xs text-slate-500">{s.correct_answers}/{s.total_questions}</div></div>
          </div>
        ))}</div> : <div className="text-center py-8 text-slate-500"><Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" /><p>No sessions yet. Start practicing!</p></div>}
      </CardContent>
    </Card>
  );
}
