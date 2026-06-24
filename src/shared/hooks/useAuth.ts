import { useMemo } from 'react';
import { useProfile } from '@/features/auth/api/auth.queries';
import type { UserProfileDto, UserRoleValue } from '@/features/auth/types/auth.types';

interface UseAuthReturn {
  user: UserProfileDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasRole: (role: UserRoleValue) => boolean;
  tenantId: string | null;
}

export function useAuth(): UseAuthReturn {
  const { data, isLoading } = useProfile();
  const profile = data as UserProfileDto | undefined;

  return useMemo(() => ({
    user: profile ?? null,
    isAuthenticated: !!localStorage.getItem('omniflow_token') && !!profile,
    isLoading,
    hasRole: (role: UserRoleValue) => profile?.role === role,
    tenantId: profile?.tenantId ?? localStorage.getItem('omniflow_tenant_id'),
  }), [profile, isLoading]);
}
