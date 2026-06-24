import { useState } from 'react';
import type { FlowNodeGap } from '../utils/gap-detector';
import type { NodeGapResolution } from '../types/flow.types';

interface Props {
  gap:           FlowNodeGap;
  currentConfig: Record<string, unknown>;
  onSave:        (r: NodeGapResolution) => void;
}

const LABELS: Record<string, { q1: string; q2: string }> = {
  'no-api-config': {
    q1: 'Do you have an API endpoint for this step?',
    q2: 'Do you want to show a custom message instead?',
  },
  'dead-end': {
    q1: 'Should this connect somewhere after sending?',
    q2: 'Add a follow-up message here?',
  },
  'no-rules': {
    q1: 'Pull the menu options from an API?',
    q2: 'Type the options manually?',
  },
};

export function GapPrompt({ gap, currentConfig: saved, onSave }: Props) {
  const c = saved as NodeGapResolution;
  const labels = LABELS[gap.gapType] ?? LABELS['no-api-config'];

  const [q1Answer,   setQ1Answer]   = useState<'yes'|'no'|null>(
    c.hasApi === true ? 'yes' : c.hasApi === false ? 'no' : null
  );
  const [apiUrl,     setApiUrl]     = useState(c.apiEndpointUrl ?? '');
  const [method,     setMethod]     = useState<'GET'|'POST'>(c.method ?? 'POST');
  const [successMsg, setSuccessMsg] = useState(c.successMessage ?? '');
  const [errorMsg,   setErrorMsg]   = useState(c.errorMessage ?? '');
  const [q2Answer,   setQ2Answer]   = useState<'yes'|'no'|null>(
    c.hasApi === false && c.skipped === true  ? 'no'
    : c.hasApi === false && c.customMessage   ? 'yes'
    : null
  );
  const [customMsg,  setCustomMsg]  = useState((c.customMessage as string) ?? '');
  const [followUp,   setFollowUp]   = useState(c.followUpMessage ?? '');

  function saveApiUrl() {
    if (!apiUrl.trim()) return;
    onSave({ hasApi: true, apiEndpointUrl: apiUrl.trim(), method, successMessage: successMsg || undefined, errorMessage: errorMsg || undefined });
  }

  function saveCustomMsg() {
    if (!customMsg.trim()) return;
    onSave({ hasApi: false, customMessage: customMsg.trim(), followUpMessage: followUp || undefined });
  }

  function saveSkipped() {
    onSave({ hasApi: false, skipped: true, customMessage: null });
  }

  const base = 'flex-1 py-1.5 text-[11px] font-semibold rounded-lg border transition-colors cursor-pointer';
  const yes  = (on: boolean) => on ? `${base} bg-brand text-white border-brand` : `${base} bg-transparent text-text-muted border-border-subtle hover:border-brand hover:text-brand`;
  const no   = (on: boolean) => on ? `${base} bg-glass-1 text-text-primary border-border-subtle` : `${base} bg-transparent text-text-muted border-border-subtle hover:bg-glass-1`;

  return (
    <div className="space-y-2.5">
      {/* Header */}
      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
        <span className="text-[11px] font-semibold text-amber-400">This node needs to be set up</span>
      </div>

      {/* Q1 */}
      <div className="border border-border-subtle rounded-lg overflow-hidden">
        <div className="px-3 py-2 text-[11px] font-medium text-text-primary bg-glass-1 border-b border-border-subtle">
          {labels.q1}
        </div>
        <div className="flex gap-2 p-2.5">
          <button className={yes(q1Answer === 'yes')} onClick={() => { setQ1Answer('yes'); setQ2Answer(null); }}>Yes</button>
          <button className={no(q1Answer === 'no')}  onClick={() => { setQ1Answer('no');  }}>No</button>
        </div>

        {q1Answer === 'yes' && (
          <div className="px-3 pb-3 space-y-2 border-t border-border-subtle">
            <div className="flex gap-1.5 pt-2">
              {(['GET', 'POST'] as const).map(m => (
                <button key={m} className={yes(method === m)} onClick={() => setMethod(m)}>{m}</button>
              ))}
            </div>
            <input
              value={apiUrl}
              onChange={e => setApiUrl(e.target.value)}
              placeholder="https://your-api.com/endpoint"
              className="w-full px-2.5 py-1.5 border border-border-subtle rounded-lg text-[11px] bg-bg-shell text-text-primary outline-none focus:border-brand font-mono"
            />
            <input
              value={successMsg}
              onChange={e => setSuccessMsg(e.target.value)}
              placeholder="Success message (optional)"
              className="w-full px-2.5 py-1.5 border border-border-subtle rounded-lg text-[11px] bg-bg-shell text-text-muted outline-none focus:border-brand"
            />
            <input
              value={errorMsg}
              onChange={e => setErrorMsg(e.target.value)}
              placeholder="Error message if call fails (optional)"
              className="w-full px-2.5 py-1.5 border border-border-subtle rounded-lg text-[11px] bg-bg-shell text-text-muted outline-none focus:border-brand"
            />
            <button
              onClick={saveApiUrl}
              disabled={!apiUrl.trim()}
              className="w-full py-2 rounded-lg text-[11px] font-bold bg-brand text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Save
            </button>
          </div>
        )}
      </div>

      {/* Q2 — only shown when Q1 = No */}
      {q1Answer === 'no' && (
        <div className="border border-border-subtle rounded-lg overflow-hidden">
          <div className="px-3 py-2 text-[11px] font-medium text-text-primary bg-glass-1 border-b border-border-subtle">
            {labels.q2}
          </div>
          <div className="flex gap-2 p-2.5">
            <button className={yes(q2Answer === 'yes')} onClick={() => setQ2Answer('yes')}>Yes</button>
            <button className={no(q2Answer === 'no')}  onClick={() => { setQ2Answer('no'); saveSkipped(); }}>No, skip it</button>
          </div>

          {q2Answer === 'yes' && (
            <div className="px-3 pb-3 space-y-2 border-t border-border-subtle">
              <textarea
                value={customMsg}
                onChange={e => setCustomMsg(e.target.value)}
                rows={3}
                placeholder="Message to show the customer at this step..."
                className="w-full px-2.5 py-1.5 border border-border-subtle rounded-lg text-[11px] bg-bg-shell text-text-muted outline-none focus:border-brand resize-none mt-2"
              />
              {gap.gapType === 'dead-end' && (
                <textarea
                  value={followUp}
                  onChange={e => setFollowUp(e.target.value)}
                  rows={2}
                  placeholder="Follow-up prompt (optional — e.g. 'What else can I help with?')"
                  className="w-full px-2.5 py-1.5 border border-border-subtle rounded-lg text-[11px] bg-bg-shell text-text-muted outline-none focus:border-brand resize-none"
                />
              )}
              <button
                onClick={saveCustomMsg}
                disabled={!customMsg.trim()}
                className="w-full py-2 rounded-lg text-[11px] font-bold bg-brand text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Save
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
