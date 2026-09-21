import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/shared/lib/api-client';
import { crmRbacApi } from './crm-rbac.api';
import type {
  CreateCrmRoleRequest,
  UpdateCrmRoleRequest,
  AssignCrmRoleRequest,
  UpdateCrmRolePermissionsRequest,
  CreateSalesTerritoryRequest,
  UpdateSalesTerritoryRequest,
  SalesTerritoryRuleRequest,
  AddTerritoryMemberRequest,
} from '../types/crm-rbac.types';

export const rbacKeys = {
  roles:       () => ['crm', 'roles'] as const,
  role:        (id: string) => ['crm', 'roles', id] as const,
  territories: () => ['crm', 'territories'] as const,
  territory:   (id: string) => ['crm', 'territories', id] as const,
};

// ── Roles ──────────────────────────────────────────────────────────────────
export function useCrmRoles() {
  return useQuery({ queryKey: rbacKeys.roles(), queryFn: () => crmRbacApi.getRoles() });
}

export function useCrmRole(id: string) {
  return useQuery({ queryKey: rbacKeys.role(id), queryFn: () => crmRbacApi.getRole(id), enabled: !!id });
}

export function useCreateCrmRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCrmRoleRequest) => crmRbacApi.createRole(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: rbacKeys.roles() }); toast.success('Role created.'); },
    onError: (e: ApiError) => toast.error(e.message || 'Failed to create role.'),
  });
}

export function useUpdateCrmRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCrmRoleRequest }) => crmRbacApi.updateRole(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: rbacKeys.roles() }); toast.success('Role updated.'); },
    onError: (e: ApiError) => toast.error(e.message || 'Failed to update role.'),
  });
}

export function useDeleteCrmRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmRbacApi.deleteRole(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: rbacKeys.roles() }); toast.success('Role deleted.'); },
    onError: (e: ApiError) => toast.error(e.message || 'Failed to delete role.'),
  });
}

export function useUpdateCrmRolePermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, data }: { roleId: string; data: UpdateCrmRolePermissionsRequest }) =>
      crmRbacApi.updatePermissions(roleId, data),
    onSuccess: (_r, { roleId }) => {
      qc.invalidateQueries({ queryKey: rbacKeys.roles() });
      qc.invalidateQueries({ queryKey: rbacKeys.role(roleId) });
      toast.success('Permissions saved.');
    },
    onError: (e: ApiError) => toast.error(e.message || 'Failed to save permissions.'),
  });
}

export function useAssignCrmRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AssignCrmRoleRequest) => crmRbacApi.assignRole(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['team'] }); toast.success('Role assigned.'); },
    onError: (e: ApiError) => toast.error(e.message || 'Failed to assign role.'),
  });
}

// ── Territories ────────────────────────────────────────────────────────────
export function useTerritories() {
  return useQuery({ queryKey: rbacKeys.territories(), queryFn: () => crmRbacApi.getTerritories() });
}

export function useCreateTerritory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSalesTerritoryRequest) => crmRbacApi.createTerritory(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: rbacKeys.territories() }); toast.success('Territory created.'); },
    onError: (e: ApiError) => toast.error(e.message || 'Failed to create territory.'),
  });
}

export function useUpdateTerritory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSalesTerritoryRequest }) => crmRbacApi.updateTerritory(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: rbacKeys.territories() }); toast.success('Territory updated.'); },
    onError: (e: ApiError) => toast.error(e.message || 'Failed to update territory.'),
  });
}

export function useDeleteTerritory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmRbacApi.deleteTerritory(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: rbacKeys.territories() }); toast.success('Territory deleted.'); },
    onError: (e: ApiError) => toast.error(e.message || 'Failed to delete territory.'),
  });
}

export function useAddTerritoryRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ territoryId, data }: { territoryId: string; data: SalesTerritoryRuleRequest }) =>
      crmRbacApi.addRule(territoryId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: rbacKeys.territories() }); toast.success('Rule added.'); },
    onError: (e: ApiError) => toast.error(e.message || 'Failed to add rule.'),
  });
}

export function useRemoveTerritoryRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ territoryId, ruleId }: { territoryId: string; ruleId: string }) =>
      crmRbacApi.removeRule(territoryId, ruleId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: rbacKeys.territories() }); toast.success('Rule removed.'); },
    onError: (e: ApiError) => toast.error(e.message || 'Failed to remove rule.'),
  });
}

export function useAddTerritoryMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ territoryId, data }: { territoryId: string; data: AddTerritoryMemberRequest }) =>
      crmRbacApi.addMember(territoryId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: rbacKeys.territories() }); toast.success('Member added.'); },
    onError: (e: ApiError) => toast.error(e.message || 'Failed to add member.'),
  });
}

export function useRemoveTerritoryMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ territoryId, memberId }: { territoryId: string; memberId: string }) =>
      crmRbacApi.removeMember(territoryId, memberId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: rbacKeys.territories() }); toast.success('Member removed.'); },
    onError: (e: ApiError) => toast.error(e.message || 'Failed to remove member.'),
  });
}
