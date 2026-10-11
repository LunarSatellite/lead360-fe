/**
 * GDPR data-subject requests and retention policies.
 *
 * Mirrors `CrmAdminDtos.cs` / `CrmGdprController` in the OmniFlow backend. The
 * API returns both enums as their *names*, not their numbers
 * (`r.RequestType.ToString()`), so these are string unions rather than numeric
 * enums — getting that wrong is a silent mismatch that only shows as a blank
 * badge.
 */

/** `DataSubjectRequestType` in `CrmEnums.cs`. */
export type DataSubjectRequestType =
  | 'Access'
  | 'Erasure'
  | 'Portability'
  | 'Restriction'
  | 'Objection';

/** `DataSubjectRequestStatus` in `CrmEnums.cs`. */
export type DataSubjectRequestStatus =
  | 'Pending'
  | 'InProgress'
  | 'Completed'
  | 'Rejected';

export const DATA_SUBJECT_REQUEST_TYPES: readonly DataSubjectRequestType[] = [
  'Access',
  'Erasure',
  'Portability',
  'Restriction',
  'Objection',
];

/** What each right actually obliges the business to do, in the reviewer's words. */
export const REQUEST_TYPE_DESCRIPTION: Record<DataSubjectRequestType, string> = {
  Access: 'Send the person a copy of the data held about them.',
  Erasure: 'Delete the data held about them.',
  Portability: 'Send their data in a portable, machine-readable form.',
  Restriction: 'Keep the data but stop processing it.',
  Objection: 'Stop a specific processing activity they have objected to.',
};

export interface CrmDataSubjectRequestDto {
  id: string;
  contactId: string | null;
  requestorEmail: string;
  requestType: DataSubjectRequestType;
  status: DataSubjectRequestStatus;
  requestDetails: string | null;
  responseNotes: string | null;
  completedAt: string | null;
  handledByUserId: string | null;
  createdAt: string;
}

export interface CreateDataSubjectRequestRequest {
  requestorEmail: string;
  requestType: DataSubjectRequestType;
  contactId?: string | null;
  requestDetails?: string | null;
}

export interface CrmDataRetentionPolicyDto {
  id: string;
  name: string;
  entityType: string;
  retentionDays: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateDataRetentionPolicyRequest {
  name: string;
  entityType: string;
  retentionDays: number;
}
