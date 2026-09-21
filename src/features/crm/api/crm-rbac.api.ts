import { apiClient } from '@/shared/lib/api-client';
import type {
  CrmRoleDto,
  CrmRolePermissionDto,
  CreateCrmRoleRequest,
  UpdateCrmRoleRequest,
  AssignCrmRoleRequest,
  UpdateCrmRolePermissionsRequest,
  SalesTerritoryDto,
  CreateSalesTerritoryRequest,
  UpdateSalesTerritoryRequest,
  SalesTerritoryRuleRequest,
  AddTerritoryMemberRequest,
  SalesTerritoryRuleDto,
  SalesTerritoryMemberDto,
} from '../types/crm-rbac.types';

export const crmRbacApi = {
  // ── Roles ──────────────────────────────────────────────────────────────
  getRoles: () =>
    apiClient.get<CrmRoleDto[]>('/v1/crm/roles'),

  getRole: (id: string) =>
    apiClient.get<CrmRoleDto>(`/v1/crm/roles/${id}`),

  createRole: (data: CreateCrmRoleRequest) =>
    apiClient.post<CrmRoleDto>('/v1/crm/roles', data),

  updateRole: (id: string, data: UpdateCrmRoleRequest) =>
    apiClient.put<CrmRoleDto>(`/v1/crm/roles/${id}`, data),

  deleteRole: (id: string) =>
    apiClient.delete<void>(`/v1/crm/roles/${id}`),

  // ── Permissions ────────────────────────────────────────────────────────
  getPermissions: (roleId: string) =>
    apiClient.get<CrmRolePermissionDto[]>(`/v1/crm/roles/${roleId}/permissions`),

  updatePermissions: (roleId: string, data: UpdateCrmRolePermissionsRequest) =>
    apiClient.put<void>(`/v1/crm/roles/${roleId}/permissions`, data),

  // ── User assignment ────────────────────────────────────────────────────
  assignRole: (data: AssignCrmRoleRequest) =>
    apiClient.post<void>('/v1/crm/roles/assign', data),

  // ── Territories ────────────────────────────────────────────────────────
  getTerritories: () =>
    apiClient.get<SalesTerritoryDto[]>('/v1/crm/territories'),

  getTerritory: (id: string) =>
    apiClient.get<SalesTerritoryDto>(`/v1/crm/territories/${id}`),

  createTerritory: (data: CreateSalesTerritoryRequest) =>
    apiClient.post<SalesTerritoryDto>('/v1/crm/territories', data),

  updateTerritory: (id: string, data: UpdateSalesTerritoryRequest) =>
    apiClient.put<SalesTerritoryDto>(`/v1/crm/territories/${id}`, data),

  deleteTerritory: (id: string) =>
    apiClient.delete<void>(`/v1/crm/territories/${id}`),

  addRule: (territoryId: string, data: SalesTerritoryRuleRequest) =>
    apiClient.post<SalesTerritoryRuleDto>(`/v1/crm/territories/${territoryId}/rules`, data),

  removeRule: (territoryId: string, ruleId: string) =>
    apiClient.delete<void>(`/v1/crm/territories/${territoryId}/rules/${ruleId}`),

  addMember: (territoryId: string, data: AddTerritoryMemberRequest) =>
    apiClient.post<SalesTerritoryMemberDto>(`/v1/crm/territories/${territoryId}/members`, data),

  removeMember: (territoryId: string, memberId: string) =>
    apiClient.delete<void>(`/v1/crm/territories/${territoryId}/members/${memberId}`),
} as const;
