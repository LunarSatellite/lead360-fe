import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Step3Props {
  onComplete: () => void;
}

export function Step3SyncCatalog({ onComplete }: Step3Props) {
  const navigate = useNavigate();

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-6">
        <div className="text-3xl mb-2">📦</div>
        <h2 className="text-lg font-bold text-text-primary">Sync Your Catalog</h2>
        <p className="text-sm text-text-muted mt-1">
          Connect your product catalog so customers can browse and search.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/dashboard/catalog')}
          className="p-6 rounded-xl border border-border-subtle hover:border-brand hover:bg-brand-soft/30 transition-all text-center"
        >
          <div className="text-2xl mb-2">⚙️</div>
          <div className="text-xs font-semibold text-text-primary">Configure Sync</div>
          <div className="text-[10px] text-text-muted mt-0.5">Set up catalog sync settings</div>
        </button>

        <button
          onClick={onComplete}
          className="p-6 rounded-xl border border-border-subtle hover:border-brand hover:bg-brand-soft/30 transition-all text-center"
        >
          <div className="text-2xl mb-2">⏩</div>
          <div className="text-xs font-semibold text-text-primary">Skip for Now</div>
          <div className="text-[10px] text-text-muted mt-0.5">You can set this up later</div>
        </button>
      </div>
    </div>
  );
}
