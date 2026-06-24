export { useSpecs, useSpec, useEndpoints, useUploadSpec, useDeleteSpec, specKeys } from './api/api-connection.queries';
export { useCapabilityMap, useCapabilitySummary, useGenerateCapabilityMap, capabilityKeys } from './api/api-connection.queries';
export { useAnalysis, useRunAnalysis, useSubmitAnswers, useReadiness, analysisKeys } from './api/api-connection.queries';
export { useTestEndpoint, useApiHealth } from './api/api-connection.queries';

export type { ApiSpecDto, ApiSpecDetailDto, EndpointDto, CapabilityMapDto, AnalysisDto, SpecUploadRequest } from './types/api-connection.types';
export { SpecStatus, SPEC_STATUS_LABEL, SPEC_STATUS_COLOR } from './types/api-connection.types';
