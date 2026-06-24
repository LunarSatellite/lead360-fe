import { useState, useId } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import type {
  InputCardVariant,
  FreeTextCard,
  RadioCard,
  DropdownCard,
  MultiSelectCard,
  SliderCard,
  DateCard,
  ButtonRowCard,
} from '../../types/chat.types';

interface ControlProps<T> {
  card: T;
  onSubmit: (value: string, displayText?: string) => void;
  consumed: boolean;
}

export function InputCard({
  card,
  onSubmit,
  consumed,
}: {
  card: InputCardVariant;
  onSubmit: (value: string, displayText?: string) => void;
  consumed: boolean;
}) {
  switch (card.type) {
    case 'FreeText':
      return <FreeTextControl card={card} onSubmit={onSubmit} consumed={consumed} />;
    case 'Radio':
      return <RadioControl card={card} onSubmit={onSubmit} consumed={consumed} />;
    case 'Dropdown':
      return <DropdownControl card={card} onSubmit={onSubmit} consumed={consumed} />;
    case 'MultiSelect':
      return <MultiSelectControl card={card} onSubmit={onSubmit} consumed={consumed} />;
    case 'Slider':
      return <SliderControl card={card} onSubmit={onSubmit} consumed={consumed} />;
    case 'Date':
      return <DateControl card={card} onSubmit={onSubmit} consumed={consumed} />;
    case 'ButtonRow':
      return <ButtonRowControl card={card} onSubmit={onSubmit} consumed={consumed} />;
  }
}

/* ─── FreeText ──────────────────────────────────────────────────── */

