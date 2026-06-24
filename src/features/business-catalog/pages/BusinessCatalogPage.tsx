// ═══════════════════════════════════════════════════════════════
// BusinessCatalogPage — main page with Profile / Catalog / Inbox tabs
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { Boxes, Settings, Inbox, Loader2, AlertCircle } from 'lucide-react';
import { useBusinessProfile } from '../api/business-catalog.queries';
import { BusinessProfileForm } from '../components/BusinessProfileForm';
import { CategoryListSection } from '../components/CategoryListSection';
import { ItemListSection } from '../components/ItemListSection';
import { TransactionListSection } from '../components/TransactionListSection';
import type { BusinessProfile, CatalogCategory } from '../types/business-catalog.types';

type Tab = 'profile' | 'catalog' | 'inbox';

export function BusinessCatalogPage() {
  const { data, isLoading, isError, error } = useBusinessProfile();

  const profile = data as BusinessProfile | undefined;
  const hasProfile = !!profile;
  const isNotConfigured = isError && (error as any)?.status === 404;

  const [tab, setTab] = useState<Tab>(hasProfile ? 'inbox' : 'profile');

  // null = show category list; CatalogCategory = drilled into that category's items
  const [selectedCategory, setSelectedCategory] = useState<CatalogCategory | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16">
        <Loader2 className="w-5 h-5 text-text-muted animate-spin" />
        <span className="text-sm text-text-muted">Loading…</span>
      </div>
    );
  }

  if (!hasProfile || isNotConfigured) {
    return (
      <div className="space-y-5">
        <Header subtitle="Set up your business profile to start capturing customer requests." />

        <div className="rounded-2xl bg-warning-soft border border-warning/30 px-4 py-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" strokeWidth={2} />
          <div>
            <div className="text-xs font-bold text-text-primary">Profile not set up yet</div>
            <p className="text-[11px] text-text-muted">
              Pick a business type below and we'll prefill sensible defaults — you can edit anything.
            </p>
          </div>
        </div>

        <BusinessProfileForm existing={undefined} onSaved={() => setTab('catalog')} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Header
        subtitle={`Managing ${profile!.catalogLabel.toLowerCase()} and ${profile!.transactionLabel.toLowerCase()}s for your business.`}
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border-subtle">
        <TabButton active={tab === 'inbox'} icon={<Inbox className="w-3.5 h-3.5" />} onClick={() => setTab('inbox')}>
          Inbox
        </TabButton>
        <TabButton active={tab === 'catalog'} icon={<Boxes className="w-3.5 h-3.5" />} onClick={() => { setTab('catalog'); setSelectedCategory(null); }}>
          {profile!.catalogLabel}
        </TabButton>
        <TabButton active={tab === 'profile'} icon={<Settings className="w-3.5 h-3.5" />} onClick={() => setTab('profile')}>
          Profile
        </TabButton>
      </div>

      {/* Body */}
      {tab === 'inbox' && <TransactionListSection transactionLabel={profile!.transactionLabel} />}

      {tab === 'catalog' && (
        <div className="space-y-5">
          {selectedCategory ? (
            // ── Drilled in: show only items for the selected category ──
            <ItemListSection
              itemLabel={profile!.itemLabel}
              selectedCategory={selectedCategory}
              onBack={() => setSelectedCategory(null)}
            />
          ) : (
            // ── Top level: show category list + full item list below ──
            <>
              <CategoryListSection
                parentLabel="Category"
                onSelectCategory={(cat) => setSelectedCategory(cat)}
              />
              <ItemListSection itemLabel={profile!.itemLabel} />
            </>
          )}
        </div>
      )}

      {tab === 'profile' && (
        <BusinessProfileForm existing={profile} onSaved={() => {}} />
      )}
    </div>
  );
}

function Header({ subtitle }: { subtitle: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand-soft">
        <Boxes className="w-4 h-4 text-brand" strokeWidth={1.6} />
      </div>
      <div>
        <h3 className="text-lg font-extrabold text-text-primary tracking-tight">Business Catalog</h3>
        <p className="text-xs text-text-muted">{subtitle}</p>
      </div>
    </div>
  );
}

function TabButton({
  active,
  icon,
  onClick,
  children,
}: {
  active: boolean;
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex items-center gap-1.5 px-4 py-2 -mb-px text-xs font-bold border-b-2 transition-colors',
        active
          ? 'border-brand text-text-primary'
          : 'border-transparent text-text-muted hover:text-text-secondary',
      ].join(' ')}
    >
      {icon}
      {children}
    </button>
  );
}

export { BusinessCatalogPage as Component };