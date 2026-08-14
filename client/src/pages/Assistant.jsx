import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";

const SUGGESTIONS = [
  "How many O-negative donors are available?",
  "What is the donor response rate?",
  "Show me blood group distribution",
  "How many active emergency requests?",
  "Which donors are eligible right now?",
];

export default function Assistant() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello! I am the BloodLink GenAI RAG Assistant. I can analyze donor stats, response rates, and system metrics without requiring external LLMs. How can I assist you?",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text) {
    const query = (text ?? input).trim();
    if (!query || busy) return;
    setMessages((m) => [...m, { role: "user", text: query }]);
    setInput("");
    setBusy(true);
    try {
      const res = await api.ask(query);
      setMessages((m) => [...m, { role: "assistant", text: res.answer, intent: res.intentClassified }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", text: `Error: ${e.message}` }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col px-6 py-8">
      <div className="mb-4">
        <h1 className="text-2xl font-extrabold text-white">💬 GenAI Intercom</h1>
        <p className="mt-1 text-sm text-slate-500">
          Local RAG Pattern • Live Data Retrieval
        </p>
        <div className="mt-2 flex gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          <span className="rounded bg-white/5 px-2 py-1">Node.js</span>
          <span className="rounded bg-white/5 px-2 py-1">assistant.js</span>
          <span className="rounded bg-white/5 px-2 py-1">No External LLM</span>
        </div>
      </div>

      <div className="card flex-1 overflow-y-auto p-5">
        <div className="flex flex-col gap-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  m.role === "user"
                    ? "bg-blood-500 text-white"
                    : "border border-white/10 bg-white/[0.03] text-slate-200"
                }`}
              >
                {m.role === "assistant" && (
                  <div className="mb-1 text-xs font-bold text-blood-400">🤖 BloodLink AI Assistant:</div>
                )}
                <div className="whitespace-pre-wrap leading-relaxed">{renderRich(m.text)}</div>
                {m.intent && (
                  <div className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    RAG Intent: {m.intent}
                  </div>
                )}
              </div>
            </div>
          ))}
          {busy && <div className="text-xs text-slate-500">🤖 thinking…</div>}
          <div ref={endRef} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400 hover:bg-white/10"
            onClick={() => send(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <form
        className="mt-3 flex gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          className="input"
          placeholder="Ask about donor stats, blood distribution, or request rates..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="btn-primary" disabled={busy}>
          Send
        </button>
      </form>
      <p className="mt-2 text-center text-[11px] text-slate-600">
        Powered by Intent-Regex & Live Data Retrieval (No LLM Tokens Used)
      </p>
    </div>
  );
}

function renderRich(text) {
  // Bold **text** segments, keep everything else as plain text.
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="text-white">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}
