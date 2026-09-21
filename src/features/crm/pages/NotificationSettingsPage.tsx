import { useEffect, useState } from 'react';
import { Loader2, Bell, Save } from 'lucide-react';
import { useNotifPreferences, useSaveNotifPreferences } from '../api/crm.queries';
import {
  CONFIGURABLE_NOTIFICATION_TYPES,
  NotificationDeliveryChannel,
  NOTIFICATION_CHANNEL_LABELS,
  NotificationDigestMode,
  NOTIFICATION_DIGEST_LABELS,
  type CrmNotifPreferenceDto,
} from '../types/crm.types';

// Defaults match the backend: absent preference = enabled, in-app+email, instant.
const DEFAULT: Omit<CrmNotifPreferenceDto, 'notificationType'> = {
  enabled: true,
  deliveryChannel: NotificationDeliveryChannel.Both,
  digestMode: NotificationDigestMode.Instant,
};

export function Component() {
  const { data, isLoading } = useNotifPreferences();
  const save = useSaveNotifPreferences();
  const [prefs, setPrefs] = useState<Record<number, CrmNotifPreferenceDto>>({});

  // Seed local state from saved prefs, falling back to defaults for unset types.
  useEffect(() => {
    const byType = new Map<number, CrmNotifPreferenceDto>();
    (data ?? []).forEach((p) => byType.set(p.notificationType, p));
    const seeded: Record<number, CrmNotifPreferenceDto> = {};
    CONFIGURABLE_NOTIFICATION_TYPES.forEach((t) => {
      seeded[t.value] = byType.get(t.value) ?? { notificationType: t.value, ...DEFAULT };
    });
    setPrefs(seeded);
  }, [data]);

  const update = (type: number, patch: Partial<CrmNotifPreferenceDto>) =>
    setPrefs((prev) => ({ ...prev, [type]: { ...prev[type], ...patch } }));

  const onSave = () => save.mutate({ preferences: Object.values(prefs) });

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-brand-soft border border-border-glow flex items-center justify-center">
          <Bell className="w-6 h-6 text-brand" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Notification preferences</h1>
          <p className="text-sm text-text-muted">Choose how and how often you're notified for each event.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12 text-text-muted"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : (
        <>
          <div className="rounded-2xl border border-border-subtle bg-bg-card divide-y divide-border-subtle">
            {CONFIGURABLE_NOTIFICATION_TYPES.map((t) => {
              const p = prefs[t.value];
              if (!p) return null;
              return (
                <div key={t.value} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-text-primary">{t.label}</p>
                    <p className="text-xs text-text-muted">{t.description}</p>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-text-secondary">
                    <input
                      type="checkbox"
                      checked={p.enabled}
                      onChange={(e) => update(t.value, { enabled: e.target.checked })}
                      className="accent-brand w-4 h-4"
                    />
                    On
                  </label>

                  <select
                    value={p.deliveryChannel}
                    disabled={!p.enabled}
                    onChange={(e) => update(t.value, { deliveryChannel: Number(e.target.value) as NotificationDeliveryChannel })}
                    className="rounded-lg bg-bg-elevated border border-border-subtle text-sm text-text-primary px-2 py-1.5 disabled:opacity-50"
                  >
                    {Object.entries(NOTIFICATION_CHANNEL_LABELS).map(([v, label]) => (
                      <option key={v} value={v}>{label}</option>
                    ))}
                  </select>

                  <select
                    value={p.digestMode}
                    disabled={!p.enabled}
                    onChange={(e) => update(t.value, { digestMode: Number(e.target.value) as NotificationDigestMode })}
                    className="rounded-lg bg-bg-elevated border border-border-subtle text-sm text-text-primary px-2 py-1.5 disabled:opacity-50"
                  >
                    {Object.entries(NOTIFICATION_DIGEST_LABELS).map(([v, label]) => (
                      <option key={v} value={v}>{label}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end">
            <button
              onClick={onSave}
              disabled={save.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-brand text-white px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
            >
              {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save preferences
            </button>
          </div>
        </>
      )}
    </div>
  );
}
