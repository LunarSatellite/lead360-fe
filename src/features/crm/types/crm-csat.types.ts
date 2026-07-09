export const CrmCsatRecordType = { Csat: 1, Nps: 2 } as const;
export type CrmCsatRecordTypeValue = (typeof CrmCsatRecordType)[keyof typeof CrmCsatRecordType];

export const CrmNpsClassification = { Promoter: 1, Passive: 2, Detractor: 3 } as const;
export type CrmNpsClassificationValue = (typeof CrmNpsClassification)[keyof typeof CrmNpsClassification];

export const CRM_NPS_CLASSIFICATION_LABELS: Record<CrmNpsClassificationValue, string> = {
  1: 'Promoter',
  2: 'Passive',
  3: 'Detractor',
};

export interface CrmCsatRecordDto {
  id: string;
  contactId: string;
  recordType: CrmCsatRecordTypeValue;
  implicitScore: number;
  confidence: number;
  evidenceQuotes: string[];
  topicTag?: string | null;
  npsClassification?: CrmNpsClassificationValue | null;
  extractedAt: string;
}

export interface CrmCsatSummaryDto {
  avgCsatScore: number;
  npsPromoterPct: number;
  npsPassivePct: number;
  npsDetractorPct: number;
  totalRecords: number;
  trend: string;
}
