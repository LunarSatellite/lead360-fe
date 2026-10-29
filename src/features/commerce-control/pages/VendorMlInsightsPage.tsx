import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, MapPinned, Sparkles, Users } from 'lucide-react';
import { stylemintMlOutputsApi, summariseProfile } from '../api/stylemint-ml-outputs.api';

const errorText = (error: unknown) => {
  const message = (error as Error)?.message;
  return message === 'NOT_DEPLOYED'
    ? 'ML insights are not deployed on this Stylemint environment yet.'
    : `Could not load: ${message}`;
};

/**
 * Vendor-facing aggregates from stylemint-ai: demand gaps in the shop's categories and regions,
 * and audience segments of at least 50 people. No individual shopper is ever shown.
 */
export function VendorMlInsightsPage() {
  const gaps = useQuery({
    queryKey: ['stylemint-ml-insights', 'demand-gaps'],
    queryFn: () => stylemintMlOutputsApi.demandGaps(50),
    retry: false,
  });
  const segments = useQuery({
    queryKey: ['stylemint-ml-insights', 'audience-segments'],
    queryFn: stylemintMlOutputsApi.audienceSegments,
    retry: false,
  });

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6">
      <header className="flex items-start gap-3">
        <span className="rounded-xl bg-emerald-50 p-2 text-emerald-700"><Sparkles className="h-6 w-6" /></span>
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Shop insights</h1>
          <p className="text-sm text-slate-500">
            Where demand outpaces supply in your categories and regions, and the shopper groups buying across Stylemint.
            Aggregates only — no individual shopper is identified.
          </p>
        </div>
      </header>

      <Panel title="Demand gaps" subtitle="Regions and categories where shoppers look for more than is on offer." icon={<MapPinned className="h-5 w-5 text-slate-400" />}>
        {gaps.isLoading ? <Spinner /> : gaps.isError ? <ErrorRow text={errorText(gaps.error)} /> : (gaps.data ?? []).length === 0 ? (
          <Empty text="No demand gaps yet. They appear once there is enough search and order activity in your categories and regions." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr><th className="px-5 py-3">Region</th><th className="px-5 py-3">Category</th><th className="px-5 py-3">Score</th><th className="px-5 py-3">Evidence</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(gaps.data ?? []).map((gap) => (
                  <tr key={`${gap.region}|${gap.category}`}>
                    <td className="px-5 py-4 font-semibold">{gap.region}</td>
                    <td className="px-5 py-4">{gap.category}</td>
                    <td className="px-5 py-4 tabular-nums">{gap.score.toFixed(2)}</td>
                    <td className="px-5 py-4 text-slate-600">{gap.evidence ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Audience segments" subtitle="Groups of at least 50 shoppers with similar tastes." icon={<Users className="h-5 w-5 text-slate-400" />}>
        {segments.isLoading ? <Spinner /> : segments.isError ? <ErrorRow text={errorText(segments.error)} /> : (segments.data ?? []).length === 0 ? (
          <Empty text="No audience segments yet. They appear once enough shoppers have been active to form groups of 50 or more." />
        ) : (
          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {(segments.data ?? []).map((segment) => (
              <article key={segment.segment} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-semibold text-slate-900">{segment.segment}</h3>
                  <span className="text-sm text-slate-500">{segment.size.toLocaleString()} shoppers</span>
                </div>
                <ul className="mt-3 space-y-1 text-sm text-slate-600">
                  {summariseProfile(segment.profile).map((line) => <li key={line}>{line}</li>)}
                </ul>
              </article>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function Panel({ title, subtitle, icon, children }: { title: string; subtitle: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <div><h2 className="text-lg font-bold text-slate-950">{title}</h2><p className="text-sm text-slate-500">{subtitle}</p></div>
        {icon}
      </div>
      {children}
    </section>
  );
}
function Spinner() { return <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>; }
function Empty({ text }: { text: string }) { return <div className="p-8 text-center text-sm text-slate-500">{text}</div>; }
function ErrorRow({ text }: { text: string }) { return <div className="m-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{text}</div>; }

export const Component = VendorMlInsightsPage;
