import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Save, Plus, Loader2 } from 'lucide-react';
import { createIntentSchema, type CreateIntentFormData } from '../types/intents.schemas';
import { useCreateIntent, useUpdateIntent } from '../api/intents.queries';
import {
  IntentTrack, INTENT_TRACK_LABEL,
  IntentOperationType, OPERATION_TYPE_LABEL,
} from '../types/intents.types';
import type { IntentDto, IntentOperationTypeValue, IntentTrackValue } from '../types/intents.types';

interface IntentFormModalProps {
  open: boolean;
  onClose: () => void;
  tenantId: string;
  editIntent?: IntentDto | null;
  parentOptions: { id: string; name: string; level: number }[];
}

const TRACK_OPTIONS = Object.entries(IntentTrack).map(([, val]) => ({
  value: val,
  label: INTENT_TRACK_LABEL[val],
}));

const OPERATION_OPTIONS = Object.entries(IntentOperationType).map(([, val]) => ({
  value: val,
  label: OPERATION_TYPE_LABEL[val],
}));

const API_METHODS = ['GET', 'POST', 'PUT', 'DELETE'] as const;

export function IntentFormModal({
  open,
  onClose,
  tenantId,
  editIntent,
  parentOptions,
}: IntentFormModalProps) {
  const isEdit = !!editIntent;
  const createMutation = useCreateIntent();
  const updateMutation = useUpdateIntent();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<CreateIntentFormData>({
    resolver: zodResolver(createIntentSchema),
    defaultValues: {
      name: '',
      description: '',
      track: IntentTrack.Manual,
      operationType: IntentOperationType.ApiCall,
      parentIntentId: null,
      sortOrder: 0,
      keywords: '',
      patternsJson: '',
      confidenceThreshold: 0.5,
      apiEndpoint: '',
      apiMethod: 'GET',
      apiParametersJson: '',
      searchScope: '',
      staticResponseText: '',
      handoffTarget: '',
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (editIntent) {
      form.reset({
        name: editIntent.name,
        description: editIntent.description || '',
        track: editIntent.track,
        operationType: editIntent.operationType,
        parentIntentId: editIntent.parentIntentId || null,
        sortOrder: editIntent.sortOrder,
        keywords: editIntent.keywords || '',
        patternsJson: editIntent.patternsJson || '',
        confidenceThreshold: editIntent.confidenceThreshold,
        apiEndpoint: editIntent.apiEndpoint || '',
        apiMethod: editIntent.apiMethod || 'GET',
        apiParametersJson: editIntent.apiParametersJson || '',
        searchScope: editIntent.searchScope || '',
        staticResponseText: editIntent.staticResponseText || '',
        handoffTarget: editIntent.handoffTarget || '',
      });
    } else {
      form.reset({
        name: '',
        description: '',
        track: IntentTrack.Manual,
        operationType: IntentOperationType.ApiCall,
        parentIntentId: null,
        sortOrder: 0,
        keywords: '',
        patternsJson: '',
        confidenceThreshold: 0.5,
        apiEndpoint: '',
        apiMethod: 'GET',
        apiParametersJson: '',
        searchScope: '',
        staticResponseText: '',
        handoffTarget: '',
      });
    }
  }, [editIntent, form]);

  const watchedOp = form.watch('operationType') as IntentOperationTypeValue;

  const onSubmit = (data: CreateIntentFormData) => {
    const payload = {
      ...data,
      track: data.track as IntentTrackValue,
      operationType: data.operationType as IntentOperationTypeValue,
      parentIntentId: data.parentIntentId || null,
    };

    if (isEdit && editIntent) {
      updateMutation.mutate(
        { id: editIntent.id, data: payload },
        { onSuccess: () => onClose() },
      );
    } else {
      createMutation.mutate(
        { ...payload, tenantId },
        { onSuccess: () => onClose() },
      );
    }
  };

  if (!open) return null;

  const input =
    'w-full px-4 py-2.5 rounded-lg bg-glass-2 border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-all';
  const label = 'text-2xs font-bold uppercase tracking-[2px] text-text-muted block mb-2';
  const errorText = 'text-2xs text-danger mt-1';

  // Filter parent options: only intents with level < 4 (max 5 levels: 0-4)
  const availableParents = parentOptions.filter((p) => {
    if (isEdit && editIntent) return p.id !== editIntent.id && p.level < 4;
    return p.level < 4;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col" style={{ background: '#0A0F0D', border: '1.5px solid #1E2E26', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-b-border-subtle flex-shrink-0">
          <h2 className="text-lg font-extrabold text-text-primary tracking-tight">
            {isEdit ? 'Edit intent' : 'Create intent'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-glass-2 flex items-center justify-center text-text-muted hover:text-text-primary transition-all"
          >
            <X className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>

        {/* Form (scrollable) */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Name */}
          <div>
            <label className={label}>Name *</label>
            <input {...form.register('name')} placeholder="e.g. Track Order" className={input} />
            {form.formState.errors.name && <p className={errorText}>{form.formState.errors.name.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className={label}>Description</label>
            <textarea
              {...form.register('description')}
              placeholder="What does this intent do?"
              rows={2}
              className={`${input} resize-none`}
            />
          </div>

          {/* Track: visual pill selector */}
          <div>
            <label className={label}>Source track</label>
            <div className="flex gap-2">
              {TRACK_OPTIONS.map((opt) => {
                const isActive = form.watch('track') === opt.value;
                return (
                  <button key={opt.value} type="button"
                    onClick={() => form.setValue('track', opt.value)}
                    className="flex-1 text-center transition-all"
                    style={{
                      padding: '12px 8px', borderRadius: 12, cursor: 'pointer',
                      background: isActive ? 'rgba(0,217,126,0.06)' : '#111916',
                      border: isActive ? '2px solid rgba(0,217,126,0.2)' : '1.5px solid #1E2E26',
                    }}>
                    <div style={{ fontSize: 13, fontWeight: isActive ? 700 : 600, color: isActive ? '#00D97E' : '#8A9B91' }}>{opt.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Operation type: visual grid tiles */}
          <div>
            <label className={label}>Operation type *</label>
            <div className="grid grid-cols-4 gap-[5px]">
              {OPERATION_OPTIONS.map((opt) => {
                const isActive = form.watch('operationType') === opt.value;
                const opColor = ({1:'#3B82F6',2:'#10B981',3:'#00D97E',4:'#F59E0B',5:'#F43F5E',6:'#A78BFA',7:'#EC4899',8:'#3B82F6'} as Record<number,string>)[opt.value as number] || '#708A7E';
                return (
                  <button key={opt.value} type="button"
                    onClick={() => form.setValue('operationType', opt.value)}
                    className="text-center transition-all"
                    style={{
                      padding: '10px 6px', borderRadius: 10, cursor: 'pointer',
                      background: isActive ? `${opColor}0C` : '#111916',
                      border: isActive ? `2px solid ${opColor}30` : '1.5px solid #1E2E26',
                    }}>
                    <div style={{ fontSize: 11, fontWeight: isActive ? 700 : 500, color: isActive ? opColor : '#8A9B91' }}>{opt.label}</div>
                  </button>
                );
              })}
            </div>
            {form.formState.errors.operationType && (
              <p className={errorText}>{form.formState.errors.operationType.message}</p>
            )}
          </div>

          {/* Two columns: Parent + Sort Order */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Parent intent</label>
              <select {...form.register('parentIntentId')} className={input}>
                <option value="" className="bg-bg-card">
                  None (root level)
                </option>
                {availableParents.map((p) => (
                  <option key={p.id} value={p.id} className="bg-bg-card">
                    {'—'.repeat(p.level)} {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Sort order</label>
              <input
                type="number"
                {...form.register('sortOrder', { valueAsNumber: true })}
                className={input}
                min={0}
                max={999}
              />
            </div>
          </div>

          {/* Keywords */}
          <div>
            <label className={label}>Keywords <span className="opacity-40">(comma-separated)</span></label>
            <textarea
              {...form.register('keywords')}
              placeholder="track, order, delivery, shipping, status"
              rows={2}
              className={`${input} resize-none`}
            />
          </div>

          {/* Confidence Threshold */}
          <div>
            <label className={label}>
              Confidence threshold: {form.watch('confidenceThreshold')?.toFixed(2) ?? '0.50'}
            </label>
            <Controller
              control={form.control}
              name="confidenceThreshold"
              render={({ field }) => (
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={field.value ?? 0.5}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none bg-glass-3 accent-brand"
                />
              )}
            />
          </div>

          {/* ─── Operation-specific fields ─── */}
          <div className="border-t border-t-border-subtle pt-4">
            <div className="text-2xs font-bold uppercase tracking-[2px] text-brand mb-3">
              {OPERATION_TYPE_LABEL[watchedOp]} configuration
            </div>

            {/* ApiCall fields */}
            {watchedOp === IntentOperationType.ApiCall && (
              <div className="space-y-3">
                <div className="grid grid-cols-[1fr_120px] gap-3">
                  <div>
                    <label className={label}>API Endpoint</label>
                    <input
                      {...form.register('apiEndpoint')}
                      placeholder="GET /orders/{order_id}/status"
                      className={input}
                    />
                  </div>
                  <div>
                    <label className={label}>Method</label>
                    <select {...form.register('apiMethod')} className={input}>
                      {API_METHODS.map((m) => (
                        <option key={m} value={m} className="bg-bg-card">
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={label}>Parameters JSON</label>
                  <textarea
                    {...form.register('apiParametersJson')}
                    placeholder='{"order_id": "string"}'
                    rows={3}
                    className={`${input} resize-none font-mono text-2xs`}
                  />
                </div>
              </div>
            )}

            {/* StaticResponse fields */}
            {watchedOp === IntentOperationType.StaticResponse && (
              <div>
                <label className={label}>Response text</label>
                <textarea
                  {...form.register('staticResponseText')}
                  placeholder="The response your chatbot will send..."
                  rows={4}
                  className={`${input} resize-none`}
                />
              </div>
            )}

            {/* AgentHandoff fields */}
            {watchedOp === IntentOperationType.AgentHandoff && (
              <div>
                <label className={label}>Handoff target</label>
                <input
                  {...form.register('handoffTarget')}
                  placeholder="e.g. support-team, billing-dept"
                  className={input}
                />
              </div>
            )}

            {/* ProductSearch / CategoryBrowse fields */}
            {(watchedOp === IntentOperationType.ProductSearch ||
              watchedOp === IntentOperationType.CategoryBrowse) && (
              <div>
                <label className={label}>Search scope</label>
                <input
                  {...form.register('searchScope')}
                  placeholder="e.g. electronics, all, category:phones"
                  className={input}
                />
              </div>
            )}

            {/* MenuNavigation - no extra fields */}
            {watchedOp === IntentOperationType.MenuNavigation && (
              <p className="text-xs text-text-muted">
                Menu items are defined by child intents. Create children after saving this intent.
              </p>
            )}

            {/* DomainConversation / OutboundAction - no extra fields */}
            {(watchedOp === IntentOperationType.DomainConversation ||
              watchedOp === IntentOperationType.OutboundAction) && (
              <p className="text-xs text-text-muted">
                No additional configuration needed. The conversation engine handles this automatically.
              </p>
            )}
          </div>

          {/* Patterns (advanced) */}
          <details className="group">
            <summary className="text-xs font-bold text-text-muted cursor-pointer hover:text-text-secondary transition-colors">
              Advanced: Regex patterns (JSON array)
            </summary>
            <div className="mt-2">
              <textarea
                {...form.register('patternsJson')}
                placeholder='["order\\s*(ORD-\\d+)"]'
                rows={2}
                className={`${input} resize-none font-mono text-2xs`}
              />
            </div>
          </details>

          {/* Error */}
          {(createMutation.isError || updateMutation.isError) && (
            <div className="px-4 py-3 rounded-lg bg-danger-soft border border-[rgba(244,63,94,0.15)] text-sm text-danger">
              {createMutation.error?.message || updateMutation.error?.message || 'Operation failed.'}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg bg-glass-2 border border-border-medium text-sm font-semibold text-text-secondary hover:text-text-primary transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-br from-brand to-brand-dark text-sm font-bold text-white hover:brightness-110 disabled:opacity-50 transition-all"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isEdit ? (
                <Save className="w-4 h-4" strokeWidth={2} />
              ) : (
                <Plus className="w-4 h-4" strokeWidth={2} />
              )}
              {isPending ? 'Saving...' : isEdit ? 'Update intent' : 'Create intent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
