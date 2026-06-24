// ═══════════════════════════════════════════════════════════════
// useAgentsRoleGate — client-side role check
//
// The backend is the source of truth on permissions; this hook is
// purely so we render honest affordances (e.g. don't show a Delete
// button to non-admins). It reads the current user's role from
// useProfile() and resolves it against UserRole.Owner / Admin.
//
// Loading state is treated as "not allowed" by default so we never
// flash a button the user can't actually use.
// ═══════════════════════════════════════════════════════════════

import { useProfile } from '@/features/auth/api/auth.queries';
import { UserRole, type UserDto } from '@/features/auth/types/auth.types';

export interface AgentsRoleGate {
  /** Owner or Admin can create / edit / delete / cancel / override. */
  canManage: boolean;
  /** Same as canManage today — kept distinct for forward-compat
   *  in case backend ever opens up firing to lower roles. */
  canFire: boolean;
  /** True while the profile request is in flight. UI should show
   *  a benign placeholder, not yet decide whether to render
   *  admin-only controls. */
  isLoading: boolean;
}

export function useAgentsRoleGate(): AgentsRoleGate {
  const { data: profileRaw, isLoading } = useProfile();

  // Profile endpoint returns UserDto under the same envelope-stripping
  // dance every other consumer in this codebase performs.
  const profile = profileRaw as unknown as UserDto | undefined;
  const role = profile?.role;

  const canManage = role === UserRole.Owner || role === UserRole.Admin;

  return {
    canManage,
    canFire: canManage,
    isLoading,
  };
}
