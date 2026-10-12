import { useState } from 'react';
import { Coins, Loader2, Lock, Star, Trash2 } from 'lucide-react';
import { useProfile } from '@/features/auth/api/auth.queries';
import { UserRole, type UserDto } from '@/features/auth/types/auth.types';
import {
  useCreateCurrency,
  useCurrencies,
  useDeleteCurrency,
  useSetBaseCurrency,
  useSetExchangeRate,
} from '../api/crm-currency.queries';
import type { CrmCurrencyDto } from '../types/crm-currency.types';
import { Button } from '@/shared/ui/primitives';

const field =
  'rounded-xl bg-bg-input border border-border-subtle px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand';

export function Component() {
  const { data: profile } = useProfile();
  const role = (profile as UserDto | undefined)?.role;
  const isManager = role === UserRole.Owner || role === UserRole.Admin;

  const { data, isLoading } = useCurrencies();
  const create = useCreateCurrency();
  const remove = useDeleteCurrency();
  const setBase = useSetBaseCurrency();
  const setRate = useSetExchangeRate();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [decimals, setDecimals] = useState(2);
  const [rates, setRates] = useState<Record<string, string>>({});

  if (profile && !isManager) {
    return (
      <div className="py-16 text-center">
        <Lock className="w-8 h-8 text-text-muted mx-auto mb-3" />
        <h1 className="text-lg font-bold text-text-primary">Restricted</h1>
        <p className="text-sm text-text-muted mt-1">
          Currencies are managed by Owners and Admins.
        </p>
      </div>
    );
  }

  const rows = (data?.items ?? []) as CrmCurrencyDto[];
  const base = rows.find((c) => c.isBaseCurrency);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    create.mutate(
      {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        symbol: symbol.trim() || null,
        decimalPlaces: decimals,
      },
      {
        onSuccess: () => {
          setCode('');
          setName('');
          setSymbol('');
        },
      }
    );
  };

  return (
    <div className="py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-brand-soft border border-border-glow flex items-center justify-center">
          <Coins className="w-6 h-6 text-brand" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Currencies</h1>
          <p className="text-sm text-text-muted">
            The currencies you trade in, and what each is worth against the base.
          </p>
        </div>
      </div>

      {rows.length > 0 && !base && (
        <p
          className="rounded-2xl border border-warning/20 bg-warning-soft px-5 py-4 text-sm text-text-secondary"
          data-testid="currency-no-base-warning"
        >
          <span className="font-semibold text-text-primary">No base currency.</span>{' '}
          Every rate is quoted against the base, so conversion has nothing to work
          from until you pick one.
        </p>
      )}

      <form
        onSubmit={submit}
        className="rounded-2xl border border-border-subtle bg-bg-card px-5 py-4 space-y-3"
      >
        <h2 className="text-sm font-semibold text-text-primary">Add a currency</h2>
        <div className="flex flex-wrap gap-3">
          <input
            aria-label="Currency code"
            required
            maxLength={3}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="EUR"
            className={`w-24 ${field} uppercase`}
          />
          <input
            aria-label="Currency name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Euro"
            className={`flex-1 min-w-[160px] ${field}`}
          />
          <input
            aria-label="Currency symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="€"
            className={`w-20 ${field}`}
          />
          <input
            aria-label="Decimal places"
            type="number"
            min={0}
            max={6}
            value={decimals}
            onChange={(e) => setDecimals(Number(e.target.value))}
            className={`w-24 ${field}`}
          />
          <Button
            type="submit"
            disabled={create.isPending || !code.trim() || !name.trim()}
            variant="primary"
          >
            Add
          </Button>
        </div>
      </form>

      <div className="rounded-2xl border border-border-subtle bg-bg-card px-5 py-4">
        {isLoading ? (
          <div className="flex justify-center py-12 text-text-muted">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-12">
            No currencies yet — everything is priced in one, and nothing converts.
          </p>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {rows.map((c) => (
              <li key={c.id} className="py-3 flex items-center gap-3 flex-wrap">
                <div className="min-w-[160px]">
                  <p className="text-sm text-text-primary font-medium">
                    {c.code}
                    {c.symbol ? ` · ${c.symbol}` : ''}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {c.name} · {c.decimalPlaces} dp
                  </p>
                </div>

                {c.isBaseCurrency ? (
                  <span className="flex items-center gap-1 rounded-full border border-border-glow bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand">
                    <Star className="w-3 h-3" /> Base
                  </span>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <input
                        aria-label={`Rate for ${c.code}`}
                        type="number"
                        step="0.0001"
                        min={0}
                        value={rates[c.id] ?? ''}
                        onChange={(e) =>
                          setRates((r) => ({ ...r, [c.id]: e.target.value }))
                        }
                        placeholder="Rate"
                        className={`w-28 ${field}`}
                      />
                      <button
                        onClick={() =>
                          setRate.mutate({
                            currencyId: c.id,
                            rate: Number(rates[c.id]),
                          })
                        }
                        disabled={
                          setRate.isPending ||
                          !rates[c.id] ||
                          Number(rates[c.id]) <= 0
                        }
                        className="rounded-xl border border-border-medium px-3 py-1.5 text-xs font-semibold text-text-secondary hover:border-border-glow disabled:opacity-40"
                      >
                        Save rate
                      </button>
                    </div>
                    <button
                      onClick={() => setBase.mutate(c.id)}
                      disabled={setBase.isPending}
                      className="rounded-xl border border-border-medium px-3 py-1.5 text-xs font-semibold text-text-secondary hover:border-border-glow disabled:opacity-40"
                    >
                      Make base
                    </button>
                  </>
                )}

                <button
                  aria-label={`Remove ${c.code}`}
                  onClick={() => remove.mutate(c.id)}
                  disabled={remove.isPending || c.isBaseCurrency}
                  title={
                    c.isBaseCurrency
                      ? 'Move the base elsewhere before removing this one'
                      : undefined
                  }
                  className="ml-auto rounded-xl border border-border-medium p-1.5 text-text-muted hover:text-danger-light hover:border-danger/20 disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {base && (
        <p className="text-xs text-text-muted">
          Rates are read against{' '}
          <span className="text-text-secondary font-semibold">{base.code}</span>:
          one unit of a currency is worth that many {base.code}.
        </p>
      )}
    </div>
  );
}
