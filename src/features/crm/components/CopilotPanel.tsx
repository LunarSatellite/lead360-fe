import { useEffect, useRef, useState } from 'react';
import { Bot, X, Send, Loader2, Wrench, Check, AlertTriangle } from 'lucide-react';
import { streamAgentMessage, AgentStatus, type AgentProgress, type AgentResult } from '../api/agent.api';

/** Open the CRM Copilot panel from anywhere (header button). */
export function openCopilot() {
  window.dispatchEvent(new Event('lead360:open-copilot'));
}

interface Msg { role: 'user' | 'assistant'; text: string }

export function CopilotPanel() {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [progress, setProgress] = useState<AgentProgress[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [confirm, setConfirm] = useState<{ prompt: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      setSessionId((s) => s || (crypto.randomUUID?.() ?? `${Date.now()}-${Math.round(performance.now())}`));
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('lead360:open-copilot', onOpen);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('lead360:open-copilot', onOpen);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, progress, confirm]);

  const run = async (text: string, confirmed: boolean) => {
    setStreaming(true);
    setProgress([]);
    setConfirm(null);
    abortRef.current = new AbortController();
    try {
      await streamAgentMessage(
        sessionId, text, confirmed,
        {
          onProgress: (p) => setProgress((cur) => [...cur, p]),
          onResult: (r: AgentResult) => {
            if (r.status === AgentStatus.AwaitingConfirmation) {
              setConfirm({ prompt: r.confirmationPrompt || 'Confirm this action?' });
            } else {
              setMessages((m) => [...m, { role: 'assistant', text: r.response || '(no response)' }]);
            }
          },
        },
        abortRef.current.signal,
      );
    } catch (e: any) {
      setMessages((m) => [...m, { role: 'assistant', text: `⚠️ ${e?.message || 'The copilot is unavailable.'}` }]);
    } finally {
      setStreaming(false);
      setProgress([]);
    }
  };

  const send = () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text }]);
    run(text, false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-md h-full bg-bg-shell border-l border-thin border-border-subtle flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-thin border-border-subtle">
          <div className="w-7 h-7 rounded-card bg-brand-soft border-thin border-border-glow flex items-center justify-center">
            <Bot className="w-4 h-4 text-brand" strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-text-primary">CRM Copilot</div>
            <div className="text-[10px] text-text-muted">Ask questions or take actions across your CRM</div>
          </div>
          <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-glass-2 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thread */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 && !streaming && (
            <div className="text-center text-text-muted text-xs py-10">
              <Bot className="w-8 h-8 mx-auto mb-2 opacity-30" strokeWidth={1.2} />
              Try: “show my hot leads”, “create a task to call Acme”, or “what changed on deal X?”
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-3 py-2 rounded-card text-sm whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-brand text-bg font-medium'
                  : 'bg-glass-1 border-thin border-border-subtle text-text-primary'
              }`}>
                {m.text}
              </div>
            </div>
          ))}

          {/* Live progress */}
          {streaming && progress.map((p, i) => (
            <div key={`p${i}`} className="flex items-center gap-2 text-[11px] text-text-muted">
              {p.kind === 'tool_call' ? <Wrench className="w-3 h-3 text-brand" />
                : p.kind === 'tool_result' ? <Check className={`w-3 h-3 ${p.success === false ? 'text-danger' : 'text-success'}`} />
                : <Loader2 className="w-3 h-3 animate-spin" />}
              <span className="truncate">
                {p.kind === 'tool_call' ? `Calling ${p.toolName}…`
                  : p.kind === 'tool_result' ? (p.detail || `${p.toolName} done`)
                  : 'Thinking…'}
              </span>
            </div>
          ))}
          {streaming && progress.length === 0 && (
            <div className="flex items-center gap-2 text-[11px] text-text-muted">
              <Loader2 className="w-3 h-3 animate-spin" /> Thinking…
            </div>
          )}

          {/* Confirmation prompt for a destructive action */}
          {confirm && (
            <div className="bg-warning-soft border-thin border-[rgba(245,158,11,0.25)] rounded-card p-3 space-y-2">
              <div className="flex items-start gap-2 text-xs text-text-primary">
                <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <span>{confirm.prompt}</span>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setConfirm(null)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-text-secondary border border-border-subtle hover:text-text-primary transition-all">Cancel</button>
                <button onClick={() => run('Confirmed.', true)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all">Confirm</button>
              </div>
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="px-3 py-3 border-t border-thin border-border-subtle">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask the copilot…"
              rows={1}
              disabled={streaming}
              className="flex-1 resize-none px-3 py-2 rounded-xl bg-bg-input border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-glow transition-colors disabled:opacity-50 max-h-32"
            />
            <button
              onClick={send}
              disabled={streaming || !input.trim()}
              className="p-2.5 rounded-xl bg-brand text-bg hover:bg-brand-light disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
