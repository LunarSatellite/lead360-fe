// ═══════════════════════════════════════════════════════════════
// Compliance Feature — TanStack Query Hooks + Keys
// ═══════════════════════════════════════════════════════════════

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { complianceApi } from './compliance.api';
import { toast } from 'sonner';
import type {
  ComplianceProfileCreateRequest,
  ComplianceProfileUpdateRequest,
} from '../types/compliance.types';

// ─── Query Keys ───

export const complianceKeys = {
  all: ['compliance'] as const,
  profiles: () => [...complianceKeys.all, 'profiles'] as const,
  profileList: () => [...complianceKeys.profiles(), 'list'] as const,
  profileDetail: (id: string) => [...complianceKeys.profiles(), 'detail', id] as const,
  profileByIndustry: (industry: string) => [...complianceKeys.profiles(), 'industry', industry] as const,
  recommended: (industry: string) => [...complianceKeys.profiles(), 'recommended', industry] as const,
  tenant: () => [...complianceKeys.all, 'tenant'] as const,
  tenantCurrent: () => [...complianceKeys.tenant(), 'current'] as const,
} as const;

// ─── Queries ───

export function useComplianceProfiles() {
  return useQuery({
    queryKey: complianceKeys.profileList(),
    queryFn: () => complianceApi.getAll(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useComplianceProfile(id: string | undefined) {
  return useQuery({
    queryKey: complianceKeys.profileDetail(id!),
    queryFn: () => complianceApi.getById(id!),
    enabled: !!id,
  });
}

export function useComplianceProfilesByIndustry(industry: string | undefined) {
  return useQuery({
    queryKey: complianceKeys.profileByIndustry(industry!),
    queryFn: () => complianceApi.getByIndustry(industry!),
    enabled: !!industry,
  });
}

export function useRecommendedProfile(industry: string | undefined) {
  return useQuery({
    queryKey: complianceKeys.recommended(industry!),
    queryFn: () => complianceApi.getRecommended(industry!),
    enabled: !!industry && industry.length > 0,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}

export function useTenantComplianceProfile() {
  return useQuery({
    queryKey: complianceKeys.tenantCurrent(),
    queryFn: () => complianceApi.getTenantProfile(),
    retry: (failureCount, error: any) => {
      if (error?.status === 404) return false;
      return failureCount < 3;
    },
  });
}

// ─── Mutations ───

export function useAssignComplianceProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) => complianceApi.assignToTenant({ profileId }),
    onSuccess: (data) => {
      qc.setQueryData(complianceKeys.tenantCurrent(), data);
      qc.invalidateQueries({ queryKey: complianceKeys.tenantCurrent() });
      toast.success(`Compliance profile updated to "${(data as any)?.name ?? 'new profile'}"`);
    },
    onError: (err: any) => toast.error(err?.message ?? 'Failed to assign compliance profile'),
  });
}

export function useCreateComplianceProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ComplianceProfileCreateRequest) => complianceApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: complianceKeys.profileList() });
      toast.success('Custom compliance profile created');
    },
    onError: (err: any) => toast.error(err?.message ?? 'Failed to create profile'),
  });
}

export function useUpdateComplianceProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ComplianceProfileUpdateRequest }) =>
      complianceApi.update(id, data),
    onSuccess: (data) => {
      const profile = data as any;
      if (profile?.id) qc.setQueryData(complianceKeys.profileDetail(profile.id), data);
      qc.invalidateQueries({ queryKey: complianceKeys.profileList() });
      qc.invalidateQueries({ queryKey: complianceKeys.tenantCurrent() });
      toast.success('Compliance profile updated');
    },
    onError: (err: any) => {
      if (err?.status === 409) toast.error('System profiles cannot be modified');
      else toast.error(err?.message ?? 'Failed to update profile');
    },
  });
}

export function useDeleteComplianceProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => complianceApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: complianceKeys.profileList() });
      qc.invalidateQueries({ queryKey: complianceKeys.tenantCurrent() });
      toast.success('Custom profile deleted');
    },
    onError: (err: any) => {
      if (err?.status === 409) toast.error('System profiles cannot be deleted');
      else toast.error(err?.message ?? 'Failed to delete profile');
    },
  });
}
