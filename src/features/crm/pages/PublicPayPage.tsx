import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CheckCircle2, Loader2, CreditCard, AlertCircle } from 'lucide-react';
import { crmApi } from '../api/crm.api';
import type { CrmInvoicePublicDto } from '../types/crm.types';

const money = (n: number, ccy: string) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: ccy || 'USD' }).format(n || 0);

function PublicPayPage() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['public-invoice', token],
    queryFn: () => crmApi.getPublicInvoice(token!) as Promise<CrmInvoicePublicDto>,
    enabled: !!token,
    retry: false,
  });

  const pay = useMutation({
    mutationFn: () => crmApi.payPublicInvoice(token!),
    onSuccess: () => refetch(),
  });

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8">{children}</div>
    </div>
  );

  if (isLoading) return shell(<div className="flex items-center justify-center py-8 text-gray-400"><Loader2 className="w-6 h-6 animate-spin" /></div>);

  if (error || !data) return shell(
    <div className="text-center space-y-3">
      <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" strokeWidth={1.4} />
      <h1 className="text-lg font-bold text-gray-900">Payment link not found</h1>
      <p className="text-sm text-gray-500">This link may have expired or is no longer valid. Please contact us for an updated link.</p>
    </div>
  );

  const paid = data.isPaid || pay.isSuccess;

  return shell(
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-indigo-600">
        <CreditCard className="w-5 h-5" />
        <span className="text-sm font-semibold">Invoice {data.invoiceNumber}</span>
      </div>

      <div className="rounded-xl bg-gray-50 border border-gray-100 p-5 text-center">
        <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">Amount due</p>
        <p className="text-4xl font-extrabold text-gray-900 mt-1 tabular-nums">{money(data.totalAmount, data.currencyCode)}</p>
        <p className="text-xs text-gray-500 mt-2">Due {new Date(data.dueDate).toLocaleDateString()}</p>
      </div>

      {paid ? (
        <div className="flex flex-col items-center gap-2 py-2 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" strokeWidth={1.5} />
          <p className="text-lg font-bold text-gray-900">Payment received</p>
          <p className="text-sm text-gray-500">Thank you — your invoice is now marked as paid.</p>
        </div>
      ) : (
        <>
          <button
            onClick={() => pay.mutate()}
            disabled={pay.isPending}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {pay.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            Pay {money(data.totalAmount, data.currencyCode)}
          </button>
          {pay.isError && <p className="text-xs text-rose-500 text-center">Something went wrong. Please try again.</p>}
          <p className="text-[11px] text-gray-400 text-center">Secured payment · powered by Lead360</p>
        </>
      )}
    </div>
  );
}

export { PublicPayPage as Component };
export default PublicPayPage;
