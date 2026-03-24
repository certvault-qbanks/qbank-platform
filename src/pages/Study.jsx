import { useState, useEffect, useRef } from "react";
import { qbank } from "@/configs";
import { Question } from "@/entities/all";

const STUDY_MODES = {
  tutor: { name: "Tutor Mode", desc: "Untimed · Instant feedback", icon: "🧠", timed: false, showImmediate: true },
  timed_exam: { name: "Timed Exam", desc: "Timed · Review at end", icon: "⏱", timed: true, showImmediate: false },
  timed_tutor: { name: "Timed Tutor", desc: "Timed · Feedback (pauses)", icon: "⚡", timed: true, showImmediate: true, pauseOnAnswer: true }
};

function HighlightableStem({ text }) {
  const ref = useRef(null);
  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !ref.current?.contains(sel.anchorNode)) return;
    const range = sel.getRangeAt(0);
    const span = document.createElement("mark");
    span.style.cssText = "background:#fef08a;padding:1px 2px;border-radius:2px;cursor:pointer";
    span.addEventListener("click", () => span.replaceWith(...span.childNodes));
    try { range.surroundContents(span); } catch {}
    sel.removeAllRanges();
  };
  return <div ref={ref} onMouseUp={handleMouseUp} style={{ cursor: "text", fontSize: "14.5px", lineHeight: 1.75, marginBottom: 16 }}>{text}</div>;
}

