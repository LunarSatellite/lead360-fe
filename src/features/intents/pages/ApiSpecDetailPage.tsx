import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useApiSpecDetail } from '../api/api-specs.queries';
import { ApiSpecDetailPanel } from '../components/ApiSpecDetailPanel';
import type { ApiSpecificationDetailDto } from '../types/api-specs.types';

export function Component() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: rawSpec, isLoading, error } = useApiSpecDetail(id);
  const spec = rawSpec as unknown as ApiSpecificationDetailDto | undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-brand animate-spin" />
      </div>
    );
  }

  if (error || !spec) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-xl bg-danger-soft flex items-center justify-center mb-4">
          <AlertCircle className="w-7 h-7 text-danger" strokeWidth={1.6} />
        </div>
        <p className="text-base font-bold text-text-secondary">Spec not found</p>
        <p className="text-sm text-text-muted mt-1">
          The API specification you're looking for doesn't exist or has been deleted.
        </p>
        <button
          onClick={() => navigate('/dashboard/api-specs')}
          className="flex items-center gap-2 mt-4 px-4 py-2.5 rounded-lg bg-glass-2 border border-border-medium text-sm font-semibold text-text-secondary hover:text-text-primary transition-all"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.6} />
          Back to API Specs
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-text-muted">
        <button
          onClick={() => navigate('/dashboard/api-specs')}
          className="hover:text-text-primary transition-all font-semibold"
        >
          API Specs
        </button>
        <ChevronRight className="w-3 h-3" strokeWidth={1.6} />
        <span className="text-text-secondary font-semibold truncate max-w-[300px]">
          {spec.name}
        </span>
      </div>

      {/* Detail panel */}
      <ApiSpecDetailPanel
        spec={spec}
        onDeleted={() => navigate('/dashboard/api-specs')}
      />
    </div>
  );
}
