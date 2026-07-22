// ─────────────────────────────────────────────────────────────────────
// vCard QR (contact card) feature
// ─────────────────────────────────────────────────────────────────────
// Each team member gets one vCard QR card. Owner can download a printable
// QR (PNG/SVG) and a shareable .vcf link. The customer's phone shows a
// native "Save contact?" prompt when they scan the QR.
// ─────────────────────────────────────────────────────────────────────

/** Owner-facing card view. Combines the card row + the team member profile. */
export interface CrmContactCardDto {
  id: string;
  userId: string;
  token: string;
  isActive: boolean;

  // Denormalized team member profile
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  jobTitle: string | null;
  department: string | null;

  // Tenant context (drives the ORG field on the saved contact)
  tenantName: string;
  tenantWebsite: string | null;

  // Stats
  scanCount: number;
  lastScannedAt: string | null;
  uniqueVisitorCount: number;

  createdAt: string;
  notes: string | null;
}

/** Pre-built payloads for the QR / .vcf / share link. Returned by GET /payload. */
export interface CrmContactCardPayloadDto {
  userId: string;
  token: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  jobTitle: string | null;
  organization: string;
  website: string | null;
  /** Ready-to-encode MECARD string. */
  meCard: string;
  /** Ready-to-serve vCard 3.0 string. */
  vCard: string;
  /** Public scan URL (logs a hit, redirects to vCardUrl). */
  scanUrl: string;
  /** Direct .vcf URL (no scan logging). */
  vCardUrl: string;
}

/** Owner edits: notes / active flag. */
export interface UpdateCrmContactCardRequest {
  isActive?: boolean;
  notes?: string | null;
}

/** Stats + recent scan timeline. */
export interface CrmContactCardScanStatsDto {
  cardId: string;
  totalScans: number;
  uniqueVisitors: number;
  lastScannedAt: string | null;
  recentScans: CrmContactCardScanEntryDto[];
}

export interface CrmContactCardScanEntryDto {
  scannedAt: string;
  countryCode: string | null;
}