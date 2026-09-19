import { UserCheck, UserX, Users } from 'lucide-react';
import type {
  AuroraDecisionOwnerDto,
  AuroraOwnershipState,
  AuroraRoutingDto,
} from '../types/intelligence.types';

/**
 * Who owns decisions in a domain — and, today, the fact that nobody does.
 *
 * `AuroraDecisionOwnerDto.assigned` is `false` for every domain the platform
 * observes, because the owner table is deliberately empty until someone
 * decides who owns `payments` and who owns `delivery`. That is a pending
 * organisational decision, not missing data, so an unassigned owner is shown
 * as `OwnerNotAssigned` with the server's `basisOfOwnership` explaining why —
 * never as a blank, a dash, or a guessed role.
 */
export function DecisionOwnerBadge({
  owner,
  testId,
}: {
  owner: AuroraDecisionOwnerDto;
  testId?: string;
}) {
  if (!owner.assigned) {
    return (
      <span
        data-testid={testId ?? 'decision-owner'}
        data-owner-state="OwnerNotAssigned"
        className="inline-flex max-w-full flex-col gap-0.5 align-top"
      >
        <span className="inline-flex w-fit items-center gap-1.5 rounded-xs border-thin border-dashed border-warning/50 bg-warning-soft px-2 py-1 font-mono text-2xs font-black uppercase tracking-wide text-warning">
          <UserX size={11} strokeWidth={2} />
          OwnerNotAssigned
        </span>
        <span className="text-2xs font-medium leading-relaxed text-text-muted">
          <span className="font-bold text-text-secondary">{owner.domain}</span> —{' '}
          {owner.basisOfOwnership}
        </span>
      </span>
    );
  }

  return (
    <span
      data-testid={testId ?? 'decision-owner'}
      data-owner-state="OwnerAssigned"
      className="inline-flex max-w-full flex-col gap-0.5 align-top"
    >
      <span className="inline-flex w-fit items-center gap-1.5 rounded-xs border-thin border-border-medium bg-glass-2 px-2 py-1 text-2xs font-bold text-text-primary">
        <UserCheck size={11} strokeWidth={2} className="text-success" />
        {owner.ownerRole}
      </span>
      <span className="text-2xs font-medium leading-relaxed text-text-muted">
        <span className="font-bold text-text-secondary">{owner.domain}</span>
        {owner.adminSurface ? <> · {owner.adminSurface}</> : null} — {owner.basisOfOwnership}
      </span>
    </span>
  );
}

const OWNERSHIP_WORDING: Record<AuroraOwnershipState, string> = {
  SameOwner: 'One person owns both sides of this link.',
  DifferentOwners: 'The two sides of this link are owned by different people.',
  OwnerNotAssigned: 'Nobody has been made owner of these domains, so this link routes to nobody.',
};

/**
 * Where a cross-domain link routes to.
 *
 * `OwnerNotAssigned` is the state the platform is in today, and the routing
 * note is the server's own sentence about it. Nothing here invents an
 * escalation path or a fallback owner.
 */
export function RoutingBlock({ routing, testId }: { routing: AuroraRoutingDto; testId?: string }) {
  return (
    <div
      data-testid={testId ?? 'routing'}
      data-ownership={routing.ownership}
      className={`flex flex-col gap-2 rounded-card border-thin p-3 ${
        routing.ownership === 'OwnerNotAssigned'
          ? 'border-warning/40 bg-warning-soft'
          : 'border-border-subtle bg-glass-1'
      }`}
    >
      <span className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wide text-text-muted">
        <Users size={11} strokeWidth={2} />
        Routing · <span className="font-mono text-text-secondary">{routing.ownership}</span>
      </span>
      <p className="text-xs font-bold leading-relaxed text-text-primary">
        {OWNERSHIP_WORDING[routing.ownership]}
      </p>
      <p className="text-xs font-medium leading-relaxed text-text-secondary">
        {routing.routingNote}
      </p>
      {routing.owners.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {routing.owners.map((owner) => (
            <li key={owner.domain}>
              <DecisionOwnerBadge owner={owner} testId={`routing-owner-${owner.domain}`} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
