import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Info, Loader2, ShieldAlert } from 'lucide-react';
import { stylemintMlOutputsApi, reasonLabel } from '../api/stylemint-ml-outputs.api';
import { ROUTES } from '@/app/router/route-paths';

const PAGE_SIZE = 25;

const score = (value: number | null | undefined) =>
  value == null ? '—' : value.toFixed(2);
const when = (value: string | undefined) =>
  value ? new Intl.DateTimeFormat('en-CD', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';

/**
 * Orders stylemint-ai recommends a person reviews. Read only by design (proposal Section 5.9):
 * there is no action on this page; any decision is taken in the ordinary order tools.
 */
export function OrderRiskReviewPage() {
  const [skip, setSkip] = useState(0);
  const query = useQuery({
    queryKey: ['stylemint-ml-order-risk', skip],
    queryFn: () => stylemintMlOutputsApi.orderRiskReviewQueue(skip, PAGE_SIZE),
    retry: false,
  });
  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const first = items[0];

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6">
      <header className="flex items-start gap-3">
        <span className="rounded-xl bg-amber-50 p-2 text-amber-700"><ShieldAlert className="h-6 w-6" /></span>
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Order risk review</h1>
          <p className="text-sm text-slate-500">
            Orders the risk model suggests a person looks at, highest score first.
          </p>
        </div>
      </header>

      <div role="note" className="flex items-start gap-2 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm font-medium text-sky-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        Recommendations only — no order is blocked or changed automatically.
      </div>

      {query.isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {(query.error as Error).message === 'NOT_DEPLOYED'
            ? 'The order-risk review queue is not deployed on this Stylemint environment yet.'
            : `The review queue could not be loaded: ${(query.error as Error).message}`}
        </div>
      )}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 p-5 text-sm text-slate-500">
          <span>{total} order{total === 1 ? '' : 's'} recommended for review</span>
          {first && <span>Model {first.modelVersion} · as of {when(first.asOf)}</span>}
        </div>
        {query.isLoading ? (
          <div className="flex h-40 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-emerald-600" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Rule score</th>
                  <th className="px-5 py-3">Anomaly score</th>
                  <th className="px-5 py-3">Reasons</th>
                  <th className="px-5 py-3">As of</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No orders are recommended for review right now.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.orderId}>
                      <td className="px-5 py-4 font-semibold">
                        <Link
                          className="text-emerald-700 hover:underline"
                          to={`${ROUTES.dashboard.stylemintOrders}?q=${encodeURIComponent(item.orderId)}`}
                        >
                          {item.orderId}
                        </Link>
                      </td>
                      <td className="px-5 py-4 tabular-nums">{score(item.ruleScore)}</td>
                      <td className="px-5 py-4 tabular-nums">{score(item.anomalyScore)}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {item.reasons.map((code) => (
                            <span key={code} title={code} className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                              {reasonLabel(code)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-500">{when(item.asOf)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 p-4 text-sm">
          <span className="mr-2 text-slate-500">
            {total === 0 ? '0' : `${skip + 1}–${Math.min(skip + PAGE_SIZE, total)}`} of {total}
          </span>
          <button
            aria-label="Previous page"
            disabled={skip === 0}
            onClick={() => setSkip(Math.max(0, skip - PAGE_SIZE))}
            className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            aria-label="Next page"
            disabled={skip + PAGE_SIZE >= total}
            onClick={() => setSkip(skip + PAGE_SIZE)}
            className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
}

export const Component = OrderRiskReviewPage;
