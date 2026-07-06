import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  X, Plus, Loader2, Copy, Check, ExternalLink,
  Info, AlertCircle,
  Phone, MessageCircle, Camera, Send, MessageSquare, PhoneCall, Globe, Mail, Vibrate,
} from 'lucide-react';
import { useCreateChannel, useActivateChannel } from '../api/channels.queries';
import { ChannelType, CHANNEL_TYPE_LABEL } from '../types/channels.types';
import type { ChannelTypeValue, ChannelConnectionCreateResponseDto } from '../types/channels.types';

interface ChannelConnectModalProps {
  open: boolean;
  onClose: () => void;
  tenantId: string;
  channelType: ChannelTypeValue;
}

interface ConnectFormData {
  channelIdentifier: string;
  displayName: string;
  [key: string]: string;
}

interface FieldDef {
  name: string;
  label: string;
  placeholder: string;
  type?: 'text' | 'password' | 'number';
  required?: boolean;
  fullWidth?: boolean;
}

const ICON_MAP: Record<ChannelTypeValue, typeof Phone> = {
  [ChannelType.WhatsApp]:  Phone,
  [ChannelType.Messenger]: MessageCircle,
  [ChannelType.Instagram]: Camera,
  [ChannelType.Telegram]:  Send,
  [ChannelType.SMS]:       MessageSquare,
  [ChannelType.Voice]:     PhoneCall,
  [ChannelType.WebChat]:   Globe,
  [ChannelType.Email]:     Mail,
  [ChannelType.Viber]:     Vibrate,
};

const BRAND_COLOR: Record<ChannelTypeValue, string> = {
  [ChannelType.WhatsApp]:  '#25D366',
  [ChannelType.Messenger]: '#0084FF',
  [ChannelType.Instagram]: '#E1306C',
  [ChannelType.Telegram]:  '#2AABEE',
  [ChannelType.SMS]:       '#00D97E',
  [ChannelType.Voice]:     '#F59E0B',
  [ChannelType.WebChat]:   '#00D97E',
  [ChannelType.Email]:     '#A78BFA',
  [ChannelType.Viber]:     '#6650DF',
};

