import React, { useState, useEffect } from "react";
import { StudySession, SessionAnswer, Question } from "@/entities/all";
import { qbank } from "@/configs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Clock, CheckCircle, XCircle, BookOpen, ChevronRight,
  Brain, Timer, Zap, BarChart3, History, Calendar
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

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
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
}

function formatDuration(seconds) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export default function TestHistory() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const data = await StudySession.list("-created_date");
        setSessions(data);
      } catch (e) { console.error(e); }
      setIsLoading(false);
    })();
  }, []);

  const modeIcons = {
    study: Brain,
    exam: Timer,
    timed_tutor: Zap,
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 md:p-10">
        <div className="text-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-500">Loading session history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg">
          <History className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Test History</h1>
          <p className="text-sm text-slate-500">{sessions.length} completed {sessions.length === 1 ? 'session' : 'sessions'}</p>
        </div>
      </div>

      {/* Stats Summary */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            {
              label: "Total Sessions",
              value: sessions.length,
              icon: BookOpen,
              color: "text-blue-600 bg-blue-50",
            },
            {
              label: "Questions Answered",
              value: sessions.reduce((sum, s) => sum + (s.total_questions || 0), 0),
              icon: CheckCircle,
              color: "text-emerald-600 bg-emerald-50",
            },
            {
              label: "Avg Score",
              value: `${Math.round(sessions.reduce((sum, s) => sum + (s.score_percentage || 0), 0) / sessions.length)}%`,
              icon: BarChart3,
              color: "text-purple-600 bg-purple-50",
            },
            {
              label: "Total Time",
              value: formatDuration(sessions.reduce((sum, s) => sum + (s.total_time || 0), 0)),
              icon: Clock,
              color: "text-amber-600 bg-amber-50",
            },
          ].map((stat, i) => (
            <Card key={i} className="border-0 shadow-sm bg-white">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.color}`}><stat.icon className="w-4 h-4" /></div>
                <div>
                  <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                  <p className="text-[11px] text-slate-500">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Session List */}
      {sessions.length === 0 ? (
        <Card className="border-0 shadow-lg bg-white">
          <CardContent className="py-16 text-center">
            <History className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No sessions yet</h3>
            <p className="text-sm text-slate-500 mb-6">Complete a study block or practice test to see your history here.</p>
            <Button onClick={() => navigate(createPageUrl("Study"))} className="bg-gradient-to-r from-blue-600 to-blue-700 gap-2">
              <BookOpen className="w-4 h-4" />Start Studying
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const score = session.score_percentage || 0;
            const Icon = modeIcons[session.session_type] || Brain;
            const catLabel = session.category === 'all'
              ? 'All Categories'
              : qbank.categories.find(c => c.value === session.category)?.label || session.category || 'Mixed';

            return (
              <Card
                key={session.id}
                className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => navigate(`${createPageUrl("TestReview")}?session_id=${session.id}`)}
              >
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-center gap-4">
                    {/* Score circle */}
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${
                      score >= 80 ? 'bg-emerald-100' : score >= 60 ? 'bg-amber-100' : 'bg-red-100'
                    }`}>
                      <span className={`text-lg font-bold ${
                        score >= 80 ? 'text-emerald-700' : score >= 60 ? 'text-amber-700' : 'text-red-700'
                      }`}>{score}%</span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Icon className="w-3 h-3" />
                          {session.session_type === 'study' ? 'Study' : session.session_type === 'exam' ? 'Timed' : session.session_type}
                        </Badge>
                        <Badge className="bg-slate-100 text-slate-700 border-0 text-xs">{catLabel}</Badge>
                        {session.difficulty_filter && session.difficulty_filter !== 'all' && (
                          <Badge className="bg-slate-100 text-slate-600 border-0 text-xs capitalize">{session.difficulty_filter}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          {session.correct_answers}/{session.total_questions}
                        </span>
                        {session.total_time > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDuration(session.total_time)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(session.created_date)}
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-slate-400 hidden sm:inline group-hover:text-blue-600 transition-colors">Review</span>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
