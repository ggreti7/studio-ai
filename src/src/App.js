import { useState, useEffect } from "react";

const SYSTEM_PROMPT = `You are Gréta's personal co-worker and assistant. Here is everything about her:

GRÉTA'S WORLDS:
1. Personal brand — editorial photographer & videographer, building presence on Instagram, TikTok/Reels, Substack. Series: "Curated Culture". Voice: poetic, lowercase, fragmented, emotionally resonant. Never motivational-poster clichés. Raw, real, beautiful.
2. Client work — she produces weekly talking head videos (1–4 min) for Malák TechKen about tech topics, uploaded to his TikTok and sometimes YouTube.
3. Personal life — PhD student, needs help with calendar planning, to-dos, thesis writing, weekly workflows.

GRÉTA'S CREATIVE VOICE (for her own content):
- lowercase, fragmented, poetic
- emotionally resonant, never generic
- speaks collectively ("we", "her") not directively
- think: editorial fashion meets raw personal storytelling
- NO exclamation mark overload, NO corporate language

Respond ONLY in valid JSON. No markdown, no backticks, no explanation. Pure JSON only.

For task_type "content": {"instagram":"...","reels_hook":"...","tiktok":"...","substack_intro":"...","tip":"..."}
For task_type "curated_culture": {"concept":"...","instagram":"...","tiktok":"...","substack_angle":"...","tip":"..."}
For task_type "malak": {"video_title":"...","hook":"...","structure":"...","tiktok_caption":"...","youtube_description":"...","tip":"..."}
For task_type "analytics": {"top_insight":"...","make_more":"...","let_go":"...","next_idea":"...","tip":"..."}
For task_type "planning": {"weekly_plan":"...","priorities":"...","tip":"..."}
For task_type "phd": {"response":"...","tip":"..."}
For task_type "business": {"response":"...","tip":"..."}`;

const MODES = [
  { id: "content", icon: "✦", label: "my content", desc: "Instagram, Reels, TikTok, Substack — your voice" },
  { id: "curated_culture", icon: "◈", label: "curated culture", desc: "plan & write your series" },
  { id: "malak", icon: "▶", label: "malák techken", desc: "video scripts, titles, captions" },
  { id: "analytics", icon: "○", label: "analytics", desc: "what's working, what to drop" },
  { id: "planning", icon: "◇", label: "planning", desc: "calendar, to-dos, weekly workflow" },
  { id: "phd", icon: "·", label: "phd", desc: "thesis, research, academic writing" },
  { id: "business", icon: "—", label: "business", desc: "client emails, proposals, admin" },
];

const TABS = {
  content: ["instagram","reels_hook","tiktok","substack_intro","tip"],
  curated_culture: ["concept","instagram","tiktok","substack_angle","tip"],
  malak: ["video_title","hook","structure","tiktok_caption","youtube_description","tip"],
  analytics: ["top_insight","make_more","let_go","next_idea","tip"],
  planning: ["weekly_plan","priorities","tip"],
  phd: ["response","tip"],
  business: ["response","tip"],
};

const TAB_LABELS = {
  instagram:"instagram", reels_hook:"reels hook", tiktok:"tiktok",
  substack_intro:"substack", tip:"tip", concept:"concept",
  substack_angle:"substack angle", video_title:"title", hook:"hook",
  structure:"structure", tiktok_caption:"tiktok", youtube_description:"youtube",
  top_insight:"main finding", make_more:"make more of", let_go:"let this go",
  next_idea:"next idea", weekly_plan:"weekly plan", priorities:"priorities",
  response:"response",
};

const PLACEHOLDERS = {
  content: "describe your shoot, idea, or feeling...\ne.g. golden hour editorial, Budapest rooftops, film grain, melancholic and warm",
  curated_culture: "describe the edition or theme...\ne.g. an issue about brutalist architecture and how it shapes identity",
  malak: "give me the tech topic and details...\ne.g. why everyone is suddenly talking about AI agents, keep it under 3 min, TikTok-first",
  analytics: "paste your stats or describe what's happening...\ne.g. last 5 reels: 200–800 views. workshop carousel got 3× more saves than usual",
  planning: "tell me what's coming up...\ne.g. shoot tuesday, phd deadline friday, 2 malák videos due this week, exhausted",
  phd: "what are you working on?\ne.g. need to structure my argument about visual identity in social media",
  business: "what do you need?\ne.g. follow-up email to a client who hasn't replied in 2 weeks",
};

