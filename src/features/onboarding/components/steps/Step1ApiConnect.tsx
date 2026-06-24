import { useApiSpecs } from '@/features/api-connection/api/api-connection.queries';
import { SpecUploadZone } from '@/features/api-connection/components/SpecUploadZone';
import { Check } from 'lucide-react';

interface Step1Props {
  onComplete: () => void;
}

export function Step1ApiConnect({ onComplete }: Step1Props) {
  const { data: specs } = useApiSpecs();
  const specList = (specs as unknown as unknown[]) ?? [];
  const hasSpecs = specList.length > 0;

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-6">
        <div className="text-3xl mb-2">🔌</div>
        <h2 className="text-lg font-bold text-text-primary">Connect Your API</h2>
        <p className="text-sm text-text-muted mt-1">Upload your OpenAPI/Swagger spec so OmniFlow can understand your business endpoints.</p>
      </div>

      {hasSpecs ? (
        <div className="p-6 rounded-xl bg-brand-soft border border-brand/20 text-center">
          <Check className="w-8 h-8 text-brand mx-auto mb-2" />
          <p className="text-sm font-semibold text-brand">{specList.length} API spec(s) connected!</p>
          <button
            onClick={onComplete}
            className="mt-4 px-6 py-2.5 rounded-lg text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}
          >
            Continue →
          </button>
        </div>
      ) : (
        <>
          <SpecUploadZone />
          <p className="text-2xs text-text-muted text-center mt-3">
            After uploading, OmniFlow will analyze your API and suggest intents.
          </p>
        </>
      )}
    </div>
  );
}
