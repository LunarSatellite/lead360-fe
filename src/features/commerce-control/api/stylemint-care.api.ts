import { stylemintOperationsApi } from './stylemint-operations.api';

/**
 * Order-care themes: what is going wrong with orders, grouped by cause, over a window.
 *
 * Each theme names the area accountable for it, which is the point — this is the read that turns
 * a pile of individual support tickets into "fulfilment is behind" or "the carrier is dropping
 * handovers". SupportAgent.
 */

export type CareTheme = {
  code: string;
  accountableArea: string;
  openCount: number;
} & Record<string, unknown>;

export type CareThemeReport = {
  windowDays: number;
  generatedUtc: string;
  themes: CareTheme[];
};

function unwrap<T>(response: { status: number; body: unknown }): T {
  if (response.status >= 200 && response.status < 300) return response.body as T;

  const body = response.body as { title?: string; message?: string } | undefined;
  const detail = body?.title ?? body?.message;

  if (response.status === 403) {
    throw new Error(
      detail ?? 'Order-care themes take the Stylemint SupportAgent role.',
    );
  }
  throw new Error(detail ?? `The order-care surface returned HTTP ${response.status}.`);
}

export const stylemintCareApi = {
  themes: async (windowDays = 30): Promise<CareThemeReport> =>
    unwrap<CareThemeReport>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: 'v1/admin/orders/care/themes',
        query: `windowDays=${windowDays}`,
      }),
    ),
};
