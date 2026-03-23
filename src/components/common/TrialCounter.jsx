import React from "react";
import { AlertCircle, CheckCircle, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { qbank } from "@/configs";

export default function TrialCounter({ user }) {
  if (!user) return null;
  const freeLimit = qbank.trial.freeQuestions;
  const questionsAnswered = user.questions_answered_count || 0;
  const questionsRemaining = Math.max(0, freeLimit - questionsAnswered);
  const subscriptionStatus = user.subscription_status || 'trial';

  if (subscriptionStatus === 'active' || subscriptionStatus === 'paid') {
    return <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg shadow-sm"><Crown className="w-4 h-4" /><span className="text-sm font-semibold">Premium</span></div>;
  }

  const isLow = questionsRemaining <= 10;
  const isVeryLow = questionsRemaining <= 5;

  return (
    <Link to={createPageUrl("Upgrade")} className="block">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-sm transition-all hover:scale-105 ${isVeryLow ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white animate-pulse' : isLow ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'}`}>
        {isVeryLow ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
        <div className="flex flex-col"><span className="text-xs font-medium opacity-90">Trial</span><span className="text-sm font-bold">{questionsRemaining} / {freeLimit} left</span></div>
      </div>
    </Link>
  );
}
