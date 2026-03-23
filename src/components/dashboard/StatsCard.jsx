import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
export default function StatsCard({ title, value, subtitle, icon: Icon, trend, trendDirection = 'up', bgGradient = "from-blue-500 to-blue-600" }) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-lg shadow-slate-200/50 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
      <div className={`absolute top-0 right-0 w-32 h-32 transform translate-x-12 -translate-y-12 bg-gradient-to-br ${bgGradient} rounded-full opacity-10`} />
      <CardHeader className="p-4 md:p-6 pb-2">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-xs md:text-sm font-semibold text-slate-600 uppercase tracking-wide">{title}</CardTitle>
            <div className="text-2xl md:text-3xl font-bold text-slate-900 mt-2 mb-1">{value}</div>
            {subtitle && <p className="text-xs md:text-sm text-slate-500">{subtitle}</p>}
          </div>
          <div className={`p-2 md:p-3 rounded-xl bg-gradient-to-br ${bgGradient} shadow-lg flex-shrink-0`}><Icon className="w-5 h-5 md:w-6 md:h-6 text-white" /></div>
        </div>
      </CardHeader>
      {trend && <CardContent className="p-4 md:p-6 pt-0"><div className="flex items-center gap-2 text-xs md:text-sm">
        {trendDirection === 'up' ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : trendDirection === 'down' ? <TrendingDown className="w-4 h-4 text-red-500" /> : <Minus className="w-4 h-4 text-slate-400" />}
        <span className={trendDirection === 'up' ? 'text-emerald-600' : trendDirection === 'down' ? 'text-red-600' : 'text-slate-600'}>{trend}</span>
      </div></CardContent>}
    </Card>
  );
}
