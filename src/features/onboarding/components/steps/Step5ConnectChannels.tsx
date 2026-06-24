import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Step5Props {
  onComplete: () => void;
}

const CHANNELS = [
  { name: 'WhatsApp', icon: '💬', color: '#25D366' },
  { name: 'Telegram', icon: '✈️', color: '#0088cc' },
  { name: 'SMS', icon: '📱', color: '#FF6B6B' },
  { name: 'WebChat', icon: '🌐', color: '#3B82F6' },
];

export function Step5ConnectChannels({ onComplete }: Step5Props) {
  const navigate = useNavigate();

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-6">
        <div className="text-3xl mb-2">📱</div>
        <h2 className="text-lg font-bold text-text-primary">Connect Channels</h2>
        <p className="text-sm text-text-muted mt-1">
          Choose which messaging platforms your bot should be available on.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {CHANNELS.map((ch) => (
          <button
            key={ch.name}
            onClick={() => navigate('/dashboard/channels')}
            className="p-4 rounded-xl border border-border-subtle hover:border-brand hover:bg-brand-soft/30 transition-all text-center group"
          >
            <div className="text-2xl mb-2">{ch.icon}</div>
            <div className="text-xs font-semibold text-text-primary">{ch.name}</div>
            <div className="text-[10px] text-brand opacity-0 group-hover:opacity-100 transition-opacity mt-1">Configure →</div>
          </button>
        ))}
      </div>

      <div className="text-center">
        <button
          onClick={onComplete}
          className="px-6 py-2.5 rounded-lg text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
