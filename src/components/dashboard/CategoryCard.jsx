import React from 'react';
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { qbank } from "@/configs";
export default function CategoryCard({ category, totalQuestions, completedQuestions, accuracy }) {
  const config = qbank.categories.find(c => c.value === category) || { label: category, color: "from-slate-500 to-slate-600" };
  const pct = totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0;
  return (
    <Link to={`${createPageUrl("Study")}?category=${category}`}>
      <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer">
        <CardHeader className="p-6">
          <div className="flex justify-between items-start mb-3"><div className={`w-2 h-10 rounded-full bg-gradient-to-b ${config.color}`} /><ChevronRight className="w-5 h-5 text-slate-400" /></div>
          <CardTitle className="text-base font-bold text-slate-900 mb-1">{config.label}</CardTitle>
          <Progress value={pct} className="h-2 mb-2 mt-4" />
          <div className="flex justify-between text-xs text-slate-500"><span>{completedQuestions}/{totalQuestions}</span><span>{accuracy}% accuracy</span></div>
        </CardHeader>
      </Card>
    </Link>
  );
}
