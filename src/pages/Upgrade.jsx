import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle, ArrowLeft, Zap, Clock, TrendingUp, Award,
  BookOpen, Target, Star, X, Brain, BarChart3, Shield, Lock
} from "lucide-react";
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
  const freeLimit = qbank.trial.freeQuestions || 50;
  const remaining = Math.max(0, freeLimit - qa);
  const trialPct = Math.min(100, (qa / freeLimit) * 100);
  const trialEnded = remaining === 0;
  const isPaid = user?.subscription_status === 'active' || user?.subscription_status === 'paid';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-1 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700" />

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <Button variant="ghost" onClick={() => navigate(createPageUrl("Dashboard"))} className="mb-6 text-slate-500">
          <ArrowLeft className="w-4 h-4 mr-2" />Back
        </Button>

        {/* ─── Hero ─────────────────────────────────────── */}
        <div className="text-center mb-10">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3 tracking-tight">
              Unlock the Full Question Bank
            </h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              500+ scenario-based questions across all 7 CHC exam domains. Written to CCB exam standards with detailed explanations and regulatory references.
            </p>
          </motion.div>
        </div>

        {/* ─── Trial Status ─────────────────────────────── */}
        {!isPaid && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="mb-8">
            <Card className={`border-2 ${trialEnded ? 'border-red-200 bg-red-50/60' : 'border-amber-200 bg-amber-50/60'}`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    {trialEnded ? <Lock className="w-5 h-5 text-red-600" /> : <Clock className="w-5 h-5 text-amber-600" />}
                    <div>
                      <p className="font-semibold text-sm text-slate-900">
                        {trialEnded ? "Free Trial Ended" : "Free Trial Active"}
                      </p>
                      <p className="text-sm text-slate-600">
                        {trialEnded
                          ? `You've used all ${freeLimit} free questions. Upgrade to keep studying.`
                          : `${remaining} of ${freeLimit} free questions remaining`
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2.5 rounded-full bg-slate-200 overflow-hidden">
                      <div className={`h-full rounded-full ${trialEnded ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${trialPct}%` }} />
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-slate-700">{qa}/{freeLimit}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ─── Free vs Premium Comparison ───────────────── */}
        <Card className="border-0 shadow-lg bg-white mb-8 overflow-hidden">
          <CardContent className="p-0">
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
              {/* Free column */}
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <Badge className="bg-slate-100 text-slate-700 border-0">Free Trial</Badge>
                </div>
                <ul className="space-y-3">
                  {[
                    { text: `${freeLimit} questions`, included: true },
                    { text: "Basic study mode", included: true },
                    { text: "Instant feedback", included: true },
                    { text: "Full question bank (500+)", included: false },
                    { text: "Practice test simulations", included: false },
                    { text: "Performance analytics", included: false },
                    { text: "Domain-by-domain breakdown", included: false },
                    { text: "Progress tracking over time", included: false },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      {item.included
                        ? <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        : <X className="w-4 h-4 text-slate-300 flex-shrink-0" />
                      }
                      <span className={item.included ? "text-slate-700" : "text-slate-400"}>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Premium column */}
              <div className="p-6 md:p-8 bg-gradient-to-br from-blue-50/50 to-white">
                <div className="flex items-center gap-2 mb-4">
                  <Badge className="bg-blue-600 text-white border-0">Premium</Badge>
                  <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">Full Access</Badge>
                </div>
                <ul className="space-y-3">
                  {[
                    "500+ scenario-based questions",
                    "All 3 study modes (Tutor, Timed, Timed Tutor)",
                    "Instant feedback with explanations",
                    "CHC & CHPC practice test simulations",
                    "Detailed performance analytics",
                    "Domain-by-domain score breakdown",
                    "Track progress across all sessions",
                    "All future question updates",
                  ].map((text, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span className="text-slate-800 font-medium">{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Pricing Cards ────────────────────────────── */}
        <div className="grid md:grid-cols-3 gap-5 mb-10">
          {qbank.plans.map((plan, i) => (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.08 }} className="relative">
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-blue-600 text-white border-0 px-3 py-1 text-xs font-semibold shadow">
                    <Star className="w-3 h-3 mr-1" />{plan.badge}
                  </Badge>
                </div>
              )}
              <Card className={`h-full flex flex-col overflow-hidden border-0 shadow-lg ${plan.highlight ? "ring-2 ring-blue-500 shadow-blue-100" : ""}`}>
                <div className={`bg-gradient-to-r ${plan.color} p-6 text-white`}>
                  <p className="text-white/70 text-sm font-medium">{plan.label}</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-4xl font-bold">${plan.price}</span>
                  </div>
                  <p className="text-white/60 text-sm mt-1">for {plan.period}</p>
                </div>
                <CardContent className="p-6 flex flex-col flex-1">
                  <p className="text-sm text-slate-500 mb-5 leading-relaxed">{plan.description}</p>

                  <div className="flex-1 mb-5">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Includes</p>
                    <ul className="space-y-2">
                      {[
                        "500+ questions with explanations",
                        "All study modes & practice tests",
                        "Performance analytics & tracking",
                        ...(plan.id === '12month' ? ["All future question updates"] : []),
                      ].map((perk, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-slate-700">
                          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />{perk}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    onClick={() => window.open(qbank.stripe[plan.id], '_blank')}
                    className={`w-full h-11 bg-gradient-to-r ${plan.color} hover:opacity-90 text-white font-semibold`}
                  >
                    <Zap className="w-4 h-4 mr-2" />Get Started
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* ─── Value Props ──────────────────────────────── */}
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {[
            { icon: <BookOpen className="w-5 h-5 text-blue-600" />, title: "500+ exam-style questions", desc: "Scenario-based, matching real CCB exam difficulty" },
            { icon: <BarChart3 className="w-5 h-5 text-emerald-600" />, title: "7 CHC exam domains covered", desc: "Weighted to the official CCB exam blueprint" },
            { icon: <Brain className="w-5 h-5 text-purple-600" />, title: "3 study modes", desc: "Tutor, Timed Exam, and Timed Tutor with instant feedback" },
            { icon: <Target className="w-5 h-5 text-amber-600" />, title: "Track your weak areas", desc: "Domain-level analytics show exactly where to focus" },
          ].map((f, i) => (
            <Card key={i} className="border border-slate-100 bg-white shadow-sm">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-50 flex-shrink-0">{f.icon}</div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{f.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{f.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ─── Competitor Context ───────────────────────── */}
        <Card className="border border-slate-200 bg-white mb-8">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-slate-600 leading-relaxed">
              Major certification prep platforms charge <strong className="text-slate-900">$200–$400+</strong> for similar question banks.{" "}
              {qbank.name} gives you the same exam-standard preparation starting at{" "}
              <strong className="text-blue-700">${qbank.plans[0]?.price}</strong> — a fraction of the cost.
            </p>
          </CardContent>
        </Card>

        {/* ─── Secure Payment ───────────────────────────── */}
        <div className="text-center pb-8">
          <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
            <Shield className="w-4 h-4" />
            <span>Secure payment powered by Stripe</span>
          </div>
        </div>
      </div>
    </div>
  );
}