function FreeTextControl({ card, onSubmit, consumed }: ControlProps<FreeTextCard>) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isMultiline = card.multiline === true;

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError('Please enter a response.');
      return;
    }
    setError(null);
    onSubmit(trimmed);
  };

  const consumedClass = consumed ? 'opacity-50 pointer-events-none select-none' : '';

  const sharedInputClass =
  'w-full bg-bg-input border border-border-subtle rounded-sm text-sm text-text-primary ' +
  'placeholder:text-text-muted focus:border-border-glow focus:bg-glass-1 outline-none transition-all px-3.5';
  return (
    <div className={`space-y-2.5 ${consumedClass}`}>
      {isMultiline ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSubmit();
          }}
          placeholder={card.placeholder}
          maxLength={card.maxLength}
          disabled={consumed}
          className={`${sharedInputClass} py-2.5 resize-none leading-relaxed min-h-[80px]`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
          placeholder={card.placeholder}
          maxLength={card.maxLength}
          disabled={consumed}
          className={`${sharedInputClass} py-2.5 leading-normal`}
        />
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {error && <p className="text-[11px] text-[#F43F5E]">{error}</p>}
          {card.maxLength && (
            <p className="text-[11px] text-text-muted">
              {value.length}/{card.maxLength}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={consumed}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-sm bg-brand text-bg text-xs font-bold hover:bg-brand-light disabled:opacity-30 transition-all"
        >
          <Check className="w-3.5 h-3.5" strokeWidth={2.2} />
          Submit
        </button>
      </div>
      {isMultiline && !consumed && <p className="text-[10px] text-text-muted">Cmd/Ctrl + Enter to submit</p>}
    </div>
  );
}

/* ─── Radio ─────────────────────────────────────────────────────── */

function RadioControl({ card, onSubmit, consumed }: ControlProps<RadioCard>) {
  const [selected, setSelected] = useState('');
  const [otherText, setOtherText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const groupName = useId();

  const pick = (value: string) => {
    setSelected(value);
    setError(null);
  };

  const handleSubmit = () => {
    if (!selected) {
      setError('Please select an option to continue.');
      return;
    }
    if (selected === '__other__') {
      if (!otherText.trim()) {
        setError('Please describe your answer.');
        return;
      }
      onSubmit(`Other: ${otherText.trim()}`);
      return;
    }
    const selectedLabel = card.options.find((o) => o.value === selected)?.label;
    onSubmit(selected, selectedLabel);
  };

  return (
    <div
      className={
        'bg-bg-elevated border border-border-medium rounded-card p-3.5 flex flex-col gap-2.5' +
        (consumed ? ' opacity-50 pointer-events-none select-none' : '')
      }
    >
      <fieldset>
        <legend className="sr-only">Select an option</legend>
        <div className="flex flex-col gap-1.5">
          {card.options.map((opt) => (
            <label
              key={opt.value}
              className={
                'flex items-start gap-3 px-3 py-2.5 rounded-sm cursor-pointer transition-colors ' +
                (selected === opt.value
                  ? 'bg-brand-soft border-thin border-border-glow'
                  : 'bg-glass-1 border border-border-medium hover:bg-glass-2 hover:border-border-glow')
              }
            >
              <input
                type="radio"
                name={groupName}
                value={opt.value}
                checked={selected === opt.value}
                onChange={() => pick(opt.value)}
                className="sr-only"
              />
              <span
                className={
                  'mt-0.5 w-3.5 h-3.5 rounded-full border-thin shrink-0 flex items-center justify-center ' +
                  (selected === opt.value ? 'border-brand bg-brand' : 'border-border-medium bg-transparent')
                }
              >
                {selected === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-bg" />}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-text-primary leading-tight">{opt.label}</div>
                {opt.description && (
                  <div className="text-xs text-text-secondary mt-0.5 leading-relaxed">{opt.description}</div>
                )}
              </div>
            </label>
          ))}

          {card.allowOther && (
            <>
              <label
                className={
                  'flex items-center gap-3 px-3 py-2.5 rounded-sm cursor-pointer transition-colors ' +
                  (selected === '__other__'
                    ? 'bg-brand-soft border-thin border-border-glow'
                    : 'bg-glass-1 border border-border-medium hover:bg-glass-2 hover:border-border-glow')
                }
              >
                <input
                  type="radio"
                  name={groupName}
                  value="__other__"
                  checked={selected === '__other__'}
                  onChange={() => pick('__other__')}
                  className="sr-only"
                />
                <span
                  className={
                    'w-3.5 h-3.5 rounded-full border-thin shrink-0 flex items-center justify-center ' +
                    (selected === '__other__'
                      ? 'border-brand bg-brand'
                      : 'border-border-medium bg-transparent')
                  }
                >
                  {selected === '__other__' && <span className="w-1.5 h-1.5 rounded-full bg-bg" />}
                </span>
                <span className="text-sm font-semibold text-text-secondary">Other…</span>
              </label>

              {selected === '__other__' && (
                <input
                  type="text"
                  value={otherText}
                  onChange={(e) => {
                    setOtherText(e.target.value);
                    setError(null);
                  }}
                  placeholder="Describe your answer…"
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-sm bg-bg-input border-thin border-border-subtle text-text-primary placeholder:text-text-muted focus:border-border-glow focus:bg-glass-1 outline-none transition-all text-sm"
                />
              )}
            </>
          )}
        </div>
      </fieldset>

      {error && (
        <p className="text-xs px-0.5" style={{ color: '#F43F5E' }}>
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        className="self-end px-4 py-2 rounded-sm bg-brand text-bg text-xs font-bold hover:bg-brand-light transition-all"
      >
        Submit
      </button>
    </div>
  );
}

/* ─── Dropdown ───────────────────────────────────────────────────── */

function DropdownControl({ card, onSubmit, consumed }: ControlProps<DropdownCard>) {
  const [selected, setSelected] = useState('');
  const [otherText, setOtherText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const labelId = useId();

  const handleSubmit = () => {
    if (!selected) {
      setError('Please select an option to continue.');
      return;
    }
    if (selected === '__other__') {
      if (!otherText.trim()) {
        setError('Please describe your answer.');
        return;
      }
      onSubmit(`Other: ${otherText.trim()}`);
      return;
    }
    const selectedLabel = card.options.find((o) => o.value === selected)?.label;
    onSubmit(selected, selectedLabel);
  };

  return (
    <div
      className={
        'bg-bg-elevated border border-border-medium rounded-card p-3.5 flex flex-col gap-2.5' +
        (consumed ? ' opacity-50 pointer-events-none select-none' : '')
      }
    >
      <div>
        <span id={labelId} className="sr-only">
          Select an option
        </span>
        <div className="relative">
          <select
            aria-labelledby={labelId}
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value);
              setError(null);
            }}
            className="w-full px-3.5 py-2.5 rounded-sm bg-bg-input border-thin border-border-subtle text-text-primary focus:border-border-glow focus:bg-glass-1 outline-none appearance-none cursor-pointer text-sm transition-all"
          >
            <option value="" disabled className="bg-bg-elevated text-text-muted">
              {card.placeholder ?? 'Select an option…'}
            </option>
            {card.options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-bg-elevated text-text-primary">
                {opt.label}
              </option>
            ))}
            {card.allowOther && (
              <option value="__other__" className="bg-bg-elevated text-text-primary">
                Other…
              </option>
            )}
          </select>
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
            strokeWidth={1.6}
          />
        </div>

        {selected === '__other__' && (
          <input
            type="text"
            value={otherText}
            onChange={(e) => {
              setOtherText(e.target.value);
              setError(null);
            }}
            placeholder="Describe your answer…"
            autoFocus
            className="mt-2 w-full px-3.5 py-2.5 rounded-sm bg-bg-input border-thin border-border-subtle text-text-primary placeholder:text-text-muted focus:border-border-glow focus:bg-glass-1 outline-none transition-all text-sm"
          />
        )}
      </div>

      {error && (
        <p className="text-xs px-0.5" style={{ color: '#F43F5E' }}>
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        className="self-end px-4 py-2 rounded-sm bg-brand text-bg text-xs font-bold hover:bg-brand-light transition-all"
      >
        Submit
      </button>
    </div>
  );
}

/* ─── MultiSelect ────────────────────────────────────────────────── */

function MultiSelectControl({ card, onSubmit, consumed }: ControlProps<MultiSelectCard>) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [otherText, setOtherText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const groupName = useId();

  const min = card.minSelections ?? 1;
  const max = card.maxSelections ?? card.options.length + (card.allowOther ? 1 : 0);
  const count = selected.size;

  const toggle = (value: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
    setError(null);
  };

  const handleSubmit = () => {
    if (count < min) {
      setError(`Select at least ${min} option${min !== 1 ? 's' : ''}.`);
      return;
    }
    if (count > max) {
      setError(`Select no more than ${max} option${max !== 1 ? 's' : ''}.`);
      return;
    }
    const values = Array.from(selected);
    const labels = values.map((v) => {
      if (v === '__other__') return otherText.trim() || 'Other';
      return card.options.find((o) => o.value === v)?.label ?? v;
    });
    onSubmit(values.map((v) => v === '__other__' ? (otherText.trim() || 'Other') : v).join(', '), labels.join(', '));
  };

  const counterText = min === max ? `Pick exactly ${min}` : `Pick ${min}–${max} · you've picked ${count}`;

  return (
    <div
      className={
        'bg-bg-elevated border border-border-medium rounded-card p-3.5 flex flex-col gap-2.5' +
        (consumed ? ' opacity-50 pointer-events-none select-none' : '')
      }
    >
      <fieldset>
        <legend className="sr-only">Select options</legend>
        <div className="flex flex-col gap-1.5">
          {card.options.map((opt) => {
            const checked = selected.has(opt.value);
            const atMax = count >= max && !checked;
            return (
              <label
                key={opt.value}
                className={
                  'flex items-start gap-3 px-3 py-2.5 rounded-sm transition-colors ' +
                  (atMax
                    ? 'opacity-40 cursor-not-allowed bg-glass-1 border border-border-medium'
                    : checked
                      ? 'bg-brand-soft border-thin border-border-glow cursor-pointer'
                      : 'bg-glass-1 border border-border-medium hover:bg-glass-2 hover:border-border-glow cursor-pointer')
                }
              >
                <input
                  type="checkbox"
                  name={groupName}
                  value={opt.value}
                  checked={checked}
                  disabled={atMax}
                  onChange={() => toggle(opt.value)}
                  className="sr-only"
                />
                <span
                  className={
                    'mt-0.5 w-3.5 h-3.5 rounded-xs border-thin shrink-0 flex items-center justify-center ' +
                    (checked ? 'border-brand bg-brand' : 'border-border-medium bg-transparent')
                  }
                >
                  {checked && <Check className="w-2.5 h-2.5 text-bg" strokeWidth={2.5} />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-text-primary leading-tight">{opt.label}</div>
                  {opt.description && (
                    <div className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                      {opt.description}
                    </div>
                  )}
                </div>
              </label>
            );
          })}

          {card.allowOther && (
            <>
              <label
                className={
                  'flex items-center gap-3 px-3 py-2.5 rounded-sm transition-colors cursor-pointer ' +
                  (selected.has('__other__')
                    ? 'bg-brand-soft border-thin border-border-glow'
                    : 'bg-glass-1 border border-border-medium hover:bg-glass-2 hover:border-border-glow')
                }
              >
                <input
                  type="checkbox"
                  name={groupName}
                  value="__other__"
                  checked={selected.has('__other__')}
                  onChange={() => toggle('__other__')}
                  className="sr-only"
                />
                <span
                  className={
                    'w-3.5 h-3.5 rounded-xs border-thin shrink-0 flex items-center justify-center ' +
                    (selected.has('__other__') ? 'border-brand bg-brand' : 'border-border-medium bg-transparent')
                  }
                >
                  {selected.has('__other__') && <Check className="w-2.5 h-2.5 text-bg" strokeWidth={2.5} />}
                </span>
                <span className="text-sm font-semibold text-text-secondary">Other…</span>
              </label>

              {selected.has('__other__') && (
                <input
                  type="text"
                  value={otherText}
                  onChange={(e) => { setOtherText(e.target.value); setError(null); }}
                  placeholder="Describe your answer…"
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-sm bg-glass-1 border border-border-medium text-text-primary placeholder:text-text-muted focus:border-border-glow outline-none transition-all text-sm"
                />
              )}
            </>
          )}
        </div>
      </fieldset>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs text-text-muted">{counterText}</span>
        {error && (
          <span className="text-xs" style={{ color: '#F43F5E' }}>
            {error}
          </span>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          className="px-4 py-2 rounded-sm bg-brand text-bg text-xs font-bold hover:bg-brand-light transition-all"
        >
          Submit
        </button>
      </div>
    </div>
  );
}

/* ─── Slider ─────────────────────────────────────────────────────── */

function SliderControl({ card, onSubmit, consumed }: ControlProps<SliderCard>) {
  const [value, setValue] = useState(card.min);
  const [inputStr, setInputStr] = useState(String(card.min));
  const sliderId = useId();

  const clamp = (v: number) => Math.min(card.max, Math.max(card.min, Math.round(v / card.step) * card.step));

  const applyValue = (raw: number) => {
    const clamped = clamp(raw);
    setValue(clamped);
    setInputStr(String(clamped));
  };

  const percent = ((value - card.min) / (card.max - card.min)) * 100;

  const handleSubmit = () => {
    onSubmit(card.unit ? `${value} ${card.unit}` : String(value));
  };

  return (
    <div
      className={
        'bg-bg-elevated border border-border-medium rounded-card p-3.5 flex flex-col gap-3' +
        (consumed ? ' opacity-50 pointer-events-none select-none' : '')
      }
    >
      <div className="flex items-center gap-3">
        <input
          id={sliderId}
          type="range"
          min={card.min}
          max={card.max}
          step={card.step}
          value={value}
          onChange={(e) => applyValue(Number(e.target.value))}
          aria-label={
            card.unit
              ? `Value in ${card.unit}, ${card.min} to ${card.max}`
              : `Value, ${card.min} to ${card.max}`
          }
          aria-valuemin={card.min}
          aria-valuemax={card.max}
          aria-valuenow={value}
          aria-valuetext={card.unit ? `${value} ${card.unit}` : String(value)}
          className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand [&::-webkit-slider-thumb]:cursor-pointer [&:focus::-webkit-slider-thumb]:ring-2 [&:focus::-webkit-slider-thumb]:ring-brand [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-brand [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
          style={{
            background: `linear-gradient(to right, #00D97E ${percent}%, #253D32 ${percent}%)`,
          }}
        />
        <div className="flex items-center gap-1.5 shrink-0">
          <input
            type="number"
            min={card.min}
            max={card.max}
            step={card.step}
            value={inputStr}
            onChange={(e) => {
              setInputStr(e.target.value);
              const n = Number(e.target.value);
              if (!isNaN(n)) setValue(clamp(n));
            }}
            onBlur={() => applyValue(value)}
            aria-label={card.unit ? `Enter value in ${card.unit}` : 'Enter value'}
            className="w-16 px-2 py-1.5 rounded-sm bg-bg-input border-thin border-border-subtle text-text-primary text-sm text-center focus:border-border-glow focus:bg-glass-1 outline-none transition-all"
          />
          {card.unit && <span className="text-xs font-semibold text-text-secondary">{card.unit}</span>}
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-text-muted">
        <span>
          {card.min}
          {card.unit ? ` ${card.unit}` : ''}
        </span>
        <span>
          {card.max}
          {card.unit ? ` ${card.unit}` : ''}
        </span>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        className="self-end px-4 py-2 rounded-sm bg-brand text-bg text-xs font-bold hover:bg-brand-light transition-all"
      >
        Submit
      </button>
    </div>
  );
}

/* ─── Date ───────────────────────────────────────────────────────── */

function DateControl({ card, onSubmit, consumed }: ControlProps<DateCard>) {
  const [selectedDate, setSelectedDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();

  const handleSubmit = () => {
    if (!selectedDate) {
      setError('Please select a date.');
      return;
    }
    onSubmit(selectedDate);
  };

  return (
    <div
      className={
        'bg-bg-elevated border border-border-medium rounded-card p-3.5 flex flex-col gap-2.5' +
        (consumed ? ' opacity-50 pointer-events-none select-none' : '')
      }
    >
      <label htmlFor={inputId} className="sr-only">
        Select a date
      </label>
      <input
        id={inputId}
        type="date"
        min={card.minDate}
        max={card.maxDate}
        value={selectedDate}
        onChange={(e) => {
          setSelectedDate(e.target.value);
          setError(null);
        }}
        className="w-full px-3.5 py-2.5 rounded-sm bg-bg-input border-thin border-border-subtle text-text-primary focus:border-border-glow focus:bg-glass-1 outline-none transition-all text-sm [color-scheme:dark]"
      />

      {error && (
        <p className="text-xs px-0.5" style={{ color: '#F43F5E' }}>
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        className="self-end px-4 py-2 rounded-sm bg-brand text-bg text-xs font-bold hover:bg-brand-light transition-all"
      >
        Submit
      </button>
    </div>
  );
}

/* ─── ButtonRow ──────────────────────────────────────────────────── */

function buttonRowClass(style: string): string {
  switch (style) {
    case 'primary':
      return 'bg-brand text-bg hover:bg-brand-light';
    case 'secondary':
      return 'bg-glass-2 border-thin border-border-medium text-text-primary hover:bg-glass-3';
    case 'ghost':
      return 'border-thin border-border-medium text-text-secondary hover:text-text-primary hover:bg-glass-2';
    case 'danger':
      return 'bg-[rgba(244,63,94,0.06)] text-[#F43F5E] hover:bg-[rgba(244,63,94,0.15)]';
    default:
      return 'bg-glass-2 border-thin border-border-medium text-text-primary hover:bg-glass-3';
  }
}

function ButtonRowControl({ card, onSubmit, consumed }: ControlProps<ButtonRowCard>) {
  return (
    <div className={'flex flex-wrap gap-2' + (consumed ? ' opacity-50 pointer-events-none select-none' : '')}>
      {card.buttons.map((btn) => (
        <button
          key={btn.value}
          type="button"
          onClick={() => onSubmit(btn.value, btn.label)}
          className={
            'flex-1 px-4 py-2 rounded-sm text-sm font-bold transition-all ' + buttonRowClass(btn.style)
          }
          style={
            btn.style === 'danger'
              ? { borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'rgba(244,63,94,0.35)' }
              : undefined
          }
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}
