import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, Clock } from "lucide-react";
import { qbank } from "@/configs";
export default function SettingsPage() {
  const [s, setS] = useState({ notifications: true, soundEffects: false, autoSave: true, studyReminders: true, difficulty: 'all' });
  const set = (k,v) => setS(p=>({...p,[k]:v}));
  return (
    <div className="p-4 md:p-8 min-h-screen"><div className="max-w-4xl mx-auto">
      <div className="mb-8"><h1 className="text-3xl font-bold flex items-center gap-3"><SettingsIcon className="w-8 h-8 text-blue-600"/>Settings</h1></div>
      <div className="space-y-6">
        <Card className="border-0 shadow-lg bg-white/80"><CardHeader><CardTitle>General</CardTitle></CardHeader><CardContent className="space-y-6">
          {[["Notifications","notifications"],["Sound Effects","soundEffects"],["Auto-Save","autoSave"],["Study Reminders","studyReminders"]].map(([t,k])=>(
            <div key={k} className="flex justify-between items-center"><div><h3 className="font-semibold">{t}</h3></div><Switch checked={s[k]} onCheckedChange={v=>set(k,v)}/></div>
          ))}
        </CardContent></Card>
        <Card className="border-0 shadow-lg bg-white/80"><CardHeader><CardTitle>Preferences</CardTitle></CardHeader><CardContent>
          <div><label className="text-sm font-semibold mb-2 block">Default Difficulty</label><Select value={s.difficulty} onValueChange={v=>set('difficulty',v)}><SelectTrigger className="w-64"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">Mixed</SelectItem><SelectItem value="basic">Basic</SelectItem><SelectItem value="intermediate">Intermediate</SelectItem><SelectItem value="advanced">Advanced</SelectItem></SelectContent></Select></div>
        </CardContent></Card>
        <Card className="border-0 shadow-lg bg-white/80"><CardHeader><CardTitle>About</CardTitle></CardHeader><CardContent><div className="grid md:grid-cols-2 gap-6"><div><h3 className="font-semibold mb-2">App</h3><Badge variant="outline">{qbank.fullName} v1.0</Badge></div><div><h3 className="font-semibold mb-2">Stack</h3><p className="text-sm text-slate-600">React + Supabase</p></div></div></CardContent></Card>
      </div>
    </div></div>
  );
}