const CHANNEL_FIELDS: Record<ChannelTypeValue, FieldDef[]> = {
  [ChannelType.WhatsApp]: [
    { name: 'channelIdentifier', label: 'Phone Number',       placeholder: '+254700000000',              required: true },
    { name: 'displayName',       label: 'Display Name',       placeholder: 'Main WhatsApp' },
    { name: 'phoneNumberId',     label: 'Phone Number ID',    placeholder: 'From Meta Developer Console', required: true },
    { name: 'accessToken',       label: 'Access Token',       placeholder: 'EAAx...',                    type: 'password', required: true },
    { name: 'appSecret',         label: 'App Secret',         placeholder: 'From Meta App Dashboard',    type: 'password' },
    { name: 'businessAccountId', label: 'Business Account ID', placeholder: 'WhatsApp Business Account ID' },
  ],
  [ChannelType.Telegram]: [
    { name: 'channelIdentifier', label: 'Bot Username',           placeholder: '@YourBotUsername',           required: true },
    { name: 'displayName',       label: 'Display Name',           placeholder: 'Support Bot' },
    { name: 'botToken',          label: 'Bot Token',              placeholder: 'From @BotFather',            type: 'password', required: true },
    { name: 'secretToken',       label: 'Secret Token (optional)', placeholder: 'Optional webhook verification' },
  ],
  [ChannelType.SMS]: [
    { name: 'channelIdentifier', label: 'SMS Number',        placeholder: '+254700000000', required: true },
    { name: 'displayName',       label: 'Display Name',      placeholder: 'Support SMS' },
    { name: 'accountSid',        label: 'Twilio Account SID', placeholder: 'ACxxxxxxxx',  required: true },
    { name: 'authToken',         label: 'Auth Token',        placeholder: 'Twilio auth token', type: 'password', required: true },
    { name: 'fromNumber',        label: 'From Number',       placeholder: '+1234567890' },
  ],
  [ChannelType.Voice]: [
    { name: 'channelIdentifier', label: 'Twilio Number', placeholder: '+254700000000', required: true },
    { name: 'displayName',       label: 'Display Name',  placeholder: 'Support Line' },
    { name: 'accountSid',        label: 'Account SID',   placeholder: 'ACxxxxxxxx',   required: true },
    { name: 'authToken',         label: 'Auth Token',    placeholder: 'Twilio auth token', type: 'password', required: true },
    { name: 'voiceName',         label: 'Voice Name',    placeholder: 'en-US-Neural2-C' },
    { name: 'language',          label: 'Language',      placeholder: 'en-US' },
  ],
  [ChannelType.Messenger]: [
    { name: 'channelIdentifier', label: 'Facebook Page ID',   placeholder: '1234567890',                   required: true },
    { name: 'displayName',       label: 'Display Name',       placeholder: 'Business Messenger' },
    { name: 'pageAccessToken',   label: 'Page Access Token',  placeholder: 'From Facebook Developer Console', type: 'password', required: true },
    { name: 'appSecret',         label: 'App Secret',         placeholder: 'From Meta App Settings',       type: 'password' },
  ],
  [ChannelType.Instagram]: [
    { name: 'channelIdentifier', label: 'IG Business Account ID', placeholder: '1234567890',                   required: true },
    { name: 'displayName',       label: 'Display Name',           placeholder: 'Brand Instagram' },
    { name: 'pageAccessToken',   label: 'Page Access Token',      placeholder: 'From Facebook Developer Console', type: 'password', required: true },
    { name: 'appSecret',         label: 'App Secret',             placeholder: 'From Meta App Settings',       type: 'password' },
  ],
  [ChannelType.WebChat]: [
    { name: 'channelIdentifier', label: 'Website Domain',   placeholder: 'www.example.com', required: true },
    { name: 'displayName',       label: 'Display Name',     placeholder: 'Website Chat Widget' },
    { name: 'allowedOrigins',    label: 'Allowed Origins',  placeholder: 'https://example.com, https://app.example.com' },
    { name: 'theme',             label: 'Theme',            placeholder: 'light or dark' },
  ],
  [ChannelType.Email]: [
    { name: 'channelIdentifier', label: 'Support Email',   placeholder: 'support@example.com', required: true },
    { name: 'displayName',       label: 'Display Name',    placeholder: 'Customer Support Email' },
    { name: 'smtpHost',          label: 'SMTP Host',       placeholder: 'smtp.gmail.com',       required: true },
    { name: 'smtpPort',          label: 'SMTP Port',       placeholder: '587',                  type: 'number' },
    { name: 'smtpUsername',      label: 'SMTP Username',   placeholder: 'user@example.com' },
    { name: 'smtpPassword',      label: 'SMTP Password',   placeholder: 'App password',         type: 'password' },
    { name: 'fromAddress',       label: 'From Address',    placeholder: 'noreply@example.com' },
    { name: 'fromName',          label: 'From Name',       placeholder: 'Acme Support' },
    { name: 'replyTo',           label: 'Reply-To',        placeholder: 'support@example.com', fullWidth: true },
  ],
  [ChannelType.Viber]: [
    { name: 'channelIdentifier', label: 'Viber Business ID', placeholder: '1234567890', required: true },
    { name: 'displayName',       label: 'Display Name',      placeholder: 'Viber Channel' },
  ],
};

const CHANNEL_HELPER_TEXT: Record<ChannelTypeValue, string> = {
  [ChannelType.WhatsApp]:  'Get these credentials from your Meta Developer Console → WhatsApp → API Setup.',
  [ChannelType.Telegram]:  'Create a bot with @BotFather on Telegram and paste the token here.',
  [ChannelType.SMS]:       'Get Account SID and Auth Token from your Twilio Console.',
  [ChannelType.Voice]:     'Configure Twilio Voice settings in the Twilio Console.',
  [ChannelType.Messenger]: 'Get Page Access Token from Facebook Developer Console → Messenger.',
  [ChannelType.Instagram]: 'Link your Instagram Business Account through the Meta Business Suite.',
  [ChannelType.WebChat]:   'Widget token will be auto-generated. Add allowed origins for your website.',
  [ChannelType.Email]:     'Configure SMTP settings for your email provider.',
  [ChannelType.Viber]:     'Get credentials from Viber Admin Panel to connect your Viber business account.',
};

const WEBHOOK_INSTRUCTIONS: Record<ChannelTypeValue, string> = {
  [ChannelType.WhatsApp]:  'Paste this webhook URL and verify token in Meta Developer Console → WhatsApp → Configuration → Callback URL / Verify Token.',
  [ChannelType.Telegram]:  'The webhook is set automatically via the Telegram Bot API.',
  [ChannelType.SMS]:       'Paste this webhook URL in Twilio Console → Phone Numbers → Messaging Webhook.',
  [ChannelType.Voice]:     'Paste this webhook URL in Twilio Console → Phone Numbers → Voice Webhook.',
  [ChannelType.Messenger]: 'Paste this webhook URL and verify token in Meta Developer Console → Messenger → Webhooks.',
  [ChannelType.Instagram]: 'Paste this webhook URL and verify token in Meta Developer Console → Instagram → Webhooks.',
  [ChannelType.WebChat]:   'Embed the Lead360 chat widget script on your website using this endpoint.',
  [ChannelType.Email]:     'Configure your email provider to forward incoming emails to this webhook URL.',
  [ChannelType.Viber]:     'Paste this webhook URL in Viber Admin Panel → Webhooks.',
};

