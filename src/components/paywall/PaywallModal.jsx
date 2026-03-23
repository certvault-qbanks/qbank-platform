import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, CheckCircle, TrendingUp, Award, BookOpen, Brain, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { qbank } from "@/configs";
export default function PaywallModal({ questionsAnswered = 0 }) {
  const features = [
    { icon: BookOpen, title: "Unlimited Questions", description: "Access all premium questions" },
    { icon: Brain, title: "Advanced Analytics", description: "Track performance across categories" },
    { icon: TrendingUp, title: "Progress Tracking", description: "Monitor improvement over time" },
    { icon: Award, title: "Exam Simulations", description: "Unlimited timed practice exams" },
  ];
  return (
    <div className="w-full max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="border-0 shadow-2xl bg-white">
          <CardHeader className="p-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-xl">
            <div className="flex items-center justify-between mb-4"><Badge className="bg-white/20 text-white border-white/30">Free Trial Complete</Badge><span className="font-semibold text-white/90">{questionsAnswered} / {qbank.trial.freeQuestions} Questions</span></div>
            <CardTitle className="text-3xl font-bold mb-2">Upgrade to Continue</CardTitle><p className="text-white/90 text-lg">Unlock unlimited access to master your certification.</p>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-6 mb-8">{features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100">
                <div className="p-2 rounded-lg bg-white shadow-sm"><f.icon className="w-6 h-6 text-blue-600" /></div><div><h3 className="font-semibold mb-1">{f.title}</h3><p className="text-sm text-slate-600">{f.description}</p></div>
              </motion.div>
            ))}</div>
            <Button onClick={() => window.open(qbank.stripe.upgrade || qbank.stripe['90day'], '_blank')} className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg font-semibold shadow-lg"><Lock className="w-5 h-5 mr-2" />Upgrade Now</Button>
            <p className="mt-6 text-center text-sm text-slate-500">Secure payment via Stripe · 30-day money-back guarantee</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
