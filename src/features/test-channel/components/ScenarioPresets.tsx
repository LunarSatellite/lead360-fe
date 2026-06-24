import {
  User, ShoppingCart, Calendar, Wrench, MessageCircle,
  RotateCcw, AlertTriangle, List, HelpCircle, Loader2,
} from 'lucide-react';
import { useBusinessProfile, useCategories } from '@/features/business-catalog/api/business-catalog.queries';
import { CatalogCategoryType } from '@/features/business-catalog/types/business-catalog.types';
import type { CatalogCategory, BusinessProfile } from '@/features/business-catalog/types/business-catalog.types';
import type { ScenarioPreset } from '../types/test-channel.types';

// ─── Scenario builder — uses real tenant data ────────────────────────────────

function buildScenarios(
  categories: CatalogCategory[],
  catalogLabel: string,
  itemLabel: string,
  profileTransactionLabel: string,
): ScenarioPreset[] {
  const active = categories.filter(c => c.isActive && c.itemCount > 0);

  // Pick first product category (type=0 or no type set), first service category (type=1)
  const productCat = active.find(c => c.categoryType === CatalogCategoryType.Product)
    ?? active.find(c => c.categoryType === null)
    ?? active[0];
  const serviceCat = active.find(c => c.categoryType === CatalogCategoryType.Service);

  const productLabel = productCat?.transactionLabel ?? profileTransactionLabel ?? 'Order';
  const serviceLabel = serviceCat?.transactionLabel ?? 'Book';
  const prodName = productCat?.name ?? catalogLabel ?? 'products';
  const svcName = serviceCat?.name ?? 'services';

  const scenarios: ScenarioPreset[] = [];

  // ── 1. Browse & order a product ──────────────────────────────────
  if (productCat) {
    scenarios.push({
      label: `Browse & ${productLabel}`,
      description: `Browse ${prodName} → view ${itemLabel.toLowerCase()} details → complete ${productLabel.toLowerCase()}. Fills name, phone, qty slots.`,
      messages: [
        `Show me ${prodName.toLowerCase()}`,
        '1',
        `What does this ${itemLabel.toLowerCase()} include?`,
        productLabel,
        'Test User',
        '+977-9800000001',
        '1',
      ],
      icon: 'ShoppingCart',
      color: 'brand',
    });
  }

  // ── 2. Book a service (only if service category exists) ──────────
  if (serviceCat) {
    scenarios.push({
      label: `${serviceLabel} a Service`,
      description: `Browse ${svcName} → select item → ${serviceLabel.toLowerCase()}. Tests: service category with per-category behavior flags (Issue 1 — category-level TransactionLabel = "${serviceLabel}").`,
      messages: [
        `I need ${svcName.toLowerCase()}`,
        '1',
        serviceLabel,
        'Test User',
        '+977-9800000002',
      ],
      icon: 'Calendar',
      color: 'info',
    });
  }

  // ── 3. Mixed — product order + service booking ───────────────────
  if (productCat && serviceCat) {
    scenarios.push({
      label: 'Product + Service',
      description: `Same business: ${productLabel} from "${prodName}" (Product) then ${serviceLabel} from "${svcName}" (Service). Tests: per-category TransactionLabel switching.`,
      messages: [
        `Show me ${prodName.toLowerCase()}`,
        '1',
        productLabel,
        'Test User',
        '+977-9800000003',
        '1',
        'menu',
        `I need ${svcName.toLowerCase()}`,
        '1',
        serviceLabel,
        'Test User',
        '+977-9800000003',
      ],
      icon: 'Wrench',
      color: 'warning',
    });
  }

  // ── 4. Smart fallback — questions that won't match menu rules ────
  scenarios.push({
    label: 'Smart Fallback',
    description: `4 realistic questions that don't match any menu rule. Tests: LLM smart reply using ${prodName} context — no "I didn't understand" response.`,
    messages: [
      `Do you deliver ${prodName.toLowerCase()} outside the city?`,
      'What is the return policy?',
      'Are there any discounts right now?',
      'Do you accept online payment?',
    ],
    icon: 'MessageCircle',
    color: 'info',
  });

  // ── 5. Chat mode ─────────────────────────────────────────────────
  scenarios.push({
    label: 'Chat Mode',
    description: `Switch to LLM free chat → ask about the business → return to menu. Tests: ConversationMode.Chat, system prompt with ${prodName} context, "menu" exit.`,
    messages: [
      'chat',
      `Tell me about your ${prodName.toLowerCase()}`,
      'What makes you different from others?',
      'menu',
    ],
    icon: 'HelpCircle',
    color: 'success',
  });

  // ── 6. Mid-flow cancel and restart ──────────────────────────────
  if (productCat) {
    scenarios.push({
      label: 'Mid-flow Reset',
      description: `Start ${productLabel.toLowerCase()} → fill name → type "menu" to cancel mid-order → restart. Tests: __cat_* slot cleanup on menu command.`,
      messages: [
        `Show me ${prodName.toLowerCase()}`,
        '1',
        productLabel,
        'Test User',
        'menu',
        `Show me ${prodName.toLowerCase()} again`,
        '1',
        productLabel,
        'Test User',
        '+977-9800000004',
        '1',
      ],
      icon: 'RotateCcw',
      color: 'warning',
    });
  }

  // ── 7. Menu navigation ──────────────────────────────────────────
  scenarios.push({
    label: 'Menu Navigation',
    description: 'Walk menu using numbered replies and "back". Tests: number selection, back command, condition rule matching.',
    messages: ['1', '2', 'back', '1', '3'],
    icon: 'List',
    color: 'brand',
  });

  // ── 8. New customer greeting ─────────────────────────────────────
  scenarios.push({
    label: 'New Customer',
    description: `Fresh greeting → sees main menu → picks option 1. Tests: entry flow, greeting node, first condition node. ${active.length} active ${active.length === 1 ? 'category' : 'categories'} available.`,
    messages: ['Hello', 'menu', '1'],
    icon: 'User',
    color: 'success',
  });

  // ── 9. Agent escalation ──────────────────────────────────────────
  scenarios.push({
    label: 'Agent Escalation',
    description: 'Customer frustrated → escalates to human. Tests: IntentGate frustration detection, AgentHandoff routing, session status = AgentHandoff.',
    messages: [
      'this is not what I ordered',
      'I am very disappointed with your service',
      'I want to speak to a real person now',
    ],
    icon: 'AlertTriangle',
    color: 'danger',
  });

  return scenarios;
}

