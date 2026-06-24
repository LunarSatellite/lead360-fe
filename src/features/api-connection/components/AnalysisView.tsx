import { useState } from 'react';
import { Loader2, Brain, AlertCircle, HelpCircle, ChevronDown, ChevronRight, Send } from 'lucide-react';
import { ReadinessGauge } from './ReadinessGauge';
import { useAnalysis, useRunAnalysis, useSubmitAnswers } from '../api/api-connection.queries';
import { parseJson, AnalysisStatus } from '../types/api-connection.types';
import type {
  ReadinessBreakdownItem,
  GapItem,
  QuestionItem,
  AnalysisDto,
} from '../types/api-connection.types';

interface AnalysisViewProps {
  specId: string;
}

export function AnalysisView({ specId }: AnalysisViewProps) {
  const { data: rawAnalysis, isLoading, isError } = useAnalysis(specId);
  const runAnalysis = useRunAnalysis();

  const analysis = rawAnalysis as unknown as AnalysisDto | undefined;
  const isEmpty = !isLoading && !analysis;

  if (isLoading)
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-glass-1 rounded-xl animate-pulse" />
        ))}
      </div>
    );

  if (isEmpty || isError) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <Brain className="w-10 h-10 text-text-muted mb-3" strokeWidth={1.4} />
        <p className="text-sm font-bold text-text-secondary">No AI analysis yet</p>
        <p className="text-xs text-text-muted mt-1 max-w-sm">
          Run AI analysis to get readiness score, identify gaps, and receive recommendations.
        </p>
        <button
          onClick={() => runAnalysis.mutate(specId)}
          disabled={runAnalysis.isPending}
          className="flex items-center gap-2 mt-4 px-5 py-3 rounded-lg bg-gradient-to-br from-brand to-brand-dark text-sm font-bold text-white hover:brightness-110 transition-all disabled:opacity-50"
        >
          {runAnalysis.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing your API...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4" strokeWidth={1.8} />
              Run AI Analysis
            </>
          )}
        </button>
      </div>
    );
  }

  if (analysis!.status === AnalysisStatus.InProgress) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <Loader2 className="w-8 h-8 text-brand animate-spin mb-3" />
        <p className="text-sm font-bold text-text-secondary">Analyzing your API...</p>
        <p className="text-xs text-text-muted mt-1">This may take a moment.</p>
      </div>
    );
  }

  const rawBreakdown = parseJson<ReadinessBreakdownItem[]>(analysis!.readinessBreakdownJson);
  const breakdown = Array.isArray(rawBreakdown) ? rawBreakdown : [];
  const rawGaps = parseJson<GapItem[]>(analysis!.gapsJson);
  const gaps = Array.isArray(rawGaps) ? rawGaps : [];
  const rawQuestions = parseJson<QuestionItem[]>(analysis!.questionsJson);
  const questions = Array.isArray(rawQuestions) ? rawQuestions : [];

  return (
    <div className="space-y-6">
      {/* Business context */}
      {analysis!.businessContextSummary && (
        <div className="bg-bg-card border border-border-subtle rounded-2xl p-5 ">
          <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-text-muted mb-2">
            Business Context
          </p>
          <p className="text-sm text-text-secondary leading-relaxed">{analysis!.businessContextSummary}</p>
        </div>
      )}

      {/* Readiness score + breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
        <div className="flex justify-center">
          <ReadinessGauge score={analysis!.readinessScore} size={160} />
        </div>
        <div className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-text-muted">
            Readiness Breakdown
          </p>
          {breakdown.map((item) => (
            <div key={item.category} className="flex items-center gap-3">
              <span className="text-xs font-semibold text-text-secondary w-36 truncate">{item.category}</span>
              <div className="flex-1 h-2 bg-glass-2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(item.score / item.maxScore) * 100}%`,
                    background:
                      item.score / item.maxScore >= 0.8
                        ? '#10B981'
                        : item.score / item.maxScore >= 0.5
                          ? '#F59E0B'
                          : '#F43F5E',
                  }}
                />
              </div>
              <span className="text-xs font-bold text-text-primary w-12 text-right">
                {item.score}/{item.maxScore}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Gaps */}
      {gaps.length > 0 && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-text-muted mb-3">
            Gaps Identified ({gaps.length})
          </p>
          <div className="space-y-2">
            {gaps.map((gap, i) => (
              <GapCard key={i} gap={gap} />
            ))}
          </div>
        </div>
      )}

      {/* Questions */}
      {questions.length > 0 && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-text-muted mb-3">
            Questions ({questions.length})
          </p>
          <div className="space-y-2">
            {questions.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                analysisId={analysis!.id}
                existingAnswer={analysis!.answers?.find((a) => a.questionId === q.id)?.answer}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── GapCard ───

const SEVERITY_STYLES: Record<string, { badge: string; border: string }> = {
  critical: { badge: 'bg-danger-soft text-danger', border: 'border-l-danger' },
  important: { badge: 'bg-warning-soft text-warning', border: 'border-l-warning' },
  minor: { badge: 'bg-info-soft text-info', border: 'border-l-info' },
};

function GapCard({ gap }: { gap: GapItem }) {
  const [open, setOpen] = useState(false);
  const s = SEVERITY_STYLES[gap.severity] || SEVERITY_STYLES.minor;
  return (
    <div
      className={`bg-bg-card border border-border-subtle ${s.border} border-l-4 rounded-xl overflow-hidden `}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-glass-1 transition-all text-left"
      >
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-text-muted flex-shrink-0" strokeWidth={1.6} />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-text-muted flex-shrink-0" strokeWidth={1.6} />
        )}
        <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide ${s.badge}`}>
          {gap.severity}
        </span>
        <span className="text-sm font-bold text-text-primary truncate">{gap.title}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2">
          <p className="text-xs text-text-secondary leading-relaxed">{gap.description}</p>
          {gap.suggestion && (
            <div className="bg-glass-1 rounded-lg p-3">
              <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-text-muted mb-1">
                Suggestion
              </p>
              <p className="text-xs text-text-secondary">{gap.suggestion}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── QuestionCard ───

function QuestionCard({
  question,
  analysisId,
  existingAnswer,
}: {
  question: QuestionItem;
  analysisId: string;
  existingAnswer?: string;
}) {
  const [answer, setAnswer] = useState(existingAnswer || '');
  const submit = useSubmitAnswers();

  const handleSubmit = () => {
    if (!answer.trim()) return;
    submit.mutate({ analysisId, answers: [{ questionId: question.id, answer }] });
  };

  return (
    <div className="bg-bg-card border border-border-subtle rounded-xl p-4 ">
      <div className="flex items-start gap-2 mb-2">
        <HelpCircle className="w-4 h-4 text-info flex-shrink-0 mt-0.5" strokeWidth={1.6} />
        <p className="text-sm font-semibold text-text-primary">{question.question}</p>
      </div>
      {question.context && <p className="text-xs text-text-muted mb-3 ml-6">{question.context}</p>}
      <div className="flex gap-2 ml-6">
        <input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer..."
          className="form-input flex-1"
          disabled={submit.isPending}
        />
        <button
          onClick={handleSubmit}
          disabled={submit.isPending || !answer.trim()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand text-xs font-bold text-white hover:brightness-110 transition-all disabled:opacity-50"
        >
          {submit.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" strokeWidth={1.8} />
          )}
          Submit
        </button>
      </div>
    </div>
  );
}
