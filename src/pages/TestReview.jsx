import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
export default function TestReviewPage() {
  const navigate = useNavigate();
  return <div className="min-h-screen p-8"><div className="max-w-4xl mx-auto"><Button variant="outline" onClick={()=>navigate(createPageUrl("TestHistory"))} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2"/>Back</Button><Card className="border-0 shadow-lg bg-white"><CardContent className="p-12 text-center"><p className="text-slate-600">Detailed test review available after completing practice tests with database questions.</p></CardContent></Card></div></div>;
}
