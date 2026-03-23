import React, { useState, useEffect, useRef } from "react";
import { User } from "@/entities/all";
import { qbank } from "@/configs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Send, MessageCircle, Bot, Loader2, BookOpen, Target, TrendingUp, Award } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const FAQ = {
  "How do I upgrade": `Visit the **Upgrade** page. We offer 30-day, 90-day, and 12-month plans with full access.`,
  "difference between Study Mode and Practice": `**Study Mode** = one question at a time with instant feedback. **Practice Tests** = full timed exam simulations.`,
  "three study modes": `1. **Tutor** — Untimed, instant feedback\n2. **Timed Exam** — Timed, review at end\n3. **Timed Tutor** — Timed, pauses for feedback`,
  "track my progress": `The **Analytics** page shows your accuracy, trends, and category breakdowns.`,
};

export default function ChatbotPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]); const [input, setInput] = useState(""); const [sending, setSending] = useState(false);
  const [user, setUser] = useState(null); const [loading, setLoading] = useState(true);
  const endRef = useRef(null);
  useEffect(() => { User.me().then(u=>{setUser(u);setLoading(false)}).catch(()=>setLoading(false)); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages]);

  const send = (text) => {
    if (!text.trim() || sending) return;
    setMessages(p=>[...p,{role:'user',content:text.trim()}]); setInput(""); setSending(true);
    const match = Object.entries(FAQ).find(([k])=>text.toLowerCase().includes(k.toLowerCase()));
    const reply = match ? match[1] : `Thanks for asking! This chatbot uses a simple FAQ system. For AI-powered responses, integrate the Anthropic API.\n\nTry: "How do I upgrade?", "study modes", or "track my progress".`;
    setTimeout(()=>{setMessages(p=>[...p,{role:'assistant',content:reply}]);setSending(false);},600);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-12 h-12 text-blue-600 animate-spin"/></div>;
  return (
    <div className="min-h-screen p-4 md:p-8"><div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-3"><div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg"><MessageCircle className="w-6 h-6 text-white"/></div><div><h1 className="text-3xl font-bold">AI Assistant</h1><p className="text-slate-600">Your {qbank.name} study companion</p></div></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[{i:BookOpen,l:"Study",p:"Study"},{i:Target,l:"Tests",p:"PracticeTests"},{i:TrendingUp,l:"Analytics",p:"Analytics"},{i:Award,l:"Upgrade",p:"Upgrade"}].map(({i:I,l,p})=>(
          <Button key={l} variant="outline" onClick={()=>navigate(createPageUrl(p))} className="h-auto py-3 gap-2 flex-col"><I className="w-5 h-5"/><span className="text-xs">{l}</span></Button>
        ))}
      </div>
      <Card className="border-0 shadow-2xl bg-white">
        <CardHeader className="border-b p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center"><Bot className="w-5 h-5 text-white"/></div><div><h3 className="font-semibold">Support</h3><p className="text-xs text-emerald-600">Online</p></div></div></CardHeader>
        <CardContent className="p-0">
          <div className="h-[500px] overflow-y-auto p-4 space-y-4">
            {messages.length===0 && <div className="text-center py-12"><Bot className="w-16 h-16 mx-auto mb-4 text-blue-200"/><h3 className="font-semibold mb-2">Hi {user?.full_name?.split(' ')[0]||'there'}!</h3><p className="text-sm text-slate-600 mb-6">Ask me anything about {qbank.name}.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">{["How do I upgrade?","What are the study modes?","How do I track progress?","What exams are available?"].map((q,i)=><button key={i} onClick={()=>send(q)} className="text-left p-4 rounded-xl border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-sm font-medium">{q}</button>)}</div></div>}
            {messages.map((m,i)=><div key={i} className={`flex gap-3 ${m.role==='user'?'justify-end':'justify-start'}`}>{m.role!=='user'&&<div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0"><Bot className="w-4 h-4 text-white"/></div>}<div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${m.role==='user'?'bg-gradient-to-r from-blue-600 to-purple-600 text-white':'bg-white border border-slate-200'}`}>{m.role==='user'?<p className="text-sm">{m.content}</p>:<ReactMarkdown className="text-sm prose prose-sm max-w-none">{m.content}</ReactMarkdown>}</div></div>)}
            {sending&&<div className="flex gap-3"><div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center"><Bot className="w-4 h-4 text-white"/></div><div className="bg-white border rounded-2xl px-4 py-2.5"><Loader2 className="w-4 h-4 animate-spin text-blue-600"/></div></div>}
            <div ref={endRef}/>
          </div>
          <div className="border-t p-4"><form onSubmit={e=>{e.preventDefault();send(input)}} className="flex gap-2"><Input value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask me anything..." className="flex-1"/><Button type="submit" disabled={!input.trim()||sending} className="bg-gradient-to-r from-blue-600 to-purple-600">{sending?<Loader2 className="w-4 h-4 animate-spin"/>:<Send className="w-4 h-4"/>}</Button></form></div>
        </CardContent>
      </Card>
    </div></div>
  );
}