// ─── Static fallback when catalog is not yet configured ──────────────────────

const FALLBACK_SCENARIOS: ScenarioPreset[] = [
  {
    label: 'New Customer',
    description: 'Greeting → main menu → pick option 1',
    messages: ['Hello', '1'],
    icon: 'User',
    color: 'success',
  },
  {
    label: 'Smart Fallback',
    description: 'Questions that don\'t match any rule — tests LLM smart reply',
    messages: ['What are your opening hours?', 'Do you offer discounts?', 'How do I contact you?'],
    icon: 'MessageCircle',
    color: 'info',
  },
  {
    label: 'Chat Mode',
    description: 'Free LLM conversation → return to menu',
    messages: ['chat', 'Tell me about your business', 'menu'],
    icon: 'HelpCircle',
    color: 'success',
  },
  {
    label: 'Menu Navigation',
    description: 'Numbered replies and back command',
    messages: ['1', '2', 'back', '3'],
    icon: 'List',
    color: 'brand',
  },
  {
    label: 'Agent Escalation',
    description: 'Frustration → handoff to human agent',
    messages: ['this is terrible service', 'I want to talk to a person'],
    icon: 'AlertTriangle',
    color: 'danger',
  },
];

// ─── Icon + color maps ───────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  User, ShoppingCart, Calendar, Wrench, MessageCircle,
  RotateCcw, AlertTriangle, List, HelpCircle,
};

const COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  success: { bg: 'bg-success-soft', text: 'text-success', border: 'border-[rgba(6,214,160,0.15)]' },
  brand:   { bg: 'bg-brand-soft',   text: 'text-brand',   border: 'border-brand' },
  info:    { bg: 'bg-info-soft',    text: 'text-info',     border: 'border-[rgba(59,130,246,0.12)]' },
  warning: { bg: 'bg-warning-soft', text: 'text-warning',  border: 'border-[rgba(245,158,11,0.12)]' },
  danger:  { bg: 'bg-danger-soft',  text: 'text-danger',   border: 'border-[rgba(244,63,94,0.12)]' },
};

// ─── Component ───────────────────────────────────────────────────────────────

interface ScenarioPresetsProps {
  onRun: (messages: string[]) => void;
  disabled?: boolean;
}

export function ScenarioPresets({ onRun, disabled }: ScenarioPresetsProps) {
  const { data: profileData, isLoading: profileLoading } = useBusinessProfile();
  const { data: catsData, isLoading: catsLoading } = useCategories(true);

  const profile = profileData as BusinessProfile | undefined;
  const categories: CatalogCategory[] = (catsData as any) ?? [];

  const isLoading = profileLoading || catsLoading;

  const presets = categories.length > 0 && profile
    ? buildScenarios(
        categories,
        profile.catalogLabel,
        profile.itemLabel,
        profile.transactionLabel,
      )
    : FALLBACK_SCENARIOS;

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[9px] font-bold uppercase tracking-[2px] text-text-muted">
          Test scenarios
        </div>
        {isLoading && <Loader2 className="w-3 h-3 animate-spin text-text-muted" />}
        {!isLoading && categories.length > 0 && (
          <div className="text-[9px] text-text-muted">
            {categories.length} {categories.length === 1 ? 'category' : 'categories'}
          </div>
        )}
      </div>

      {!isLoading && categories.length === 0 && (
        <div className="text-[10px] text-text-muted bg-glass-1 rounded-lg px-3 py-2 border border-border-subtle mb-2">
          No catalog configured yet — showing generic scenarios. Add categories &amp; items in the Catalog page to get business-specific tests.
        </div>
      )}

      {presets.map((preset) => {
        const Icon = ICON_MAP[preset.icon] ?? User;
        const color = COLOR_MAP[preset.color];
        return (
          <button
            key={preset.label}
            onClick={() => onRun(preset.messages)}
            disabled={disabled}
            title={preset.description}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-150
                       hover:bg-glass-2 hover:border-border-medium disabled:opacity-40 disabled:cursor-not-allowed
                       bg-glass-1 border-border-subtle text-left`}
          >
            <div className={`w-8 h-8 rounded-lg ${color.bg} ${color.border} border flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-4 h-4 ${color.text}`} strokeWidth={1.6} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-text-primary">{preset.label}</div>
              <div className="text-[10px] text-text-muted line-clamp-2">{preset.description}</div>
            </div>
            <div className="text-[9px] font-semibold text-text-muted flex-shrink-0">
              {preset.messages.length} msg{preset.messages.length > 1 ? 's' : ''}
            </div>
          </button>
        );
      })}
    </div>
  );
}
