import { apiClient } from '@/shared/lib/api-client';
import type {
  FlowDto, FlowGenerateRequest, FlowChatRequest, FlowSaveRequest,
  ServiceExecutionRequest, ServiceExecutionResponse,
  MenuRenderRequest, MenuRenderResponse, GoLiveChecklistResponse,
  ImportParseRequest, ImportParseResponse, ImportEnrichRequest, ImportRow, ImportConfirmRequest,
  FlowValidationResult, BotSettings,
} from '../types/flow.types';

const LLM_TIMEOUT = 120_000;

export const flowApi = {
  // P3-002: Flow Builder
  list:       async (): Promise<FlowDto[]> => apiClient.get('/v1/flows') as unknown as FlowDto[],
  getById:    async (id: string): Promise<FlowDto> => apiClient.get(`/v1/flows/${id}`) as unknown as FlowDto,
  generate:   async (d: FlowGenerateRequest): Promise<FlowDto> => apiClient.post('/v1/flows/generate', d, { timeout: LLM_TIMEOUT }) as unknown as FlowDto,
  chatModify: async (id: string, d: FlowChatRequest): Promise<FlowDto> => apiClient.post(`/v1/flows/${id}/chat`, d, { timeout: LLM_TIMEOUT }) as unknown as FlowDto,
  save:       async (id: string, d: FlowSaveRequest): Promise<FlowDto> => apiClient.put(`/v1/flows/${id}`, d) as unknown as FlowDto,
  activate:   async (id: string): Promise<void> => { await apiClient.post(`/v1/flows/${id}/activate`); },
  deactivate: async (id: string): Promise<void> => { await apiClient.post(`/v1/flows/${id}/deactivate`); },
  duplicate:  async (id: string): Promise<FlowDto> => apiClient.post(`/v1/flows/${id}/duplicate`) as unknown as FlowDto,
  delete:     async (id: string): Promise<void> => { await apiClient.delete(`/v1/flows/${id}`); },
  validate:   async (id: string): Promise<FlowValidationResult> => apiClient.get(`/v1/flows/${id}/validate`) as unknown as FlowValidationResult,

  // P3-006: Service Execution
  execute:      async (d: ServiceExecutionRequest): Promise<ServiceExecutionResponse> => apiClient.post('/v1/service-execution/execute', d, { timeout: LLM_TIMEOUT }) as unknown as ServiceExecutionResponse,
  continueExec: async (d: ServiceExecutionRequest): Promise<ServiceExecutionResponse> => apiClient.post('/v1/service-execution/continue', d, { timeout: LLM_TIMEOUT }) as unknown as ServiceExecutionResponse,

  // P3-003: Menu Rendering
  renderMenu:  async (d: MenuRenderRequest): Promise<MenuRenderResponse> => apiClient.post('/v1/menus/render', d) as unknown as MenuRenderResponse,
  getMenuTree: async () => apiClient.get('/v1/menus/tree'),
  getMainMenu: async () => apiClient.get('/v1/menus/main'),

  // P3-012: Go-Live
  getChecklist:      async (): Promise<GoLiveChecklistResponse> => apiClient.get('/v1/go-live/checklist') as unknown as GoLiveChecklistResponse,
  getGoLiveStatus:   async (): Promise<GoLiveChecklistResponse> => apiClient.get('/v1/go-live/status') as unknown as GoLiveChecklistResponse,
  activateChannel:   async (ch: string): Promise<void> => { await apiClient.post(`/v1/go-live/activate/${ch}`); },
  deactivateChannel: async (ch: string): Promise<void> => { await apiClient.post(`/v1/go-live/deactivate/${ch}`); },
  activateAll:       async (): Promise<void> => { await apiClient.post('/v1/go-live/activate-all'); },
  deactivateAll:     async (): Promise<void> => { await apiClient.post('/v1/go-live/deactivate-all'); },

  // Bot Settings (handoff + negotiation)
  getBotSettings: async () => apiClient.get('/v1/flows/active/bot-settings') as unknown as BotSettings,
  updateBotSettings: async (d: BotSettings) => apiClient.put('/v1/flows/active/bot-settings', d),

  // P3-007: Intent Import
  importParse:   async (d: ImportParseRequest): Promise<ImportParseResponse> => apiClient.post('/v1/intents/import/parse', d) as unknown as ImportParseResponse,
  importEnrich:  async (d: ImportEnrichRequest): Promise<{ rows: ImportRow[] }> => apiClient.post('/v1/intents/import/enrich', d, { timeout: LLM_TIMEOUT }) as unknown as { rows: ImportRow[] },
  importConfirm: async (d: ImportConfirmRequest): Promise<{ importedCount: number }> => apiClient.post('/v1/intents/import/confirm', d) as unknown as { importedCount: number },
} as const;
