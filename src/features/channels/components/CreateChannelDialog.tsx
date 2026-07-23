import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Plus, Loader2 } from 'lucide-react';
import { createChannelSchema, type CreateChannelFormData } from '../types/channels.schemas';
import { useCreateChannel } from '../api/channels.queries';
import { ChannelType, CHANNEL_TYPE_LABEL, CHANNEL_TYPE_COLOR } from '../types/channels.types';

interface CreateChannelDialogProps {
  tenantId: string;
  open: boolean;
  onClose: () => void;
}

const CHANNEL_OPTIONS = Object.entries(ChannelType).map(([, val]) => ({
  value: val,
  label: CHANNEL_TYPE_LABEL[val],
  color: CHANNEL_TYPE_COLOR[val],
}));

const IDENTIFIER_HINTS: Record<number, string> = {
  [ChannelType.WhatsApp]: 'Phone Number ID from Meta Business',
  [ChannelType.Messenger]: 'Facebook Page ID',
  [ChannelType.Instagram]: 'Instagram Business Account ID',
  [ChannelType.Telegram]: 'Bot token from @BotFather',
  [ChannelType.SMS]: 'Twilio phone number (+254...)',
  [ChannelType.Voice]: 'Voice provider number',
  [ChannelType.WebChat]: 'Your website domain',
  [ChannelType.Email]: 'Support email address',
};

export function CreateChannelDialog({ tenantId, open, onClose }: CreateChannelDialogProps) {
  const create = useCreateChannel();
  const form = useForm<CreateChannelFormData>({
    resolver: zodResolver(createChannelSchema),
    defaultValues: {
      channelType: ChannelType.WhatsApp,
      channelIdentifier: '',
      displayName: '',
      configurationJson: '',
    },
  });

  const watchedType = form.watch('channelType');

  const onSubmit = (data: CreateChannelFormData) => {
    create.mutate(
      {
        tenantId,
        channelType: data.channelType as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
        channelIdentifier: data.channelIdentifier,
        displayName: data.displayName || undefined,
        configurationJson: data.configurationJson || undefined,
      },
      {
        onSuccess: () => {
          form.reset();
          onClose();
        },
      },
    );
  };

  if (!open) return null;

  const inputClass =
    'w-full px-3.5 py-2 rounded-xl bg-transparent border text-sm text-text-primary placeholder:text-text-muted focus:outline-none transition-all';
  const labelClass = 'block text-xs font-semibold text-text-secondary mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end pr-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="drawer-slide-in relative w-[640px] flex flex-col overflow-hidden"
        style={{
          borderRadius: 18,
          background: 'var(--bg-card)',
          border: '1px solid rgba(0,217,138,0.2)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 24px rgba(0,217,138,0.25), inset 0 1px 0 rgba(0,255,163,0.05)',
          maxHeight: 'calc(100vh - 32px)',
        }}
      >
        {/* Accent bar */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #00D98A 35%, #00FFA3 65%, transparent)', flexShrink: 0 }} />

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-border-subtle">
          <div>
            <h2
              className="text-base font-extrabold leading-tight"
              style={{
                background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Add channel connection
            </h2>
            <p className="text-xs text-text-muted mt-0.5">Connect a new channel to start receiving messages</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary mt-0.5">
            <X className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Channel type */}
          <div>
            <label className={labelClass}>Channel type</label>
            <div className="grid grid-cols-4 gap-2">
              {CHANNEL_OPTIONS.map((opt) => {
                const isSelected = watchedType === opt.value;
                const colorMap: Record<string, string> = {
                  success: 'border-[rgba(6,214,160,0.3)] bg-success-soft text-success',
                  info: 'border-[rgba(59,130,246,0.3)] bg-info-soft text-info',
                  brand: 'border-brand bg-brand-soft text-brand',
                  warning: 'border-[rgba(245,158,11,0.3)] bg-warning-soft text-warning',
                  danger: 'border-[rgba(244,63,94,0.3)] bg-danger-soft text-danger',
                  muted: 'border-border-medium bg-glass-2 text-text-secondary',
                };
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => form.setValue('channelType', opt.value)}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-bold text-center transition-all duration-150 ${
                      isSelected
                        ? colorMap[opt.color]
                        : 'border-border-subtle bg-glass-1 text-text-muted hover:border-border-medium hover:text-text-secondary'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Channel identifier */}
          <div>
            <label className={labelClass}>Channel identifier</label>
            <input
              {...form.register('channelIdentifier')}
              placeholder={IDENTIFIER_HINTS[watchedType] ?? 'Unique channel identifier'}
              className={inputClass}
              style={{
                backgroundColor: '#1A2F27',
                backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)',
                borderColor: 'rgba(0,217,138,0.20)',
              }}
            />
            {form.formState.errors.channelIdentifier && (
              <p className="text-xs text-danger mt-1.5">{form.formState.errors.channelIdentifier.message}</p>
            )}
          </div>

          {/* Display name */}
          <div>
            <label className={labelClass}>
              Display name <span className="opacity-40">(optional)</span>
            </label>
            <input
              {...form.register('displayName')}
              placeholder="e.g. Main WhatsApp, Support SMS"
              className={inputClass}
              style={{
                backgroundColor: '#1A2F27',
                backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)',
                borderColor: 'rgba(0,217,138,0.20)',
              }}
            />
          </div>

          {/* Configuration JSON (advanced, collapsible) */}
          <details className="group">
            <summary className="text-xs font-semibold text-text-secondary cursor-pointer hover:text-text-primary transition-colors">
              Advanced configuration (JSON)
            </summary>
            <div className="mt-2">
              <textarea
                {...form.register('configurationJson')}
                placeholder='{"accessToken": "...", "verifyToken": "..."}'
                rows={3}
                className={`${inputClass} resize-none font-mono text-xs`}
                style={{
                  backgroundColor: '#1A2F27',
                  backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)',
                  borderColor: 'rgba(0,217,138,0.20)',
                }}
              />
            </div>
          </details>

          {/* Error */}
          {create.isError && (
            <div className="px-3.5 py-3 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-danger"
              style={{ background: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}>
              {create.error?.message || 'Failed to create channel.'}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary border border-border-subtle hover:border-border-medium transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {create.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
              )}
              {create.isPending ? 'Creating...' : 'Create connection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
