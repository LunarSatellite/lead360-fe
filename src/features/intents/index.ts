// ═══════════════════════════════════════════════════════════════
// Intents Feature — Public API (Barrel Export)
// ═══════════════════════════════════════════════════════════════

export {
  useIntents,
  useIntentTree,
  useIntent,
  useCreateIntent,
  useUpdateIntent,
  useDeleteIntent,
  useBulkImportIntents,
  useToggleIntentActive,
  intentKeys,
} from './api/intents.queries';

export type {
  IntentDto,
  IntentCreateRequest,
  IntentUpdateRequest,
  IntentTrackValue,
  IntentOperationTypeValue,
} from './types/intents.types';

export {
  IntentTrack, INTENT_TRACK_LABEL, INTENT_TRACK_COLOR,
  IntentOperationType, OPERATION_TYPE_LABEL, OPERATION_TYPE_COLOR, OPERATION_TYPE_ICON,
} from './types/intents.types';

// ─── API Specs Sub-Feature ───

export {
  useApiSpecs,
  useApiSpecDetail,
  useApiSpecEndpoints,
  useAllEndpoints,
  useUploadApiSpec,
  useUploadApiSpecFile,
  useReparseApiSpec,
  useDeleteApiSpec,
  apiSpecKeys,
} from './api/api-specs.queries';

export type {
  ApiSpecificationDto,
  ApiSpecificationDetailDto,
  ApiEndpointDto,
  ApiSpecUploadRequest,
  ApiSpecStatusValue,
} from './types/api-specs.types';

export {
  ApiSpecStatus,
  API_SPEC_STATUS_LABEL,
  API_SPEC_STATUS_COLOR,
  HTTP_METHOD_COLOR,
} from './types/api-specs.types';
