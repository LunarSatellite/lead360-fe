import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link2Off, Loader2, Pin, PinOff } from 'lucide-react';
import { stylemintReelsAdminApi } from '../api/stylemint-reels-admin.api';

/**
 * The operator actions on one reel, attached to the row that already lists it.
 *
 * These three endpoints all take a reel id and nothing lists reels for an operator, so a page of
 * their own would be three buttons with no way to reach a reel. Here they sit on the listing that
 * exists.
 *
 * Marking a reel externally deleted is irreversible from this surface, so it confirms first.
 * Pinning needs a drop-party id, which the operator brings from the event they are running.
 */
export function ReelOperatorActions({
  reelId,
  onChanged,
}: {
  reelId: string;
  onChanged?: () => void;
}) {
  const [mode, setMode] = useState<'pin' | 'unpin' | 'deleted' | null>(null);
  const [dropPartyId, setDropPartyId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const close = () => {
    setMode(null);
    setDropPartyId('');
    setError(null);
  };

  const act = useMutation({
    mutationFn: async (kind: 'pin' | 'unpin' | 'deleted') => {
      if (kind === 'pin') await stylemintReelsAdminApi.pinToDropParty(reelId, dropPartyId.trim());
      else if (kind === 'unpin')
        await stylemintReelsAdminApi.unpinFromDropParty(reelId, dropPartyId.trim());
      else await stylemintReelsAdminApi.markExternalDeleted(reelId);
    },
    onSuccess: (_data, kind) => {
      setDone(
        kind === 'deleted'
          ? 'Marked as deleted on the source platform.'
          : kind === 'pin'
            ? 'Pinned to the drop party.'
            : 'Unpinned from the drop party.',
      );
      close();
      onChanged?.();
    },
    onError: (caught: unknown) =>
      setError(caught instanceof Error ? caught.message : 'The reel could not be changed.'),
  });

  return (
    <div className="mt-2 border-t-thin border-border-subtle pt-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <ActionButton onClick={() => { setMode('pin'); setError(null); setDone(null); }}>
          <Pin className="h-3 w-3" strokeWidth={1.6} /> Pin to drop party
        </ActionButton>
        <ActionButton onClick={() => { setMode('unpin'); setError(null); setDone(null); }}>
          <PinOff className="h-3 w-3" strokeWidth={1.6} /> Unpin
        </ActionButton>
        <ActionButton onClick={() => { setMode('deleted'); setError(null); setDone(null); }}>
          <Link2Off className="h-3 w-3" strokeWidth={1.6} /> Mark deleted upstream
        </ActionButton>
      </div>

      {done && <p className="mt-1.5 text-[11px] text-brand">{done}</p>}

      {mode && (
        <div className="mt-2 rounded-sm border-thin border-border-glow bg-brand-soft p-2.5">
          <p className="text-[11px] font-bold text-text-primary">
            {mode === 'deleted'
              ? 'Mark this reel deleted on its source platform?'
              : mode === 'pin'
                ? 'Pin this reel to a drop party'
                : 'Unpin this reel from a drop party'}
          </p>
          <p className="mt-0.5 text-[10px] text-text-muted">
            {mode === 'deleted'
              ? 'The platform stops showing a link that no longer resolves. This is not undone from here.'
              : 'The drop-party id comes from the event you are running.'}
          </p>

          {mode !== 'deleted' && (
            <input
              value={dropPartyId}
              onChange={(e) => setDropPartyId(e.target.value)}
              placeholder="Drop party id"
              className="mt-1.5 w-full rounded-sm border-thin border-border-subtle bg-bg-input px-2.5 py-1.5 font-mono text-[11px] text-text-primary placeholder:text-text-muted focus:border-border-glow focus:outline-none"
            />
          )}

          {error && <p className="mt-1.5 text-[11px] text-rose-300">{error}</p>}

          <div className="mt-1.5 flex items-center gap-1.5">
            <button
              disabled={act.isPending || (mode !== 'deleted' && !dropPartyId.trim())}
              onClick={() => act.mutate(mode)}
              className="flex items-center gap-1.5 rounded-sm bg-brand px-2.5 py-1 text-[11px] font-bold text-bg hover:bg-brand-light disabled:opacity-40"
            >
              {act.isPending && <Loader2 className="h-3 w-3 animate-spin" strokeWidth={1.6} />}
              Confirm
            </button>
            <button
              onClick={close}
              className="rounded-sm border-thin border-border-medium px-2.5 py-1 text-[11px] font-bold text-text-secondary hover:bg-glass-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-sm border-thin border-border-medium px-2.5 py-1 text-[11px] font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
    >
      {children}
    </button>
  );
}
