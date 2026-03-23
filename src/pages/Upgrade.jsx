import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowLeft, Shield, Zap, Clock, TrendingUp, Award, BookOpen, Target, Users, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { User } from "@/entities/all";
import { qbank } from "@/configs";

export default function UpgradePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  useEffect(() => { User.me().then(setUser).catch(() => {}); }, []);
  const qa = user?.questions_answered_count || 0;
  const trialPct = Math.min(100, (qa / qbank.trial.freeQuestions) * 100);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-1 bg-gradient-to-r from-slate-800 via-blue-700 to-slate-800" />
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <Button variant="ghost" onClick={() => navigate(createPageUrl("Dashboard"))} className="mb-8 text-slate-500"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        <div className="text-center mb-10">
          <Badge className="mb-4 bg-slate-100 text-slate-700 border border-slate-200 px-4 py-1.5 text-sm hover:bg-slate-100"><Users className="w-3.5 h-3.5 mr-2" />Trusted by professionals</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3 tracking-tight">Pass Your Certification</h1>
          <p className="text-lg text-slate-500 max-w-lg mx-auto">{qbank.description}</p>
        </div>

        {user?.subscription_status === "trial" && (
          <Card className="mb-8 border border-amber-200 bg-amber-50/60"><CardContent className="p-5 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3"><Clock className="w-5 h-5 text-amber-600" /><div><p className="font-semibold text-sm">Free Trial</p><p className="text-sm text-slate-600">{Math.max(0, qbank.trial.freeQuestions - qa)} questions left</p></div></div>
            <div className="flex items-center gap-3"><div className="w-32 h-2 rounded-full bg-amber-200 overflow-hidden"><div className="h-full rounded-full bg-amber-500" style={{width:`${trialPct}%`}} /></div><span className="text-sm font-semibold tabular-nums">{qa}/{qbank.trial.freeQuestions}</span></div>
          </CardContent></Card>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {qbank.plans.map((plan, i) => (
            <motion.div key={plan.id} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1+i*0.08}} className="relative">
              {plan.highlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10"><Badge className="bg-blue-600 text-white border-0 px-3 py-1 text-xs font-semibold shadow"><Star className="w-3 h-3 mr-1" />{plan.badge}</Badge></div>}
              <Card className={`h-full flex flex-col overflow-hidden border-0 shadow-lg ${plan.highlight ? "ring-2 ring-blue-500" : ""}`}>
                <div className={`bg-gradient-to-r ${plan.color} p-6 text-white`}><p className="text-white/70 text-sm">{plan.label}</p><div className="text-4xl font-bold">${plan.price}</div><p className="text-white/70 text-sm mt-1">for {plan.period}</p></div>
                <CardContent className="p-6 flex flex-col flex-1"><p className="text-sm text-slate-500 mb-5">{plan.description}</p>
                  <ul className="space-y-2.5 mb-6 flex-1">{["Full question bank", "Practice tests", "Analytics", "Progress tracking"].map(p => <li key={p} className="flex items-start gap-2 text-sm text-slate-700"><CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />{p}</li>)}</ul>
                  <Button onClick={() => window.open(qbank.stripe[plan.id], '_blank')} className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 text-white font-semibold`}><Zap className="w-4 h-4 mr-2" />Get {plan.label}</Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card className="border border-emerald-200 bg-emerald-50/50 mb-8"><CardContent className="p-5 flex items-start gap-3"><Shield className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" /><div><p className="font-semibold text-sm mb-1">Pass or Money Back</p><p className="text-sm text-slate-600">If you don't pass your certification exam, we'll refund every penny.</p></div></CardContent></Card>
        <div className="text-center border-t border-slate-100 pt-8 pb-4"><p className="text-slate-400 text-sm">Questions? <a href={`mailto:${qbank.supportEmail}`} className="text-blue-600 underline">{qbank.supportEmail}</a></p></div>
      </div>
    </div>
  );
}