function Typewriter({ text }) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    setShown("");
    if (!text) return;
    let i = 0;
    const t = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(t);
    }, 12);
    return () => clearInterval(t);
  }, [text]);
  return <span>{shown}</span>;
}

export default function App() {
  const [mode, setMode] = useState("content");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("instagram");
  const [copied, setCopied] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("studio_ai_key") || "");
  const [showKeyInput, setShowKeyInput] = useState(false);

  const saveKey = (val) => {
    setApiKey(val);
    localStorage.setItem("studio_ai_key", val);
  };

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;
    if (!apiKey) { setShowKeyInput(true); return; }
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-allow-browser": "true",
        },
        body: JSON.stringify({
          model: "claude-opus-4-6",
          max_tokens: 1200,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: `task_type: ${mode}. ${input}` }],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.content?.map(b => b.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
      setActiveTab(TABS[mode][0]);
    } catch (err) {
      setError("something went wrong — check your API key or try again.");
    } finally {
      setLoading(false);
    }
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#080808", color:"#ddd", fontFamily:"Georgia, serif", display:"flex", flexDirection:"column", alignItems:"center", padding:"48px 20px 100px" }}>
      <style>{`* { box-sizing: border-box; } textarea:focus, button:focus { outline: none; } ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-thumb { background: #222; }`}</style>

      {/* Header */}
      <div style={{ textAlign:"center", marginBottom:44 }}>
        <p style={{ fontSize:10, letterSpacing:"0.35em", color:"#2e2e2e", textTransform:"uppercase", margin:"0 0 12px" }}>your creative co-worker</p>
        <h1 style={{ fontSize:32, fontWeight:400, margin:0, color:"#f0f0f0", letterSpacing:"-0.02em" }}>studio ai</h1>
        <div style={{ width:24, height:1, background:"#1e1e1e", margin:"14px auto 0" }} />
      </div>

      {/* API Key */}
      <div style={{ width:"100%", maxWidth:640, marginBottom:24 }}>
        {showKeyInput || !apiKey ? (
          <div style={{ background:"#0d0d0d", border:"1px solid #1e1e1e", borderRadius:10, padding:"16px 20px" }}>
            <p style={{ fontSize:11, color:"#555", letterSpacing:"0.05em", margin:"0 0 10px" }}>enter your anthropic api key to start — saved in your browser only</p>
            <div style={{ display:"flex", gap:8 }}>
              <input type="password" placeholder="sk-ant-..." value={apiKey} onChange={e => saveKey(e.target.value)}
                style={{ flex:1, background:"#111", border:"1px solid #222", borderRadius:7, padding:"9px 14px", color:"#ddd", fontSize:13, fontFamily:"Georgia, serif" }} />
              <button onClick={() => setShowKeyInput(false)}
                style={{ background:"#131313", border:"1px solid #2e2e2e", color:"#ccc", borderRadius:7, padding:"9px 18px", fontSize:12, cursor:"pointer", fontFamily:"Georgia, serif" }}>
                save
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign:"right" }}>
            <button onClick={() => setShowKeyInput(true)}
              style={{ background:"transparent", border:"none", color:"#2a2a2a", fontSize:10, cursor:"pointer", letterSpacing:"0.1em", fontFamily:"Georgia, serif" }}>
              ◈ api key
            </button>
          </div>
        )}
      </div>

      {/* Mode Grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:8, width:"100%", maxWidth:640, marginBottom:36 }}>
        {MODES.map(m => (
          <button key={m.id} onClick={() => { setMode(m.id); setResult(null); setInput(""); setActiveTab(TABS[m.id][0]); }}
            style={{ background: mode===m.id ? "#131313" : "transparent", border:"1px solid", borderColor: mode===m.id ? "#2e2e2e" : "#161616", borderRadius:10, padding:"12px 8px 10px", cursor:"pointer", fontFamily:"Georgia, serif", textAlign:"center", transition:"all 0.2s" }}>
            <span style={{ display:"block", fontSize:15, marginBottom:5, color: mode===m.id ? "#e0e0e0" : "#333" }}>{m.icon}</span>
            <span style={{ fontSize:10, letterSpacing:"0.07em", color: mode===m.id ? "#c0c0c0" : "#2e2e2e" }}>{m.label}</span>
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ width:"100%", maxWidth:640 }}>
        <p style={{ fontSize:11, color:"#2a2a2a", letterSpacing:"0.05em", margin:"0 0 10px" }}>
          {MODES.find(m => m.id === mode)?.desc}
        </p>
        <textarea value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if ((e.metaKey||e.ctrlKey) && e.key==="Enter") handleSubmit(); }}
          placeholder={PLACEHOLDERS[mode]} rows={4}
          style={{ width:"100%", background:"#0d0d0d", border:"1px solid #181818", borderRadius:12, padding:"20px 22px", color:"#ddd", fontSize:14, lineHeight:1.8, fontFamily:"Georgia, serif", transition:"border-color 0.2s", resize:"none" }}
          onFocus={e => e.target.style.borderColor="#2a2a2a"}
          onBlur={e => e.target.style.borderColor="#181818"} />

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:10 }}>
          <span style={{ fontSize:10, color:"#252525", letterSpacing:"0.08em" }}>⌘ + enter to run</span>
          <button onClick={handleSubmit} disabled={loading || !input.trim()}
            style={{ background:"#0d0d0d", border:"1px solid", borderColor: !input.trim()||loading ? "#181818" : "#2e2e2e", color: !input.trim()||loading ? "#2a2a2a" : "#e0e0e0", borderRadius:8, padding:"10px 26px", fontSize:12, cursor: !input.trim()||loading ? "default" : "pointer", letterSpacing:"0.1em", fontFamily:"Georgia, serif", transition:"all 0.2s" }}>
            {loading ? "thinking..." : "run →"}
          </button>
        </div>

        {error && <p style={{ color:"#933", fontSize:12, marginTop:14, letterSpacing:"0.05em" }}>{error}</p>}

        {/* Results */}
        {result && (
          <div style={{ marginTop:36 }}>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
              {TABS[mode].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ background:"transparent", border:"1px solid", borderColor: activeTab===tab ? "#444" : "#181818", color: activeTab===tab ? "#e0e0e0" : "#333", borderRadius:20, padding:"5px 14px", fontSize:11, cursor:"pointer", letterSpacing:"0.07em", fontFamily:"Georgia, serif", transition:"all 0.2s" }}>
                  {TAB_LABELS[tab]}
                </button>
              ))}
            </div>
            {result[activeTab] && (
              <div style={{ background:"#0d0d0d", border:"1px solid #161616", borderRadius:14, padding:"26px 24px 20px" }}>
                <p style={{ fontSize:9, letterSpacing:"0.3em", color:"#282828", textTransform:"uppercase", margin:"0 0 16px" }}>
                  {TAB_LABELS[activeTab]}
                </p>
                <p style={{ fontSize:14, lineHeight:1.9, color:"#c8c8c8", margin:0, fontStyle: activeTab==="substack_intro"||activeTab==="substack_angle" ? "italic" : "normal", whiteSpace:"pre-wrap" }}>
                  <Typewriter text={result[activeTab]} />
                </p>
                <div style={{ marginTop:20, display:"flex", justifyContent:"flex-end" }}>
                  <button onClick={() => copy(result[activeTab])}
                    style={{ background:"transparent", border:"1px solid #222", color: copied ? "#555" : "#333", borderRadius:6, padding:"4px 12px", fontSize:11, cursor:"pointer", fontFamily:"Georgia, serif", letterSpacing:"0.06em" }}>
                    {copied ? "copied ✓" : "copy"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <p style={{ position:"fixed", bottom:18, fontSize:9, color:"#181818", letterSpacing:"0.25em", textTransform:"uppercase" }}>studio ai · built for gréta</p>
    </div>
  );
}