function ExplanationPanel({ question, selectedOption }) {
  const pctKeys = ["pct_A", "pct_B", "pct_C", "pct_D"];
  const labels = ["A", "B", "C", "D"];
  return (
    <div style={{ background: "#fff", border: "1px solid #e0e3e8", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", background: "#eef2ff", borderBottom: "1px solid #e0e3e8" }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#1a56db", marginBottom: 4 }}>Educational Objective</div>
        <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.5 }}>{question.educational_objective}</div>
      </div>
      <div style={{ padding: "16px 20px" }}>
        {question.options.map((opt, i) => {
          const pct = question.user_stats?.[pctKeys[i]] || 0;
          const isCorrect = opt.is_correct; const isSelected = i === selectedOption;
          return (
            <div key={i} style={{ marginBottom: 16, padding: 12, borderRadius: 6, border: `1px solid ${isCorrect ? "#a7f3d0" : isSelected ? "#fecaca" : "#eef0f3"}`, background: isCorrect ? "#ecfdf5" : isSelected ? "#fef2f2" : "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13, fontWeight: 600 }}><span>{labels[i]}. {isCorrect && "✓ "}{isSelected && !isCorrect && "✗ "}{opt.text}</span><span style={{ fontSize: 11, color: "#5f6368" }}>{pct}%</span></div>
              <div style={{ height: 4, background: "#f0f2f5", borderRadius: 2, overflow: "hidden", marginBottom: 8 }}><div style={{ height: "100%", width: `${pct}%`, background: isCorrect ? "#059669" : isSelected ? "#dc2626" : "#9aa0a6", borderRadius: 2 }}></div></div>
              <div style={{ fontSize: 12.5, lineHeight: 1.6, color: "#5f6368" }}>{opt.explanation}</div>
            </div>
          );
        })}
      </div>
      <div style={{ padding: "16px 20px", background: "#fffbeb", borderTop: "1px solid #fde68a" }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#d97706", marginBottom: 4 }}>⚡ Bottom Line</div>
        <div style={{ fontSize: 13, lineHeight: 1.6, fontWeight: 500 }}>{question.bottom_line}</div>
      </div>
      {question.related_topics && <div style={{ padding: "12px 20px", display: "flex", flexWrap: "wrap", gap: 6 }}><span style={{ fontSize: 11, color: "#9aa0a6", marginRight: 4 }}>Related:</span>{question.related_topics.map((t, i) => <span key={i} style={{ padding: "2px 8px", background: "#f0f2f5", borderRadius: 4, fontSize: 11, color: "#5f6368" }}>{t}</span>)}</div>}
    </div>
  );
}

export default function Study() {
  const [phase, setPhase] = useState("setup");
  const [mode, setMode] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerPaused, setTimerPaused] = useState(false);
  const [questionStart, setQuestionStart] = useState(Date.now());
  const [filters, setFilters] = useState({ category: "all", difficulty: "all", count: 20, timePressure: "1" });

  const CATEGORIES = [{ value: "all", label: "All Categories" }, ...qbank.categories];

  // Load questions from database on mount
  useEffect(() => {
    (async () => {
      setIsLoadingQuestions(true);
      try {
        const dbQuestions = await Question.list();
        if (dbQuestions.length > 0) {
          // Map DB questions to the format the Study UI expects
          const mapped = dbQuestions.map(q => ({
            id: q.id,
            category: q.category,
            difficulty: q.difficulty || 'intermediate',
            stem: q.question_text,
            question: q.question_text,
            options: (q.options || []).map(opt => ({
              text: opt.text,
              is_correct: opt.is_correct,
              explanation: opt.explanation || q.explanation || '',
            })),
            educational_objective: q.explanation || '',
            bottom_line: q.reference || '',
            related_topics: q.tags || [],
            user_stats: { pct_A: 25, pct_B: 25, pct_C: 25, pct_D: 25, avg_time: 60 },
          }));
          setAllQuestions(mapped);
        } else {
          // Fall back to sample questions from config
          setAllQuestions(qbank.sampleQuestions || []);
        }
      } catch (e) {
        console.error("Error loading questions:", e);
        setAllQuestions(qbank.sampleQuestions || []);
      }
      setIsLoadingQuestions(false);
    })();
  }, []);

  useEffect(() => {
    if (phase !== "active" || !mode || !STUDY_MODES[mode].timed) return;
    const iv = setInterval(() => { if (!timerPaused) setTimeLeft(p => { if (p <= 1) { setPhase("results"); return 0; } return p - 1; }); }, 1000);
    return () => clearInterval(iv);
  }, [phase, mode, timerPaused]);

  useEffect(() => { setQuestionStart(Date.now()); setTimerPaused(false); }, [currentIdx]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT" || phase !== "active") return;
      const map = { a: 0, b: 1, c: 2, d: 3, arrowright: "next", arrowleft: "prev" };
      const action = map[e.key?.toLowerCase()];
      if (action === "next") nextQ();
      else if (action === "prev") prevQ();
      else if (typeof action === "number" && !answers[currentIdx]) handleAnswer(action);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, currentIdx, answers, questions]);

  const startSession = () => {
    let pool = [...allQuestions];
    // Apply category filter
    if (filters.category !== "all") {
      pool = pool.filter(q => q.category === filters.category);
    }
    // Apply difficulty filter
    if (filters.difficulty !== "all") {
      pool = pool.filter(q => q.difficulty === filters.difficulty);
    }
    // Shuffle and limit
    pool.sort(() => Math.random() - 0.5);
    const qs = pool.slice(0, Math.min(filters.count, pool.length));
    setQuestions(qs); setAnswers({}); setFlagged([]); setCurrentIdx(0); setPhase("active");
    if (STUDY_MODES[mode].timed) setTimeLeft(Math.round(qs.length * 90 * (1 / parseFloat(filters.timePressure))));
  };

  const handleAnswer = (optIdx) => {
    if (answers[currentIdx]) return;
    const q = questions[currentIdx];
    setAnswers(p => ({ ...p, [currentIdx]: { selected: optIdx, correct: q.options[optIdx].is_correct, timeSpent: Math.round((Date.now() - questionStart) / 1000) } }));
    if (mode === "timed_tutor") setTimerPaused(true);
  };

  const toggleFlag = () => setFlagged(p => p.includes(currentIdx) ? p.filter(i => i !== currentIdx) : [...p, currentIdx]);
  const nextQ = () => { if (currentIdx < questions.length - 1) { setCurrentIdx(p => p + 1); setTimerPaused(false); } };
  const prevQ = () => { if (currentIdx > 0) setCurrentIdx(p => p - 1); };
  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const modeConfig = mode ? STUDY_MODES[mode] : null;
  const currentQ = questions[currentIdx];
  const currentAns = answers[currentIdx];
  const showExplanation = !!currentAns && modeConfig?.showImmediate;
  const labels = ["A", "B", "C", "D"];

  if (phase === "setup") {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px", fontFamily: "'system-ui', sans-serif" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, background: "#1a56db", color: "white", fontWeight: 700, fontSize: 18, borderRadius: 12, marginBottom: 16 }}>{qbank.logoText}</div>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>{qbank.name}</h1>
          <p style={{ color: "#5f6368", marginTop: 4 }}>{qbank.tagline}</p>
        </div>
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, color: "#5f6368", marginBottom: 12 }}>Study Mode</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {Object.entries(STUDY_MODES).map(([key, m]) => (
              <button key={key} onClick={() => setMode(key)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "20px 12px", background: mode === key ? "#eef2ff" : "#fff", border: `2px solid ${mode === key ? "#1a56db" : "#e0e3e8"}`, borderRadius: 8, cursor: "pointer", boxShadow: mode === key ? "0 0 0 3px rgba(26,86,219,0.15)" : "none" }}>
                <span style={{ fontSize: 28 }}>{m.icon}</span><span style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</span><span style={{ fontSize: 11, color: "#5f6368", textAlign: "center" }}>{m.desc}</span>
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, color: "#5f6368", marginBottom: 12 }}>Block Settings</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            <div><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#5f6368", marginBottom: 6 }}>Category</label><select value={filters.category} onChange={e => setFilters(p => ({ ...p, category: e.target.value }))} style={{ width: "100%", padding: "10px 12px", border: "1px solid #e0e3e8", borderRadius: 8, fontSize: 13 }}>{CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
            <div><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#5f6368", marginBottom: 6 }}>Difficulty</label><select value={filters.difficulty} onChange={e => setFilters(p => ({ ...p, difficulty: e.target.value }))} style={{ width: "100%", padding: "10px 12px", border: "1px solid #e0e3e8", borderRadius: 8, fontSize: 13 }}><option value="all">All</option><option value="basic">Basic</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></div>
            <div><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#5f6368", marginBottom: 6 }}>Questions</label><select value={filters.count} onChange={e => setFilters(p => ({ ...p, count: parseInt(e.target.value) }))} style={{ width: "100%", padding: "10px 12px", border: "1px solid #e0e3e8", borderRadius: 8, fontSize: 13 }}><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option><option value={40}>40 (Full Block)</option><option value={100}>100</option></select></div>
          </div>
        </div>
        {isLoadingQuestions ? (
          <div style={{ textAlign: "center", padding: 20, color: "#5f6368" }}>Loading questions from database...</div>
        ) : (
          <div style={{ textAlign: "center", marginBottom: 16, fontSize: 13, color: "#059669", fontWeight: 600 }}>{allQuestions.length} questions available</div>
        )}
        <button onClick={startSession} disabled={!mode || isLoadingQuestions || allQuestions.length === 0} style={{ display: "block", width: "100%", padding: 14, background: (mode && !isLoadingQuestions && allQuestions.length > 0) ? "#1a56db" : "#ccc", color: "white", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: (mode && !isLoadingQuestions) ? "pointer" : "not-allowed" }}>{isLoadingQuestions ? "Loading..." : mode ? `Start ${STUDY_MODES[mode].name}` : "Select a mode"}</button>
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "#9aa0a6", padding: 10, background: "#f0f2f5", borderRadius: 8 }}><strong>Keyboard:</strong> A/B/C/D = answer · ←/→ = navigate</div>
      </div>
    );
  }

  if (phase === "results") {
    const total = Object.keys(answers).length;
    const correct = Object.values(answers).filter(a => a.correct).length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    return (
      <div style={{ maxWidth: 560, margin: "60px auto", padding: "0 24px", textAlign: "center", fontFamily: "system-ui" }}>
        <div style={{ fontSize: 64, fontWeight: 700, color: pct >= 70 ? "#059669" : pct >= 50 ? "#d97706" : "#dc2626" }}>{pct}%</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>Block Complete</h2>
        <p style={{ color: "#5f6368", marginTop: 4 }}>{correct} of {total} correct</p>
        <button onClick={() => { setPhase("setup"); setMode(null); }} style={{ marginTop: 32, padding: "10px 24px", border: "1px solid #e0e3e8", borderRadius: 8, background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>New Block</button>
      </div>
    );
  }

  if (!currentQ) return <div style={{ padding: 48, textAlign: "center" }}>No questions available. Add sample questions to your qbank config.</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "system-ui", fontSize: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "8px 16px", background: "#fff", borderBottom: "1px solid #e0e3e8", minHeight: 48 }}>
        <button onClick={() => { if(confirm("End block?")) setPhase("setup"); }} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e3e8", borderRadius: 6, background: "#fff", cursor: "pointer" }}>✕</button>
        <span style={{ fontWeight: 600, fontSize: 13 }}>{modeConfig.icon} {modeConfig.name}</span>
        <div style={{ flex: 1 }}><div style={{ fontSize: 12, color: "#5f6368", marginBottom: 4 }}>Q{currentIdx + 1}/{questions.length} ({Object.keys(answers).length} done)</div><div style={{ height: 4, background: "#f0f2f5", borderRadius: 2 }}><div style={{ height: "100%", background: "#1a56db", borderRadius: 2, width: `${((currentIdx + 1) / questions.length) * 100}%`, transition: "width 0.3s" }}></div></div></div>
        {modeConfig.timed && <div style={{ padding: "4px 12px", fontFamily: "monospace", fontSize: 14, fontWeight: 600, background: timeLeft < 60 ? "#fef2f2" : "#eef2ff", color: timeLeft < 60 ? "#dc2626" : "#1a56db", borderRadius: 6 }}>⏱ {formatTime(timeLeft)}</div>}
        <button onClick={toggleFlag} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e3e8", borderRadius: 6, background: flagged.includes(currentIdx) ? "#fffbeb" : "#fff", cursor: "pointer", fontSize: 16 }}>⚑</button>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: 24, display: showExplanation ? "grid" : "block", gridTemplateColumns: showExplanation ? "1fr 1fr" : undefined, gap: 24, alignItems: "start" }}>
        <div style={{ maxWidth: showExplanation ? "none" : 720 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <span style={{ padding: "3px 10px", background: "#eef2ff", color: "#1a56db", fontSize: 11, fontWeight: 600, borderRadius: 4, textTransform: "uppercase" }}>{qbank.categories.find(c => c.value === currentQ.category)?.label || currentQ.category}</span>
            <span style={{ padding: "3px 10px", fontSize: 11, fontWeight: 600, borderRadius: 4, textTransform: "uppercase", background: currentQ.difficulty === "basic" ? "#ecfdf5" : currentQ.difficulty === "intermediate" ? "#fffbeb" : "#fef2f2", color: currentQ.difficulty === "basic" ? "#059669" : currentQ.difficulty === "intermediate" ? "#d97706" : "#dc2626" }}>{currentQ.difficulty}</span>
          </div>
          <HighlightableStem text={currentQ.stem} />
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>{currentQ.question}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {currentQ.options.map((opt, i) => {
              const isSelected = currentAns?.selected === i; const isCorrect = opt.is_correct;
              let bg = "#fff", border = "#e0e3e8";
              if (isSelected && !showExplanation) { bg = "#eef2ff"; border = "#1a56db"; }
              if (showExplanation && isCorrect) { bg = "#ecfdf5"; border = "#059669"; }
              if (showExplanation && isSelected && !isCorrect) { bg = "#fef2f2"; border = "#dc2626"; }
              return (
                <div key={i} onClick={() => !currentAns && handleAnswer(i)} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", border: `2px solid ${border}`, borderRadius: 8, cursor: currentAns ? "default" : "pointer", background: bg, transition: "all 0.15s" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${showExplanation && isCorrect ? "#059669" : showExplanation && isSelected ? "#dc2626" : isSelected ? "#1a56db" : "#ccc"}`, background: showExplanation && isCorrect ? "#059669" : showExplanation && isSelected && !isCorrect ? "#dc2626" : isSelected ? "#1a56db" : "#f0f2f5", color: (isSelected || (showExplanation && isCorrect)) ? "#fff" : "#5f6368", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{labels[i]}</div>
                  <span style={{ flex: 1, fontSize: 14, lineHeight: 1.5 }}>{opt.text}</span>
                  {showExplanation && isCorrect && <span style={{ color: "#059669", fontWeight: 700 }}>✓</span>}
                  {showExplanation && isSelected && !isCorrect && <span style={{ color: "#dc2626", fontWeight: 700 }}>✗</span>}
                </div>
              );
            })}
          </div>
        </div>
        {showExplanation && <ExplanationPanel question={currentQ} selectedOption={currentAns?.selected} />}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", background: "#fff", borderTop: "1px solid #e0e3e8" }}>
        <button onClick={prevQ} disabled={currentIdx === 0} style={{ padding: "10px 24px", border: "1px solid #e0e3e8", borderRadius: 8, background: "#fff", fontSize: 13, fontWeight: 600, cursor: currentIdx === 0 ? "not-allowed" : "pointer", opacity: currentIdx === 0 ? 0.4 : 1 }}>← Prev</button>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{currentAns && modeConfig?.showImmediate && <span style={{ color: currentAns.correct ? "#059669" : "#dc2626" }}>{currentAns.correct ? "✓ Correct" : "✗ Incorrect"}</span>}</div>
        {currentIdx === questions.length - 1 ? <button onClick={() => setPhase("results")} style={{ padding: "10px 24px", borderRadius: 8, background: "#059669", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Submit →</button>
          : <button onClick={nextQ} style={{ padding: "10px 24px", borderRadius: 8, background: "#1a56db", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Next →</button>}
      </div>
    </div>
  );
}