// Channels whose provider webhook setup screen asks for a separate "Verify Token" field
// alongside the callback URL (Meta's hub.verify_token handshake).
const SHOWS_VERIFY_TOKEN: Record<ChannelTypeValue, boolean> = {
  [ChannelType.WhatsApp]:  true,
  [ChannelType.Telegram]:  false,
  [ChannelType.SMS]:       false,
  [ChannelType.Voice]:     false,
  [ChannelType.Messenger]: true,
  [ChannelType.Instagram]: true,
  [ChannelType.WebChat]:   false,
  [ChannelType.Email]:     false,
  [ChannelType.Viber]:     false,
};

export function ChannelConnectModal({ open, onClose, tenantId, channelType }: ChannelConnectModalProps) {
  const [step, setStep] = useState<'config' | 'success'>('config');
  const [createdChannel, setCreatedChannel] = useState<ChannelConnectionCreateResponseDto | null>(null);
  const [copied, setCopied] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);

  const create = useCreateChannel();
  const activate = useActivateChannel();

  const fields = CHANNEL_FIELDS[channelType] ?? [];
  const label = CHANNEL_TYPE_LABEL[channelType];
  const helperText = CHANNEL_HELPER_TEXT[channelType];
  const ChannelIcon = ICON_MAP[channelType] ?? Globe;
  const brandColor = BRAND_COLOR[channelType] ?? '#00D97E';

  const form = useForm<ConnectFormData>({
    defaultValues: Object.fromEntries(fields.map((f) => [f.name, ''])),
  });

  const onSubmit = (data: ConnectFormData) => {
    const { channelIdentifier, displayName, ...configFields } = data;
    const configJson = Object.keys(configFields).length > 0 ? JSON.stringify(configFields) : undefined;

    create.mutate(
      { tenantId: tenantId || undefined, channelType, channelIdentifier, displayName: displayName || undefined, configurationJson: configJson },
      {
        onSuccess: (result) => {
          const channel = result as unknown as ChannelConnectionCreateResponseDto;
          setCreatedChannel(channel);
          if (channel?.id) activate.mutate(channel.id);
          setStep('success');
        },
      },
    );
  };

  const handleCopyWebhook = () => {
    if (createdChannel?.webhookUrl) {
      navigator.clipboard.writeText(createdChannel.webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyToken = () => {
    if (createdChannel?.webhookVerifyToken) {
      navigator.clipboard.writeText(createdChannel.webhookVerifyToken);
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setStep('config');
    setCreatedChannel(null);
    setTokenCopied(false);
    form.reset();
    onClose();
  };

  if (!open) return null;

  const inputClass =
    'w-full px-3.5 py-2 rounded-sm bg-bg-input border-thin border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-glow focus:bg-glass-1 transition-all';
  const labelClass = 'text-2xs font-bold uppercase tracking-[2px] text-text-secondary block mb-1.5 pl-2';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      <div className="drawer-slide-in relative w-[520px] h-full flex flex-col bg-bg-shell border-l border-thin border-border-subtle" style={{ boxShadow: '-8px 0 40px rgba(0,0,0,0.5)' }}>

        {/* Channel-coloured accent bar */}
        <div
          className="h-px w-full flex-shrink-0"
          style={{ background: `linear-gradient(90deg, transparent, ${brandColor}80, transparent)` }}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-sm flex items-center justify-center flex-shrink-0"
              style={{ background: `${brandColor}12`, border: `0.5px solid ${brandColor}25` }}
            >
              <ChannelIcon className="w-4 h-4" style={{ color: brandColor }} strokeWidth={1.6} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-text-primary tracking-tight leading-none">
                {step === 'config' ? `Connect ${label}` : `${label} connected`}
              </h2>
              <p className="text-2xs text-text-muted mt-1">
                {step === 'config' ? 'Step 1 of 2 — Credentials' : 'Step 2 of 2 — Webhook setup'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-sm bg-glass-1 border-thin border-border-subtle flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-glass-2 transition-all"
          >
            <X className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>

        {step === 'config' ? (
          /* ─── Step 1: Credentials ─── */
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-5 space-y-4">

            {/* Helper hint */}
            <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-card bg-glass-1 border-thin border-border-subtle">
              <Info className="w-3.5 h-3.5 text-text-muted flex-shrink-0 mt-0.5" strokeWidth={1.6} />
              <p className="text-xs text-text-secondary leading-relaxed">{helperText}</p>
            </div>

            {/* Fields — 2-column grid */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-3.5">
              {fields.map((field) => (
                <div key={field.name} className={field.fullWidth ? 'col-span-2' : ''}>
                  <label className={labelClass}>
                    {field.label}
                    {field.required && <span className="text-danger ml-0.5">*</span>}
                  </label>
                  <input
                    {...form.register(field.name, {
                      required: field.required ? `${field.label} is required` : false,
                    })}
                    type={field.type || 'text'}
                    placeholder={field.placeholder}
                    className={inputClass}
                  />
                  {form.formState.errors[field.name] && (
                    <p className="text-2xs text-danger mt-1">
                      {form.formState.errors[field.name]?.message as string}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Submit error */}
            {create.isError && (
              <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-card bg-glass-1 border-thin border-border-subtle text-sm text-danger">
                <AlertCircle className="w-4 h-4 flex-shrink-0" strokeWidth={1.6} />
                {create.error?.message || 'Failed to create channel.'}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-sm border-thin border-border-medium text-sm font-semibold text-text-secondary hover:text-text-primary hover:bg-glass-2 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={create.isPending}
                className="flex items-center gap-2 px-5 py-2 rounded-sm text-sm font-bold text-bg hover:brightness-110 disabled:opacity-50 transition-all"
                style={{ background: 'linear-gradient(135deg, #00FFAA 0%, #00B368 100%)' }}
              >
                {create.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" strokeWidth={2.2} />
                )}
                {create.isPending ? 'Connecting…' : 'Connect channel'}
              </button>
            </div>
          </form>
        ) : (
          /* ─── Step 2: Webhook setup ─── */
          <div className="flex-1 overflow-y-auto p-5 space-y-4">

            {/* Success banner */}
            <div className="flex items-center gap-3 px-4 py-3.5 rounded-card bg-glass-1 border-thin border-border-glow">
              <div
                className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #00FFAA 0%, #00B368 100%)' }}
              >
                <Check className="w-4 h-4" strokeWidth={2.5} style={{ color: '#0A0F0D' }} />
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary">Channel connected successfully</p>
                <p className="text-2xs text-text-muted mt-0.5">
                  {createdChannel?.displayName || label} is live and ready to receive messages.
                </p>
              </div>
            </div>

            {/* Webhook URL */}
            {createdChannel?.webhookUrl && (
              <div>
                <p className={labelClass}>Webhook URL</p>
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-card bg-glass-1 border-thin border-border-subtle">
                  <ExternalLink className="w-3.5 h-3.5 text-text-muted flex-shrink-0" strokeWidth={1.6} />
                  <span className="text-xs font-mono text-brand truncate flex-1">
                    {createdChannel.webhookUrl}
                  </span>
                  <button
                    onClick={handleCopyWebhook}
                    className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-xs border-thin border-border-medium text-2xs font-bold text-text-secondary hover:text-text-primary hover:bg-glass-2 transition-all"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-success" strokeWidth={2.2} />
                        <span className="text-success">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" strokeWidth={1.6} />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Webhook Verify Token */}
            {SHOWS_VERIFY_TOKEN[channelType] && createdChannel?.webhookVerifyToken && (
              <div>
                <p className={labelClass}>Verify Token</p>
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-card bg-glass-1 border-thin border-border-subtle">
                  <ExternalLink className="w-3.5 h-3.5 text-text-muted flex-shrink-0" strokeWidth={1.6} />
                  <span className="text-xs font-mono text-brand truncate flex-1">
                    {createdChannel.webhookVerifyToken}
                  </span>
                  <button
                    onClick={handleCopyToken}
                    className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-xs border-thin border-border-medium text-2xs font-bold text-text-secondary hover:text-text-primary hover:bg-glass-2 transition-all"
                  >
                    {tokenCopied ? (
                      <>
                        <Check className="w-3 h-3 text-success" strokeWidth={2.2} />
                        <span className="text-success">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" strokeWidth={1.6} />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <p className="text-2xs text-text-muted mt-1 pl-2">
                  Shown once — save it now. You'll need it if you ever have to re-verify this webhook.
                </p>
              </div>
            )}

            {/* Next step instructions */}
            <div className="px-3.5 py-3 rounded-card bg-glass-1 border-thin border-border-subtle">
              <p className={labelClass}>Next step</p>
              <p className="text-xs text-text-secondary leading-relaxed">
                {WEBHOOK_INSTRUCTIONS[channelType]}
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleClose}
                className="px-5 py-2 rounded-sm text-sm font-bold text-bg hover:brightness-110 transition-all"
                style={{ background: 'linear-gradient(135deg, #00FFAA 0%, #00B368 100%)' }}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
