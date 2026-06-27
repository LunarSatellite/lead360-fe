import { useState } from 'react';
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

const CHANNEL_OPTIONS = Object.entries(ChannelType).map(([key, val]) => ({
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
        tenantId: tenantId || undefined,
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

  const input =
    'w-full px-4 py-2.5 rounded-lg bg-glass-2 border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-all';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="drawer-slide-in relative w-[480px] h-full flex flex-col bg-bg-shell border-l border-thin border-border-subtle" style={{ boxShadow: '-8px 0 40px rgba(0,0,0,0.5)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-b-border-subtle">
          <h2 className="text-lg font-extrabold text-text-primary tracking-tight">Add channel connection</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-glass-2 flex items-center justify-center text-text-muted hover:text-text-primary transition-all"
          >
            <X className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Channel type */}
          <div>
            <label className="text-xs font-bold uppercase tracking-[2px] text-text-muted block mb-2">
              Channel type
            </label>
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
                    className={`px-3 py-2.5 rounded-lg border text-xs font-bold text-center transition-all duration-150 ${
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
            <label className="text-xs font-bold uppercase tracking-[2px] text-text-muted block mb-2">
              Channel identifier
            </label>
            <input
              {...form.register('channelIdentifier')}
              placeholder={IDENTIFIER_HINTS[watchedType] ?? 'Unique channel identifier'}
              className={input}
            />
            {form.formState.errors.channelIdentifier && (
              <p className="text-xs text-danger mt-1.5">{form.formState.errors.channelIdentifier.message}</p>
            )}
          </div>

          {/* Display name */}
          <div>
            <label className="text-xs font-bold uppercase tracking-[2px] text-text-muted block mb-2">
              Display name <span className="opacity-40">(optional)</span>
            </label>
            <input
              {...form.register('displayName')}
              placeholder="e.g. Main WhatsApp, Support SMS"
              className={input}
            />
          </div>

          {/* Configuration JSON (advanced, collapsible) */}
          <details className="group">
            <summary className="text-xs font-bold text-text-muted cursor-pointer hover:text-text-secondary transition-colors">
              Advanced configuration (JSON)
            </summary>
            <div className="mt-2">
              <textarea
                {...form.register('configurationJson')}
                placeholder='{"accessToken": "...", "verifyToken": "..."}'
                rows={3}
                className={`${input} resize-none font-mono text-xs`}
              />
            </div>
          </details>

          {/* Error */}
          {create.isError && (
            <div className="px-4 py-3 rounded-lg bg-danger-soft border border-[rgba(244,63,94,0.15)] text-sm text-danger">
              {create.error?.message || 'Failed to create channel.'}
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
              disabled={create.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-br from-brand to-brand-dark text-sm font-bold text-white hover:brightness-110 disabled:opacity-50 transition-all"
            >
              {create.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" strokeWidth={2} />
              )}
              {create.isPending ? 'Creating...' : 'Create connection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
