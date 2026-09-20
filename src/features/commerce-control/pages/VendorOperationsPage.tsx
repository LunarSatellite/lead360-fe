import { lazy, Suspense, useMemo, useState } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  BadgeCheck,
  BarChart3,
  Boxes,
  Building2,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  LayoutDashboard,
  Loader2,
  PackageOpen,
  MessageSquareText,
  Plus,
  QrCode,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Store,
  Tags,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { stylemintCommerceApi } from '../api/stylemint-commerce.api';
import { ProductComposer } from '../components/ProductComposer';
import { VendorProfileEditor } from '../components/VendorProfileEditor';
import { VendorResourceEditDialog } from '../components/VendorResourceEditDialog';
import { CollectionEditDialog } from '../components/CollectionEditDialog';
import { CampaignConfigDialog } from '../components/CampaignConfigDialog';
import { BriefEditDialog } from '../components/BriefEditDialog';
import { RecipeAttachmentDialog } from '../components/RecipeAttachmentDialog';
import { RecipeEditDialog } from '../components/RecipeEditDialog';
import { VendorCollaborationDialog } from '../components/VendorCollaborationDialog';
import { VendorInsightDialog } from '../components/VendorInsightDialog';
import { useAuth } from '@/shared/hooks/useAuth';
import { UserRole } from '@/features/auth/types/auth.types';
import { buildVendorRecipePayload } from '../lib/vendor-recipe';

const VendorAnalyticsPanel = lazy(() =>
  import('../components/VendorAnalyticsPanel').then((module) => ({
    default: module.VendorAnalyticsPanel,
  })),
);

const resources = [
  {
    key: 'dashboard',
    label: 'Vendor dashboard',
    description: 'Complete view of commercial operations.',
    icon: LayoutDashboard,
  },
  {
    key: 'synchronization',
    label: 'Synchronization',
    description: 'Live status of catalogue, orders, content and customers.',
    icon: RefreshCw,
  },
  {
    key: 'products',
    label: 'Products',
    description: 'Catalogue, variants, stock, media and publishing.',
    icon: Boxes,
  },
  {
    key: 'collections',
    label: 'Collections',
    description: 'Assortments, ordering and publishing.',
    icon: Tags,
  },
  {
    key: 'stores',
    label: 'Stores',
    description: 'Kin Marche retail locations and availability.',
    icon: Store,
  },
  {
    key: 'team',
    label: 'Seller team',
    description: 'Invitations, roles and operational access.',
    icon: Users,
  },
  {
    key: 'profile',
    label: 'Seller profile',
    description: 'Commercial identity and store pickup.',
    icon: Building2,
  },
  {
    key: 'codes',
    label: 'Store codes',
    description: 'Product QR codes and scan statistics.',
    icon: QrCode,
  },
  {
    key: 'returns',
    label: 'Returns',
    description: 'Accept, reject and complete returns.',
    icon: RotateCcw,
  },
  {
    key: 'warranties/claims',
    label: 'Warranties',
    description: 'Policies and warranty claim handling.',
    icon: ShieldCheck,
  },
  {
    key: 'inquiries',
    label: 'Customer inquiries',
    description: 'Answer product inquiries from Lead360.',
    icon: MessageSquareText,
  },
  {
    key: 'campaigns',
    label: 'Campaigns',
    description: 'Briefs, approval, activation and results.',
    icon: ClipboardList,
  },
  {
    key: 'briefs',
    label: 'Campaign briefs',
    description: 'Scope, locking, variants and expected-return calculation.',
    icon: ClipboardList,
  },
  {
    key: 'recipes',
    label: 'Content recipes',
    description: 'Reusable templates for producing commercial reels.',
    icon: PackageOpen,
  },
  {
    key: 'partnerships',
    label: 'Seller partnerships',
    description: 'Invitations, commissions and contracts; creators respond in the mobile app.',
    icon: Users,
  },
  {
    key: 'squads',
    label: 'Campaign squads',
    description: 'CDF budgets and seller invitations; creators participate in the mobile app.',
    icon: Users,
  },
  {
    key: 'retainers',
    label: 'Monthly retainers',
    description: 'Recurring engagements, deliverables, suspension and resumption.',
    icon: ClipboardList,
  },
  {
    key: 'matches',
    label: 'Opportunities',
    description: 'Commercial recommendations to invite or dismiss.',
    icon: BadgeCheck,
  },
  {
    key: 'pricing/suggestions',
    label: 'Recommended pricing',
    description: 'Demand-based pricing suggestions with controlled application.',
    icon: CircleDollarSign,
  },
  {
    key: 'pricing/flash-sales',
    label: 'Flash sales',
    description: 'Limited promotions, volume controls and incrementality measurement.',
    icon: Tags,
  },
  {
    key: 'store/sponsored',
    label: 'Sponsored products',
    description: 'Exposure limits, schedules and transparent pause controls.',
    icon: Store,
  },
  {
    key: 'store/actions',
    label: 'Recommended actions',
    description: 'Stock, content and promotion priorities with estimated value.',
    icon: ClipboardList,
  },
  {
    key: 'store/digital-twin',
    label: 'Store twin',
    description: 'Real-time stock, sales and commercial capacity.',
    icon: Activity,
  },
  {
    key: 'demand-signals',
    label: 'Demand signals',
    description: 'Popular searches and unmet demand to replenish.',
    icon: BarChart3,
  },
  {
    key: 'intent-decision-board',
    label: 'Assortment decisions',
    description: 'Ranked customer intent to guide catalogue and stock.',
    icon: BadgeCheck,
  },
  {
    key: 'analytics',
    label: 'Seller analytics',
    description: 'Sales, conversion, products and quality.',
    icon: BarChart3,
  },
  {
    key: 'analytics/products',
    label: 'Product performance',
    description: 'Detailed catalogue conversion and performance.',
    icon: BarChart3,
  },
  {
    key: 'analytics/creators',
    label: 'Partner performance',
    description: 'Attribution, conversions and commercial returns without managing creator profiles.',
    icon: Users,
  },
  {
    key: 'creator-performance',
    label: 'Sales attribution',
    description: 'Sales and orders generated by partner content.',
    icon: TrendingUp,
  },
  {
    key: 'activity',
    label: 'Activity',
    description: 'Audited history of vendor actions.',
    icon: Activity,
  },
  {
    key: 'growth-quality',
    label: 'Growth & quality',
    description: 'Operational performance indicators.',
    icon: BadgeCheck,
  },
] as const;

function countRows(value: unknown): number | null {
  if (Array.isArray(value)) return value.length;
  if (!value || typeof value !== 'object') return null;
  const data = value as Record<string, unknown>;
  for (const key of ['items', 'data', 'results', 'claims', 'entries']) {
    if (Array.isArray(data[key])) return data[key].length;
  }
  for (const key of ['totalCount', 'total', 'count']) {
    if (typeof data[key] === 'number') return data[key] as number;
  }
  return null;
}

function toRows(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value))
    return value.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object');
  if (!value || typeof value !== 'object') return [];
  const data = value as Record<string, unknown>;
  for (const key of ['items', 'data', 'results', 'claims', 'entries']) {
    if (Array.isArray(data[key])) return toRows(data[key]);
  }
  return [];
}

export function VendorOperationsPage() {
  const { user } = useAuth();
  const canOperate = user?.role === UserRole.Owner || user?.role === UserRole.Admin;
  const [selectedKey, setSelectedKey] = useState<string>('dashboard');
  const [actionMessage, setActionMessage] = useState('');
  const [showStoreForm, setShowStoreForm] = useState(false);
  const [showProductComposer, setShowProductComposer] = useState(false);
  const [showCollectionForm, setShowCollectionForm] = useState(false);
  const [showBriefForm, setShowBriefForm] = useState(false);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    brandBriefId: '',
    name: '',
    budgetAmount: '',
    budgetCurrency: 'CDF',
  });
  const [briefForm, setBriefForm] = useState({
    title: '',
    primaryGoal: '1',
    productVariantIds: '',
  });
  const [showPartnershipForm, setShowPartnershipForm] = useState(false);
  const [creatorSearch, setCreatorSearch] = useState('');
  const [partnershipForm, setPartnershipForm] = useState({
    creatorProfileId: '',
    commissionMinPercent: '5',
    commissionMaxPercent: '15',
    brandBriefId: '',
  });
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [collaborationDialog, setCollaborationDialog] = useState<'squad' | 'retainer' | null>(null);
  const [insightDialog, setInsightDialog] = useState<{ title: string; subtitle: string; data: unknown } | null>(null);
  const [recipeForm, setRecipeForm] = useState({
    title: '',
    musicTrackRefId: '',
    productVariantIds: '',
    brandStoryAnchor: '',
    moodLabel: 'Chaleureux',
    durationSeconds: '40',
    songTitle: '',
    artist: '',
    caption: '',
  });
  const [storeForm, setStoreForm] = useState({
    name: '',
    addressLine: '',
    city: 'Kinshasa',
    phone: '',
    latitude: '',
    longitude: '',
  });
  const [collectionForm, setCollectionForm] = useState({
    title: '',
    slug: '',
    subtitle: '',
    description: '',
    coverImageUrl: '',
    sortOrder: '0',
  });
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [teamForm, setTeamForm] = useState({ memberAccountId: '', role: '3' });
  const [showCodeForm, setShowCodeForm] = useState(false);
  const [codeForm, setCodeForm] = useState({
    kind: 'Store' as 'Store' | 'ProductTag',
    storeId: '',
    productId: '',
    label: '',
  });
  const [collectionManageId, setCollectionManageId] = useState<string | null>(null);
  const [collectionEditTarget, setCollectionEditTarget] = useState<{ id: string; row: Record<string, unknown> } | null>(null);
  const [campaignConfigId, setCampaignConfigId] = useState<string | null>(null);
  const [briefEditId, setBriefEditId] = useState<string | null>(null);
  const [recipeAttachmentId, setRecipeAttachmentId] = useState<string | null>(null);
  const [recipeEditId, setRecipeEditId] = useState<string | null>(null);
  const [showWarrantyPolicyForm, setShowWarrantyPolicyForm] = useState(false);
  const [warrantyPolicyForm, setWarrantyPolicyForm] = useState({
    variantId: '',
    coverageDays: '30',
    terms: '',
  });
  const [editTarget, setEditTarget] = useState<{
    kind: 'product' | 'store';
    id: string;
    row: Record<string, unknown>;
  } | null>(null);
  const queryClient = useQueryClient();
  const queries = useQueries({
    queries: resources.map((resource) => ({
      queryKey: ['stylemint-vendor', resource.key],
      queryFn: () => stylemintCommerceApi.vendorResource(resource.key),
      retry: false,
    })),
  });
  const selectedIndex = resources.findIndex((item) => item.key === selectedKey);
  const selected = resources[selectedIndex];
  const selectedQuery = queries[selectedIndex];
  const rows = useMemo(() => toRows(selectedQuery?.data), [selectedQuery?.data]);
  const partnershipCreators = useQuery({
    queryKey: ['stylemint-vendor', 'partnership-creators', creatorSearch],
    queryFn: () => stylemintCommerceApi.vendorPartnershipCreators(creatorSearch.trim()),
    enabled: showPartnershipForm,
    retry: false,
  });
  const creatorOptions = useMemo(() => toRows(partnershipCreators.data), [partnershipCreators.data]);
  const rowAction = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) => {
      if (selectedKey === 'returns') {
        const payload =
          action === 'reject' ? { reason: window.prompt('Rejection reason') || 'Operator rejection' } : undefined;
        return stylemintCommerceApi.returnAction(id, action as 'accept' | 'complete' | 'reject', payload);
      }
      if (selectedKey === 'products' && action === 'stock') {
        const variantId = window.prompt('Variant ID');
        const quantity = window.prompt('New available quantity');
        if (!variantId || quantity === null || !Number.isInteger(Number(quantity)) || Number(quantity) < 0)
          return Promise.reject(new Error('A valid variant and quantity are required'));
        return stylemintCommerceApi.updateVendorStock(id, {
          adjustments: [{ variantId, quantity: Number(quantity) }],
          alertCustomersOnRestock: Number(quantity) > 0,
        });
      }
      if (selectedKey === 'stores') return stylemintCommerceApi.archiveVendorStore(id);
      if (selectedKey === 'inquiries') {
        const reply = window.prompt('Reply to the customer');
        if (!reply?.trim()) return Promise.reject(new Error('Reply required'));
        return stylemintCommerceApi.replyToVendorInquiry(id, reply.trim());
      }
      if (selectedKey === 'warranties/claims') {
        if (action === 'approve' || action === 'reject') {
          const approve = action === 'approve';
          const resolutionKind = approve
            ? Number(
                window.prompt('Resolution: 1 reparation, 2 remplacement, 3 remboursement, 4 conseil') || '0',
              )
            : undefined;
          if (approve && ![1, 2, 3, 4].includes(resolutionKind!))
            return Promise.reject(new Error('Invalid resolution'));
          const note =
            window.prompt(approve ? 'Decision note' : 'Rejection reason') ||
            (approve ? 'Approved by Kin Marche' : 'Rejected by Kin Marche');
          return stylemintCommerceApi.vendorWarrantyAction(id, 'decision', { approve, resolutionKind, note });
        }
        const note =
          action === 'resolve' ? window.prompt('Resolution note') || 'Resolution terminee' : undefined;
        return stylemintCommerceApi.vendorWarrantyAction(
          id,
          action as 'start' | 'resolve',
          note ? { note } : undefined,
        );
      }
      if (selectedKey === 'team') {
        if (action === 'accept') return stylemintCommerceApi.acceptVendorTeamInvitation(id);
        if (action === 'role') {
          const newRole = Number(window.prompt('New role: 2 = Admin, 3 = Member') || '0');
          if (![2, 3].includes(newRole)) return Promise.reject(new Error('Invalid role'));
          return stylemintCommerceApi.changeVendorTeamRole(id, newRole);
        }
        const reason = window.prompt('Removal reason') || 'Access removed from Lead360';
        return stylemintCommerceApi.removeVendorTeamMember(id, reason);
      }
      if (selectedKey === 'campaigns')
        return stylemintCommerceApi.vendorCampaignAction(id, action as 'approve' | 'activate' | 'refresh');
      if (selectedKey === 'briefs')
        return stylemintCommerceApi.vendorBriefAction(id, action as 'lock' | 'fork' | 'retire' | 'recompute-roi');
      if (selectedKey === 'recipes')
        return stylemintCommerceApi.vendorRecipeAction(id, action as 'lock' | 'fork' | 'retire');
      if (selectedKey === 'partnerships') {
        if (action === 'coverage')
          return stylemintCommerceApi.vendorPartnershipInsurance(id).then((result) => {
            setInsightDialog({ title: 'Partnership coverage', subtitle: 'Current insurance protection and limits.', data: result });
            return result;
          });
        if (action === 'prediction')
          return stylemintCommerceApi.vendorPartnershipPrediction(id).then((result) => {
            setInsightDialog({
              title: 'Campaign forecast',
              subtitle: 'Stylemint projection before committing to the partnership.',
              data: result,
            });
            return result;
          });
        if (action === 'analytics')
          return stylemintCommerceApi.vendorPartnershipCreatorAnalytics(id).then((result) => {
            setInsightDialog({
              title: 'Partnership attribution',
              subtitle: 'Conversions and value attributed to the partner.',
              data: result,
            });
            return result;
          });
        if (action === 'insurance') {
          const coverageAmount = Number(window.prompt('Cover amount in CDF', '100000') || '0');
          if (!Number.isFinite(coverageAmount) || coverageAmount <= 0)
            return Promise.reject(new Error('Invalid cover'));
          return stylemintCommerceApi.purchaseVendorPartnershipInsurance(id, coverageAmount);
        }
        if (action === 'claims')
          return stylemintCommerceApi.vendorPartnershipInsuranceClaims(id).then((result) => {
            setInsightDialog({
              title: 'Partnership claims',
              subtitle: 'Cover and handling history.',
              data: result,
            });
            return result;
          });
        if (action === 'file-claim') {
          const claimAmount = Number(window.prompt('Claim amount in CDF') || '0');
          const reason = window.prompt('Detailed reason for the claim')?.trim();
          const evidenceUrls = (window.prompt('Evidence URLs, comma separated') || '')
            .split(',').map((value) => value.trim()).filter(Boolean);
          if (!Number.isFinite(claimAmount) || claimAmount <= 0 || !reason)
            return Promise.reject(new Error('Invalid claim'));
          return stylemintCommerceApi.fileVendorPartnershipInsuranceClaim(id, {
            claimAmount, currency: 'CDF', reason, evidenceUrls,
          });
        }
        if (action === 'adjust-commission') {
          const commissionMinPercent = Number(window.prompt('Commission minimale (%)', '5') || '-1');
          const commissionMaxPercent = Number(window.prompt('Commission maximale (%)', '15') || '-1');
          if (
            commissionMinPercent < 0 ||
            commissionMaxPercent > 100 ||
            commissionMinPercent > commissionMaxPercent
          )
            return Promise.reject(new Error('Invalid commission'));
          return stylemintCommerceApi.vendorPartnershipAction(id, action, {
            commissionMinPercent,
            commissionMaxPercent,
            reason: 'Adjusted from Lead360',
          });
        }
        if (action === 'pause' || action === 'end') {
          const reason = window.prompt(
            action === 'end' ? 'Reason for ending the partnership' : 'Suspension reason',
          );
          if (action === 'end' && !reason?.trim())
            return Promise.reject(new Error('Reason required'));
          return stylemintCommerceApi.vendorPartnershipAction(id, action, { reason: reason?.trim() || null });
        }
        return stylemintCommerceApi.vendorPartnershipAction(
          id,
          action as 'accept-request' | 'decline-request' | 'pause' | 'resume' | 'end',
        );
      }
      if (selectedKey === 'squads') {
        const creatorAccountId = window.prompt('Creator account ID')?.trim();
        const budgetShare = Number(window.prompt('Budget share in CDF') || '0');
        if (!creatorAccountId || !Number.isFinite(budgetShare) || budgetShare <= 0)
          return Promise.reject(new Error('Invalid invitation'));
        return stylemintCommerceApi.inviteVendorSquadCreator(id, creatorAccountId, budgetShare);
      }
      if (selectedKey === 'retainers')
        return stylemintCommerceApi.vendorRetainerAction(id, action as 'pause' | 'resume' | 'cancel');
      if (selectedKey === 'matches')
        return stylemintCommerceApi.vendorMatchAction(id, action as 'invite' | 'dismiss');
      if (selectedKey === 'pricing/suggestions')
        return stylemintCommerceApi.applyPricingSuggestion(id);
      if (selectedKey === 'pricing/flash-sales')
        return stylemintCommerceApi.flashSaleIncrementality(id).then((result) => {
          setActionMessage(`Analyse: ${JSON.stringify(result).slice(0, 280)}`);
          return result;
        });
      if (selectedKey === 'store/sponsored') {
        if (action === 'pause') return stylemintCommerceApi.pauseSponsorship(id);
        const dailyImpressionCap = Number(window.prompt('Plafond quotidien d’impressions', '1000') || '0');
        const endsLocal = window.prompt('Fin de campagne (AAAA-MM-JJTHH:mm)', '');
        if (!dailyImpressionCap || !endsLocal) return Promise.reject(new Error('Parameters required'));
        return stylemintCommerceApi.sponsorProduct(id, { dailyImpressionCap, endsUtc: new Date(endsLocal).toISOString() });
      }
      if (selectedKey === 'collections')
        return stylemintCommerceApi.vendorCollectionAction(id, action as 'publish' | 'archive');
      if (selectedKey === 'codes') {
        if (action === 'stats')
          return stylemintCommerceApi.vendorCodeStats(id).then((stats) => {
            const scans = stats.scanCount ?? stats.totalScans ?? stats.count ?? 0;
            setActionMessage(`Statistiques ${id}: ${String(scans)} scans.`);
            return stats;
          });
        return stylemintCommerceApi.revokeVendorCode(id);
      }
      return stylemintCommerceApi.vendorProductAction(id, action as 'publish' | 'archive');
    },
    onSuccess: async (_data, variables) => {
      if (!(selectedKey === 'codes' && variables.action === 'stats'))
        setActionMessage('Action applied successfully.');
      await queryClient.invalidateQueries({ queryKey: ['stylemint-vendor', selectedKey] });
    },
    onError: () => setActionMessage('Action failed. Check the status and your Stylemint permissions.'),
  });
  const createStore = useMutation({
    mutationFn: () =>
      stylemintCommerceApi.createVendorStore({
        name: storeForm.name.trim(),
        addressLine: storeForm.addressLine.trim(),
        city: storeForm.city.trim(),
        phone: storeForm.phone.trim() || undefined,
        latitude: storeForm.latitude ? Number(storeForm.latitude) : undefined,
        longitude: storeForm.longitude ? Number(storeForm.longitude) : undefined,
      }),
    onSuccess: async () => {
      setActionMessage('Store created and synchronised with Stylemint.');
      setShowStoreForm(false);
      setStoreForm({ name: '', addressLine: '', city: 'Kinshasa', phone: '', latitude: '', longitude: '' });
      await queryClient.invalidateQueries({ queryKey: ['stylemint-vendor', 'stores'] });
    },
    onError: () => setActionMessage('Could not create. Check the fields and the vendor token.'),
  });
  const createCollection = useMutation({
    mutationFn: () =>
      stylemintCommerceApi.createVendorCollection({
        kind: 3,
        title: collectionForm.title.trim(),
        slug: collectionForm.slug.trim().toLowerCase(),
        subtitle: collectionForm.subtitle.trim() || undefined,
        description: collectionForm.description.trim() || undefined,
        coverImageUrl: collectionForm.coverImageUrl.trim() || undefined,
        sortOrder: Number(collectionForm.sortOrder),
      }),
    onSuccess: async () => {
      setActionMessage('Collection created and synchronised with Stylemint.');
      setShowCollectionForm(false);
      setCollectionForm({
        title: '',
        slug: '',
        subtitle: '',
        description: '',
        coverImageUrl: '',
        sortOrder: '0',
      });
      await queryClient.invalidateQueries({ queryKey: ['stylemint-vendor', 'collections'] });
    },
    onError: () =>
      setActionMessage('Could not create. Use a valid lowercase slug and an HTTPS image.'),
  });
  const createBrief = useMutation({
    mutationFn: () =>
      stylemintCommerceApi.createVendorBrief({
        title: briefForm.title.trim(),
        primaryGoal: Number(briefForm.primaryGoal),
        productVariantIds: briefForm.productVariantIds
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
        currencyCode: 'CDF',
      }),
    onSuccess: async () => {
      setActionMessage('Commercial brief created in Stylemint.');
      setShowBriefForm(false);
      setBriefForm({ title: '', primaryGoal: '1', productVariantIds: '' });
      await queryClient.invalidateQueries({ queryKey: ['stylemint-vendor', 'briefs'] });
    },
    onError: () => setActionMessage('Could not create the brief. Check the product variants.'),
  });
  const createCampaign = useMutation({
    mutationFn: () =>
      stylemintCommerceApi.createVendorCampaign({
        brandBriefId: campaignForm.brandBriefId.trim(),
        name: campaignForm.name.trim(),
        budgetAmount: Number(campaignForm.budgetAmount),
        budgetCurrency: campaignForm.budgetCurrency,
      }),
    onSuccess: async () => {
      setActionMessage('Campaign workspace created and synchronized with Stylemint.');
      setShowCampaignForm(false);
      setCampaignForm({ brandBriefId: '', name: '', budgetAmount: '', budgetCurrency: 'CDF' });
      await queryClient.invalidateQueries({ queryKey: ['stylemint-vendor', 'campaigns'] });
    },
    onError: () => setActionMessage('Campaign creation failed. Check the brief, name and budget.'),
  });
  const invitePartnership = useMutation({
    mutationFn: () => {
      const minimum = Number(partnershipForm.commissionMinPercent);
      const maximum = Number(partnershipForm.commissionMaxPercent);
      if (minimum < 0 || maximum > 100 || minimum > maximum)
        return Promise.reject(new Error('Invalid commission'));
      return stylemintCommerceApi.inviteVendorPartnership({
        creatorProfileId: partnershipForm.creatorProfileId.trim(),
        commissionMinPercent: minimum,
        commissionMaxPercent: maximum,
        brandBriefId: partnershipForm.brandBriefId.trim() || undefined,
      });
    },
    onSuccess: async () => {
      setActionMessage('Partnership invitation sent from Lead360.');
      setShowPartnershipForm(false);
      setPartnershipForm({
        creatorProfileId: '',
        commissionMinPercent: '5',
        commissionMaxPercent: '15',
        brandBriefId: '',
      });
      await queryClient.invalidateQueries({ queryKey: ['stylemint-vendor', 'partnerships'] });
    },
    onError: () => setActionMessage('Could not invite. Check the profile, the brief and the commissions.'),
  });
  const createRecipe = useMutation({
    mutationFn: () => stylemintCommerceApi.createVendorRecipe(buildVendorRecipePayload(recipeForm)),
    onSuccess: async () => {
      setActionMessage('Complete reel recipe created in Stylemint.');
      setShowRecipeForm(false);
      setRecipeForm({
        title: '', musicTrackRefId: '', productVariantIds: '', brandStoryAnchor: '',
        moodLabel: 'Chaleureux', durationSeconds: '40', songTitle: '', artist: '', caption: '',
      });
      await queryClient.invalidateQueries({ queryKey: ['stylemint-vendor', 'recipes'] });
    },
    onError: () => setActionMessage('Could not create. Check the audio track, the variants and the duration.'),
  });
  const inviteTeamMember = useMutation({
    mutationFn: () =>
      stylemintCommerceApi.inviteVendorTeamMember(teamForm.memberAccountId.trim(), Number(teamForm.role)),
    onSuccess: async () => {
      setActionMessage('Vendor invitation created in Stylemint.');
      setShowTeamForm(false);
      setTeamForm({ memberAccountId: '', role: '3' });
      await queryClient.invalidateQueries({ queryKey: ['stylemint-vendor', 'team'] });
    },
    onError: () =>
      setActionMessage('Could not invite. Check the account ID and your vendor permissions.'),
  });
  const createCode = useMutation({
    mutationFn: () =>
      stylemintCommerceApi.createVendorCode({
        kind: codeForm.kind,
        storeId: codeForm.storeId.trim(),
        productId: codeForm.kind === 'ProductTag' ? codeForm.productId.trim() : undefined,
        label: codeForm.label.trim() || undefined,
      }),
    onSuccess: async () => {
      setActionMessage('Store code created and synchronised with Stylemint.');
      setShowCodeForm(false);
      setCodeForm({ kind: 'Store', storeId: '', productId: '', label: '' });
      await queryClient.invalidateQueries({ queryKey: ['stylemint-vendor', 'codes'] });
    },
    onError: () => setActionMessage('Could not create the code. Check the store and the product.'),
  });
  const collectionItems = useMutation({
    mutationFn: ({
      action,
      productId,
      productIds,
    }: {
      action: 'add' | 'remove' | 'reorder';
      productId?: string;
      productIds?: string[];
    }) => {
      if (!collectionManageId) return Promise.reject(new Error('No collection selected'));
      if (action === 'add')
        return stylemintCommerceApi.addVendorCollectionItem(collectionManageId, {
          productId: productId!,
          note: 'Added from Lead360',
        });
      if (action === 'remove')
        return stylemintCommerceApi.removeVendorCollectionItem(collectionManageId, productId!);
      return stylemintCommerceApi.reorderVendorCollectionItems(collectionManageId, productIds!);
    },
    onSuccess: async () => {
      setActionMessage('Collection products synchronised with Stylemint.');
      await queryClient.invalidateQueries({ queryKey: ['stylemint-vendor', 'collections'] });
    },
    onError: () =>
      setActionMessage('Could not change the collection. Check the product IDs.'),
  });
  const saveWarrantyPolicy = useMutation({
    mutationFn: () =>
      stylemintCommerceApi.upsertWarrantyPolicy(warrantyPolicyForm.variantId.trim(), {
        coverageDays: Number(warrantyPolicyForm.coverageDays),
        terms: warrantyPolicyForm.terms.trim(),
      }),
    onSuccess: async () => {
      setActionMessage('Warranty policy synchronised with Stylemint.');
      setShowWarrantyPolicyForm(false);
      setWarrantyPolicyForm({ variantId: '', coverageDays: '30', terms: '' });
      await queryClient.invalidateQueries({ queryKey: ['stylemint-vendor', 'warranties/claims'] });
    },
    onError: () =>
      setActionMessage('Invalid warranty policy. Check the variant and the terms.'),
  });

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <section className="relative overflow-hidden rounded-[26px] border border-brand/20 bg-gradient-to-br from-[#07130e] via-[#0a1511] to-[#11100a] p-6 md:p-8">
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-brand/15 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-brand">
              Stylemint Vendor OS
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl">
              Kin Marche Vendor Operations
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
              Products, stores, campaigns, returns, warranties and performance without exposing creator tools
              reserved for the mobile app.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <Building2 className="h-5 w-5 text-amber-300" />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">Workspace</p>
              <p className="text-sm font-extrabold text-white">Kin Marche · RDC</p>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-sky-400/20 bg-sky-400/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-400/10 text-sky-300">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-text-primary">A clear vendor–creator boundary</p>
            <p className="mt-1 text-[11px] leading-5 text-text-muted">
              Lead360 manages every vendor operation. Creator profiles, personal publishing, approvals and
              creator tools remain exclusively in the Stylemint mobile app.
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-sky-300">
          Creators · Mobile only
        </span>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {resources.map((resource, index) => {
          const query = queries[index];
          const count = countRows(query.data);
          const Icon = resource.icon;
          return (
            <button
              key={resource.key}
              onClick={() => setSelectedKey(resource.key)}
              className={`group rounded-2xl border p-4 text-left transition-all ${selectedKey === resource.key ? 'border-brand/40 bg-brand-soft shadow-[0_12px_35px_rgba(0,217,138,0.08)]' : 'border-border-subtle bg-bg-card hover:border-border-medium'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-bg-elevated">
                  <Icon
                    className={`h-4 w-4 ${selectedKey === resource.key ? 'text-brand' : 'text-text-muted'}`}
                  />
                </div>
                {query.isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-text-muted" />
                ) : query.isError ? (
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-success" />
                )}
              </div>
              <p className="mt-4 text-sm font-extrabold text-text-primary">{resource.label}</p>
              <p className="mt-1 min-h-8 text-[11px] leading-4 text-text-muted">{resource.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  {count === null ? (query.isSuccess ? 'Disponible' : 'A relier') : `${count} elements`}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-text-muted transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-card">
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft">
              <selected.icon className="h-4 w-4 text-brand" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-text-primary">{selected.label}</h2>
              <p className="text-[11px] text-text-muted">{selected.description}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {canOperate && selectedKey === 'store/digital-twin' && (
              <button
                onClick={async () => {
                  const name = window.prompt('Scenario name', 'Peak demand resilience')?.trim();
                  if (!name) return;
                  try {
                    const result = await stylemintCommerceApi.runVendorScenario({ name, seed: Date.now() % 2147483647, customerAgents: Number(window.prompt('Customer agents', '500') || '500'), days: Number(window.prompt('Simulation days', '30') || '30'), demandShockPercent: Number(window.prompt('Demand shock %', '25') || '25'), inventoryLossPercent: Number(window.prompt('Inventory loss %', '10') || '10'), fulfillmentCapacityLossPercent: Number(window.prompt('Fulfilment capacity loss %', '15') || '15') });
                    setInsightDialog({ title: 'Digital-twin scenario', subtitle: 'Simulated demand, stock and fulfilment resilience.', data: result });
                  } catch { setActionMessage('The scenario could not be completed. Check the simulation values.'); }
                }}
                className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-[11px] font-extrabold text-black"
              >
                <Activity className="h-3.5 w-3.5" /> Run scenario
              </button>
            )}
            {canOperate && selectedKey === 'products' && (
              <button
                onClick={() => setShowProductComposer(true)}
                className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-[11px] font-extrabold text-black"
              >
                <Plus className="h-3.5 w-3.5" />
                New product
              </button>
            )}
            {canOperate && selectedKey === 'collections' && (
              <button
                onClick={() => setShowCollectionForm((value) => !value)}
                className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-[11px] font-extrabold text-black"
              >
                <Plus className="h-3.5 w-3.5" />
                New collection
              </button>
            )}
            {canOperate && selectedKey === 'briefs' && (
              <button
                onClick={() => setShowBriefForm((value) => !value)}
                className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-[11px] font-extrabold text-black"
              >
                <Plus className="h-3.5 w-3.5" />
                New brief
              </button>
            )}
            {canOperate && selectedKey === 'campaigns' && (
              <button
                onClick={() => setShowCampaignForm((value) => !value)}
                className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-[11px] font-extrabold text-black"
              >
                <Plus className="h-3.5 w-3.5" />
                New campaign
              </button>
            )}
            {canOperate && selectedKey === 'partnerships' && (
              <>
                <button
                  onClick={async () => {
                    const audience = window.prompt('Who can join? Separate criteria with commas') || '';
                    const rules = window.prompt('Reel rules. Separate rules with commas') || '';
                    const whoCanJoin = audience.split(',').map((value) => value.trim()).filter(Boolean);
                    const reelRules = rules.split(',').map((value) => value.trim()).filter(Boolean);
                    if (!whoCanJoin.length || !reelRules.length) return;
                    try {
                      await stylemintCommerceApi.publishVendorPartnershipTerms({
                        whoCanJoin: { heading: 'Who can join', bullets: whoCanJoin },
                        reelContentRules: {
                          heading: 'Reel content rules',
                          bullets: reelRules.map((text) => ({ text, inlineLinks: [] })),
                        },
                      });
                      setActionMessage('New terms version published.');
                    } catch { setActionMessage('Could not publish. Check the criteria and the rules.'); }
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-brand/30 px-3 py-2 text-[11px] font-extrabold text-brand"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Publier les conditions
                </button>
                <button
                  onClick={() => setShowPartnershipForm((value) => !value)}
                  className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-[11px] font-extrabold text-black"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Inviter un partenaire
                </button>
              </>
            )}
            {canOperate && selectedKey === 'squads' && (
              <button
                onClick={() => setCollaborationDialog('squad')}
                className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-[11px] font-extrabold text-black"
              >
                <Plus className="h-3.5 w-3.5" /> New squad
              </button>
            )}
            {canOperate && selectedKey === 'retainers' && (
              <button
                onClick={() => setCollaborationDialog('retainer')}
                className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-[11px] font-extrabold text-black"
              >
                <Plus className="h-3.5 w-3.5" /> New contract
              </button>
            )}
            {canOperate && selectedKey === 'recipes' && (
              <button
                onClick={() => setShowRecipeForm((value) => !value)}
                className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-[11px] font-extrabold text-black"
              >
                <Plus className="h-3.5 w-3.5" />
                New recipe
              </button>
            )}
            {canOperate && selectedKey === 'stores' && (
              <button
                onClick={() => setShowStoreForm((value) => !value)}
                className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-[11px] font-extrabold text-black"
              >
                <Plus className="h-3.5 w-3.5" />
                New store
              </button>
            )}
            {canOperate && selectedKey === 'team' && (
              <button
                onClick={() => setShowTeamForm((value) => !value)}
                className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-[11px] font-extrabold text-black"
              >
                <Plus className="h-3.5 w-3.5" />
                Inviter
              </button>
            )}
            {canOperate && selectedKey === 'codes' && (
              <button
                onClick={() => setShowCodeForm((value) => !value)}
                className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-[11px] font-extrabold text-black"
              >
                <Plus className="h-3.5 w-3.5" />
                New code
              </button>
            )}
            {canOperate && selectedKey === 'warranties/claims' && (
              <button
                onClick={() => setShowWarrantyPolicyForm((value) => !value)}
                className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-[11px] font-extrabold text-black"
              >
                <Plus className="h-3.5 w-3.5" />
                Politique de garantie
              </button>
            )}
            {canOperate && selectedKey === 'pricing/flash-sales' && (
              <button
                onClick={async () => {
                  const productId = window.prompt('Product ID');
                  const salePrice = Number(window.prompt('Prix promotionnel CDF') || '0');
                  const start = window.prompt('Debut (AAAA-MM-JJTHH:mm)');
                  const end = window.prompt('Fin (AAAA-MM-JJTHH:mm)');
                  const maxUnits = Number(window.prompt('Nombre maximal d’unites', '100') || '0');
                  if (!productId || !salePrice || !start || !end || !maxUnits) return;
                  try {
                    await stylemintCommerceApi.createFlashSale({ productId, salePrice, startUtc: new Date(start).toISOString(), endUtc: new Date(end).toISOString(), maxUnits });
                    setActionMessage('Vente flash creee.');
                    await selectedQuery.refetch();
                  } catch { setActionMessage('Could not create. Check the product, the dates and the price.'); }
                }}
                className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-[11px] font-extrabold text-black"
              >
                <Plus className="h-3.5 w-3.5" /> New flash sale
              </button>
            )}
            <button
              onClick={() => selectedQuery.refetch()}
              className="rounded-lg border border-border-subtle p-2 text-text-muted hover:text-brand"
            >
              <RefreshCw className={`h-4 w-4 ${selectedQuery.isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        {selectedKey === 'campaigns' && showCampaignForm && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              createCampaign.mutate();
            }}
            className="grid gap-3 border-b border-border-subtle bg-bg-elevated p-5 md:grid-cols-2 xl:grid-cols-4"
          >
            <Field
              label="Brand brief ID"
              value={campaignForm.brandBriefId}
              onChange={(value) => setCampaignForm((form) => ({ ...form, brandBriefId: value }))}
              required
            />
            <Field
              label="Campaign name"
              value={campaignForm.name}
              onChange={(value) => setCampaignForm((form) => ({ ...form, name: value }))}
              required
            />
            <Field
              label="Budget"
              value={campaignForm.budgetAmount}
              onChange={(value) => setCampaignForm((form) => ({ ...form, budgetAmount: value }))}
              type="number"
              required
            />
            <label className="space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">Currency</span>
              <select
                value={campaignForm.budgetCurrency}
                onChange={(event) => setCampaignForm((form) => ({ ...form, budgetCurrency: event.target.value }))}
                className="w-full rounded-xl border border-border-subtle bg-bg-card px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand/50"
              >
                <option value="CDF">CDF</option>
                <option value="USD">USD</option>
              </select>
            </label>
            <div className="flex justify-end md:col-span-2 xl:col-span-4">
              <button
                disabled={createCampaign.isPending || !campaignForm.brandBriefId.trim() || !campaignForm.name.trim() || Number(campaignForm.budgetAmount) <= 0}
                className="rounded-xl bg-brand px-5 py-2.5 text-xs font-extrabold text-black disabled:opacity-40"
              >
                {createCampaign.isPending ? 'Creating…' : 'Create campaign workspace'}
              </button>
            </div>
          </form>
        )}
        {selectedKey === 'briefs' && showBriefForm && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              createBrief.mutate();
            }}
            className="grid gap-3 border-b border-border-subtle bg-bg-elevated p-5 md:grid-cols-3"
          >
            <Field
              label="Brief title"
              value={briefForm.title}
              onChange={(value) => setBriefForm((form) => ({ ...form, title: value }))}
              required
            />
            <label className="space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">Objectif</span>
              <select
                value={briefForm.primaryGoal}
                onChange={(event) => setBriefForm((form) => ({ ...form, primaryGoal: event.target.value }))}
                className="w-full rounded-xl border border-border-subtle bg-bg-card px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand/50"
              >
                <option value="1">Premier achat</option>
                <option value="2">Re-engage customers</option>
                <option value="3">Launch a variant</option>
                <option value="4">Clear slow stock</option>
                <option value="5">Notoriete saisonniere</option>
                <option value="6">Educate on ’usage</option>
                <option value="7">Test an audience</option>
              </select>
            </label>
            <Field
              label="Variant IDs, comma separated"
              value={briefForm.productVariantIds}
              onChange={(value) => setBriefForm((form) => ({ ...form, productVariantIds: value }))}
              required
            />
            <div className="md:col-span-3 flex justify-end">
              <button
                disabled={createBrief.isPending || !briefForm.title.trim() || !briefForm.productVariantIds.trim()}
                className="rounded-xl bg-brand px-5 py-2.5 text-xs font-extrabold text-black disabled:opacity-40"
              >
                {createBrief.isPending ? 'Creation…' : 'Creer en CDF'}
              </button>
            </div>
          </form>
        )}
        {selectedKey === 'partnerships' && showPartnershipForm && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              invitePartnership.mutate();
            }}
            className="grid gap-3 border-b border-border-subtle bg-bg-elevated p-5 md:grid-cols-2 xl:grid-cols-5"
          >
            <Field
              label="Search for a partner"
              value={creatorSearch}
              onChange={setCreatorSearch}
            />
            <label className="space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">Partner</span>
              <select
                required
                value={partnershipForm.creatorProfileId}
                onChange={(event) =>
                  setPartnershipForm((form) => ({ ...form, creatorProfileId: event.target.value }))
                }
                className="w-full rounded-xl border border-border-subtle bg-bg-card px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand/50"
              >
                <option value="">
                  {partnershipCreators.isLoading ? 'Chargement…' : 'Select a partner'}
                </option>
                {creatorOptions.map((creator, index) => {
                  const id = String(creator.creatorProfileId ?? creator.id ?? '');
                  const name = String(
                    creator.displayName ?? creator.handle ?? creator.name ?? `Partenaire ${index + 1}`,
                  );
                  return id ? <option key={id} value={id}>{name}</option> : null;
                })}
              </select>
            </label>
            <Field
              label="Commission min. %"
              value={partnershipForm.commissionMinPercent}
              onChange={(value) => setPartnershipForm((form) => ({ ...form, commissionMinPercent: value }))}
              type="number"
              required
            />
            <Field
              label="Commission max. %"
              value={partnershipForm.commissionMaxPercent}
              onChange={(value) => setPartnershipForm((form) => ({ ...form, commissionMaxPercent: value }))}
              type="number"
              required
            />
            <Field
              label="ID brief (optionnel)"
              value={partnershipForm.brandBriefId}
              onChange={(value) => setPartnershipForm((form) => ({ ...form, brandBriefId: value }))}
            />
            <div className="md:col-span-2 xl:col-span-5 flex justify-end">
              <button
                disabled={invitePartnership.isPending || !partnershipForm.creatorProfileId.trim()}
                className="rounded-xl bg-brand px-5 py-2.5 text-xs font-extrabold text-black disabled:opacity-40"
              >
                {invitePartnership.isPending ? 'Envoi…' : 'Envoyer l’invitation'}
              </button>
            </div>
          </form>
        )}
        {selectedKey === 'recipes' && showRecipeForm && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              createRecipe.mutate();
            }}
            className="grid gap-3 border-b border-border-subtle bg-bg-elevated p-5 md:grid-cols-2 xl:grid-cols-3"
          >
            <Field label="Recipe title" value={recipeForm.title} onChange={(value) => setRecipeForm((form) => ({ ...form, title: value }))} required />
            <Field label="Music track ID" value={recipeForm.musicTrackRefId} onChange={(value) => setRecipeForm((form) => ({ ...form, musicTrackRefId: value }))} required />
            <Field label="Variant IDs, comma separated" value={recipeForm.productVariantIds} onChange={(value) => setRecipeForm((form) => ({ ...form, productVariantIds: value }))} required />
            <Field label="Anchor for the ’product story" value={recipeForm.brandStoryAnchor} onChange={(value) => setRecipeForm((form) => ({ ...form, brandStoryAnchor: value }))} required />
            <Field label="Ambiance" value={recipeForm.moodLabel} onChange={(value) => setRecipeForm((form) => ({ ...form, moodLabel: value }))} required />
            <Field label="Duree en secondes" value={recipeForm.durationSeconds} onChange={(value) => setRecipeForm((form) => ({ ...form, durationSeconds: value }))} type="number" required />
            <Field label="Music title" value={recipeForm.songTitle} onChange={(value) => setRecipeForm((form) => ({ ...form, songTitle: value }))} required />
            <Field label="Artiste" value={recipeForm.artist} onChange={(value) => setRecipeForm((form) => ({ ...form, artist: value }))} required />
            <Field label="Legende principale" value={recipeForm.caption} onChange={(value) => setRecipeForm((form) => ({ ...form, caption: value }))} required />
            <div className="md:col-span-2 xl:col-span-3 rounded-xl border border-brand/20 bg-brand-soft px-4 py-3 text-xs leading-5 text-text-secondary">
              Lead360 genere automatiquement trois scenes narratives, trois legendes, les adaptations Instagram, TikTok, YouTube Shorts et Facebook, ainsi que les signaux de raisonnement necessaires au verrouillage.
            </div>
            <div className="md:col-span-2 xl:col-span-3 flex justify-end">
              <button
                disabled={createRecipe.isPending || !recipeForm.title.trim() || !recipeForm.musicTrackRefId.trim() || !recipeForm.productVariantIds.trim() || !recipeForm.brandStoryAnchor.trim() || !recipeForm.songTitle.trim() || !recipeForm.artist.trim() || !recipeForm.caption.trim()}
                className="rounded-xl bg-brand px-5 py-2.5 text-xs font-extrabold text-black disabled:opacity-40"
              >
                {createRecipe.isPending ? 'Creation…' : 'Generate the full recipe'}
              </button>
            </div>
          </form>
        )}
        {selectedKey === 'stores' && showStoreForm && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              createStore.mutate();
            }}
            className="grid gap-3 border-b border-border-subtle bg-bg-elevated p-5 md:grid-cols-2 xl:grid-cols-3"
          >
            <Field
              label="Nom"
              value={storeForm.name}
              onChange={(value) => setStoreForm((form) => ({ ...form, name: value }))}
              required
            />
            <Field
              label="Adresse"
              value={storeForm.addressLine}
              onChange={(value) => setStoreForm((form) => ({ ...form, addressLine: value }))}
              required
            />
            <Field
              label="Ville"
              value={storeForm.city}
              onChange={(value) => setStoreForm((form) => ({ ...form, city: value }))}
              required
            />
            <Field
              label="Telephone"
              value={storeForm.phone}
              onChange={(value) => setStoreForm((form) => ({ ...form, phone: value }))}
            />
            <Field
              label="Latitude"
              value={storeForm.latitude}
              onChange={(value) => setStoreForm((form) => ({ ...form, latitude: value }))}
              type="number"
            />
            <Field
              label="Longitude"
              value={storeForm.longitude}
              onChange={(value) => setStoreForm((form) => ({ ...form, longitude: value }))}
              type="number"
            />
            <div className="md:col-span-2 xl:col-span-3 flex justify-end">
              <button
                disabled={
                  createStore.isPending ||
                  !storeForm.name.trim() ||
                  !storeForm.addressLine.trim() ||
                  !storeForm.city.trim()
                }
                className="rounded-xl bg-brand px-5 py-2.5 text-xs font-extrabold text-black disabled:opacity-40"
              >
                {createStore.isPending ? 'Creation…' : 'Create store'}
              </button>
            </div>
          </form>
        )}
        {selectedKey === 'collections' && showCollectionForm && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              createCollection.mutate();
            }}
            className="grid gap-3 border-b border-border-subtle bg-bg-elevated p-5 md:grid-cols-2 xl:grid-cols-3"
          >
            <Field
              label="Title"
              value={collectionForm.title}
              onChange={(value) => {
                setCollectionForm((form) => ({
                  ...form,
                  title: value,
                  slug:
                    form.slug ||
                    value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-|-$/g, ''),
                }));
              }}
              required
            />
            <Field
              label="Slug"
              value={collectionForm.slug}
              onChange={(value) => setCollectionForm((form) => ({ ...form, slug: value }))}
              required
            />
            <Field
              label="Subtitle"
              value={collectionForm.subtitle}
              onChange={(value) => setCollectionForm((form) => ({ ...form, subtitle: value }))}
            />
            <Field
              label="Cover image (HTTPS)"
              value={collectionForm.coverImageUrl}
              onChange={(value) => setCollectionForm((form) => ({ ...form, coverImageUrl: value }))}
            />
            <Field
              label="Description"
              value={collectionForm.description}
              onChange={(value) => setCollectionForm((form) => ({ ...form, description: value }))}
            />
            <Field
              label="Ordre"
              type="number"
              value={collectionForm.sortOrder}
              onChange={(value) => setCollectionForm((form) => ({ ...form, sortOrder: value }))}
            />
            <div className="md:col-span-2 xl:col-span-3 flex justify-end">
              <button
                disabled={
                  createCollection.isPending || !collectionForm.title.trim() || !collectionForm.slug.trim()
                }
                className="rounded-xl bg-brand px-5 py-2.5 text-xs font-extrabold text-black disabled:opacity-40"
              >
                {createCollection.isPending ? 'Creation…' : 'Create collection'}
              </button>
            </div>
          </form>
        )}
        {selectedKey === 'team' && showTeamForm && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              inviteTeamMember.mutate();
            }}
            className="grid gap-3 border-b border-border-subtle bg-bg-elevated p-5 md:grid-cols-[1fr_220px_auto] md:items-end"
          >
            <Field
              label="Member account ID"
              value={teamForm.memberAccountId}
              onChange={(value) => setTeamForm((form) => ({ ...form, memberAccountId: value }))}
              required
            />
            <label className="space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">
                Role vendeur
              </span>
              <select
                value={teamForm.role}
                onChange={(event) => setTeamForm((form) => ({ ...form, role: event.target.value }))}
                className="w-full rounded-xl border border-border-subtle bg-bg-card px-3 py-2.5 text-sm text-text-primary outline-none"
              >
                <option value="3">Member</option>
                <option value="2">Administrateur</option>
              </select>
            </label>
            <button
              disabled={inviteTeamMember.isPending || !teamForm.memberAccountId.trim()}
              className="rounded-xl bg-brand px-5 py-2.5 text-xs font-extrabold text-black disabled:opacity-40"
            >
              {inviteTeamMember.isPending ? 'Invitation…' : 'Envoyer invitation'}
            </button>
          </form>
        )}
        {selectedKey === 'codes' && showCodeForm && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              createCode.mutate();
            }}
            className="grid gap-3 border-b border-border-subtle bg-bg-elevated p-5 md:grid-cols-2 xl:grid-cols-4 xl:items-end"
          >
            <label className="space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">
                Type de code
              </span>
              <select
                value={codeForm.kind}
                onChange={(event) =>
                  setCodeForm((form) => ({ ...form, kind: event.target.value as 'Store' | 'ProductTag' }))
                }
                className="w-full rounded-xl border border-border-subtle bg-bg-card px-3 py-2.5 text-sm text-text-primary outline-none"
              >
                <option value="Store">Store</option>
                <option value="ProductTag">In-store product</option>
              </select>
            </label>
            <Field
              label="ID magasin"
              value={codeForm.storeId}
              onChange={(value) => setCodeForm((form) => ({ ...form, storeId: value }))}
              required
            />
            {codeForm.kind === 'ProductTag' && (
              <Field
                label="Product ID"
                value={codeForm.productId}
                onChange={(value) => setCodeForm((form) => ({ ...form, productId: value }))}
                required
              />
            )}
            <Field
              label="Libelle"
              value={codeForm.label}
              onChange={(value) => setCodeForm((form) => ({ ...form, label: value }))}
            />
            <button
              disabled={
                createCode.isPending ||
                !codeForm.storeId.trim() ||
                (codeForm.kind === 'ProductTag' && !codeForm.productId.trim())
              }
              className="rounded-xl bg-brand px-5 py-2.5 text-xs font-extrabold text-black disabled:opacity-40"
            >
              {createCode.isPending ? 'Creation…' : 'Create code'}
            </button>
          </form>
        )}
        {selectedKey === 'warranties/claims' && showWarrantyPolicyForm && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              saveWarrantyPolicy.mutate();
            }}
            className="grid gap-3 border-b border-border-subtle bg-bg-elevated p-5 md:grid-cols-[1fr_160px_2fr_auto] md:items-end"
          >
            <Field
              label="ID variante"
              value={warrantyPolicyForm.variantId}
              onChange={(value) => setWarrantyPolicyForm((form) => ({ ...form, variantId: value }))}
              required
            />
            <Field
              label="Coverage (days)"
              type="number"
              value={warrantyPolicyForm.coverageDays}
              onChange={(value) => setWarrantyPolicyForm((form) => ({ ...form, coverageDays: value }))}
              required
            />
            <Field
              label="Warranty terms"
              value={warrantyPolicyForm.terms}
              onChange={(value) => setWarrantyPolicyForm((form) => ({ ...form, terms: value }))}
              required
            />
            <button
              disabled={
                saveWarrantyPolicy.isPending ||
                !warrantyPolicyForm.variantId.trim() ||
                Number(warrantyPolicyForm.coverageDays) < 1 ||
                !warrantyPolicyForm.terms.trim()
              }
              className="rounded-xl bg-brand px-5 py-2.5 text-xs font-extrabold text-black disabled:opacity-40"
            >
              {saveWarrantyPolicy.isPending ? 'Saving…' : 'Save'}
            </button>
          </form>
        )}
        {actionMessage && (
          <div className="border-b border-border-subtle bg-bg-elevated px-5 py-2 text-xs font-semibold text-text-secondary">
            {actionMessage}
          </div>
        )}
        {selectedQuery.isLoading ? (
          <div className="flex h-56 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : selectedQuery.isError ? (
          <div className="flex h-56 flex-col items-center justify-center gap-2 px-6 text-center">
            <PackageOpen className="h-8 w-8 text-amber-400" />
            <p className="text-sm font-bold text-text-primary">Vendor connection unavailable</p>
            <p className="max-w-lg text-xs leading-5 text-text-muted">
              Configurez le jeton operateur Stylemint dans Lead360. Ce module utilisera ensuite les donnees
              reelles du vendeur.
            </p>
          </div>
        ) : selectedKey === 'profile' ? (
          <VendorProfileEditor
            data={selectedQuery.data}
            canOperate={canOperate}
            onSaved={() => selectedQuery.refetch()}
          />
        ) : rows.length ? (
          <ResourceTable
            rows={rows.slice(0, 25)}
            resource={selectedKey}
            busy={rowAction.isPending}
            canOperate={canOperate}
            onAction={(id, action, row) => {
              if (action === 'manage') setCollectionManageId(id);
              else if (action === 'edit' && selectedKey === 'collections') setCollectionEditTarget({ id, row });
              else if (action === 'configure' && selectedKey === 'campaigns') setCampaignConfigId(id);
              else if (action === 'edit' && selectedKey === 'briefs') setBriefEditId(id);
              else if (action === 'attachments' && selectedKey === 'recipes') setRecipeAttachmentId(id);
              else if (action === 'edit' && selectedKey === 'recipes') setRecipeEditId(id);
              else if (action === 'edit' && (selectedKey === 'products' || selectedKey === 'stores'))
                setEditTarget({ kind: selectedKey === 'products' ? 'product' : 'store', id, row });
              else rowAction.mutate({ id, action });
            }}
          />
        ) : selectedKey === 'analytics' ? (
          <Suspense
            fallback={
              <div className="flex h-56 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-brand" />
              </div>
            }
          >
            <VendorAnalyticsPanel data={selectedQuery.data} />
          </Suspense>
        ) : ['dashboard', 'growth-quality'].includes(selectedKey) ? (
          <MetricsPanel data={selectedQuery.data} />
        ) : (
          <div className="flex h-48 flex-col items-center justify-center gap-2">
            <CircleDollarSign className="h-8 w-8 text-brand/50" />
            <p className="text-sm font-bold text-text-primary">Connected module</p>
            <p className="text-xs text-text-muted">No records to display yet.</p>
          </div>
        )}
      </section>
      {showProductComposer && (
        <ProductComposer
          onClose={() => setShowProductComposer(false)}
          onDone={async () => {
            setShowProductComposer(false);
            setActionMessage('Product created and synchronized with Stylemint.');
            await queryClient.invalidateQueries({ queryKey: ['stylemint-vendor', 'products'] });
          }}
        />
      )}
      {collectionManageId && (
        <CollectionItemsDialog
          collectionId={collectionManageId}
          busy={collectionItems.isPending}
          onClose={() => setCollectionManageId(null)}
          onAction={(action, productId, productIds) =>
            collectionItems.mutate({ action, productId, productIds })
          }
        />
      )}
      {collectionEditTarget && (
        <CollectionEditDialog
          id={collectionEditTarget.id}
          initial={collectionEditTarget.row}
          onClose={() => setCollectionEditTarget(null)}
          onSaved={async () => {
            setCollectionEditTarget(null);
            setActionMessage('Collection updated and synchronized with Stylemint.');
            await queryClient.invalidateQueries({ queryKey: ['stylemint-vendor', 'collections'] });
          }}
        />
      )}
      {campaignConfigId && (
        <CampaignConfigDialog
          id={campaignConfigId}
          onClose={() => setCampaignConfigId(null)}
          onSaved={async () => {
            setCampaignConfigId(null);
            setActionMessage('Campaign configuration synchronized with Stylemint.');
            await queryClient.invalidateQueries({ queryKey: ['stylemint-vendor', 'campaigns'] });
          }}
        />
      )}
      {briefEditId && (
        <BriefEditDialog
          id={briefEditId}
          onClose={() => setBriefEditId(null)}
          onSaved={async () => {
            setBriefEditId(null);
            setActionMessage('Commercial brief updated in Stylemint.');
            await queryClient.invalidateQueries({ queryKey: ['stylemint-vendor', 'briefs'] });
          }}
        />
      )}
      {recipeAttachmentId && (
        <RecipeAttachmentDialog
          recipeId={recipeAttachmentId}
          onClose={() => setRecipeAttachmentId(null)}
          onDone={async (message) => {
            setRecipeAttachmentId(null);
            setActionMessage(message);
            await queryClient.invalidateQueries({ queryKey: ['stylemint-vendor', 'recipes'] });
          }}
        />
      )}
      {recipeEditId && (
        <RecipeEditDialog id={recipeEditId} onClose={() => setRecipeEditId(null)} onSaved={async () => { setRecipeEditId(null); setActionMessage('Recipe updated and synchronized with Stylemint.'); await queryClient.invalidateQueries({ queryKey: ['stylemint-vendor', 'recipes'] }); }} />
      )}
      {editTarget && (
        <VendorResourceEditDialog
          kind={editTarget.kind}
          id={editTarget.id}
          initial={editTarget.row}
          onClose={() => setEditTarget(null)}
          onSaved={async () => {
            const key = editTarget.kind === 'product' ? 'products' : 'stores';
            setEditTarget(null);
            setActionMessage('Changes synchronized with Stylemint.');
            await queryClient.invalidateQueries({ queryKey: ['stylemint-vendor', key] });
          }}
        />
      )}
      {collaborationDialog && (
        <VendorCollaborationDialog
          kind={collaborationDialog}
          onClose={() => setCollaborationDialog(null)}
          onDone={async () => {
            const key = collaborationDialog === 'squad' ? 'squads' : 'retainers';
            setActionMessage(collaborationDialog === 'squad' ? 'Escouade creee en CDF.' : 'Contrat mensuel propose.');
            setCollaborationDialog(null);
            await queryClient.invalidateQueries({ queryKey: ['stylemint-vendor', key] });
          }}
        />
      )}
      {insightDialog && (
        <VendorInsightDialog
          {...insightDialog}
          onClose={() => setInsightDialog(null)}
        />
      )}
    </div>
  );
}

function CollectionItemsDialog({
  collectionId,
  busy,
  onClose,
  onAction,
}: {
  collectionId: string;
  busy: boolean;
  onClose: () => void;
  onAction: (action: 'add' | 'remove' | 'reorder', productId?: string, productIds?: string[]) => void;
}) {
  const [productId, setProductId] = useState('');
  const [orderedIds, setOrderedIds] = useState('');
  const order = orderedIds
    .split(/[\s,]+/)
    .map((value) => value.trim())
    .filter(Boolean);
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button aria-label="Fermer" className="absolute inset-0 bg-black/75" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl border border-brand/20 bg-bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-brand">
              Assortiment Stylemint
            </p>
            <h3 className="mt-1 text-lg font-black text-text-primary">Collection products</h3>
            <p className="mt-1 font-mono text-[10px] text-text-muted">{collectionId}</p>
          </div>
          <button onClick={onClose}>
            <X className="h-4 w-4 text-text-muted" />
          </button>
        </div>
        <section className="mt-5 rounded-xl border border-border-subtle bg-bg-elevated p-4">
          <p className="text-xs font-extrabold text-text-primary">Add or remove a product</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
              placeholder="Product ID"
              className="min-w-0 flex-1 rounded-xl border border-border-subtle bg-bg-card px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand/50"
            />
            <button
              disabled={busy || !productId.trim()}
              onClick={() => onAction('add', productId.trim())}
              className="rounded-xl bg-brand px-4 py-2 text-xs font-extrabold text-black disabled:opacity-40"
            >
              Add
            </button>
            <button
              disabled={busy || !productId.trim()}
              onClick={() => onAction('remove', productId.trim())}
              className="rounded-xl border border-danger/25 px-4 py-2 text-xs font-bold text-danger disabled:opacity-40"
            >
              Remove
            </button>
          </div>
        </section>
        <section className="mt-3 rounded-xl border border-border-subtle bg-bg-elevated p-4">
          <p className="text-xs font-extrabold text-text-primary">Reorder collection</p>
          <p className="mt-1 text-[11px] text-text-muted">
            Entrez tous les identifiants produit dans l’ordre souhaite, separes par des virgules.
          </p>
          <textarea
            rows={4}
            value={orderedIds}
            onChange={(event) => setOrderedIds(event.target.value)}
            className="mt-3 w-full resize-y rounded-xl border border-border-subtle bg-bg-card px-3 py-2.5 font-mono text-xs text-text-primary outline-none focus:border-brand/50"
          />
          <button
            disabled={busy || order.length === 0}
            onClick={() => onAction('reorder', undefined, order)}
            className="mt-3 w-full rounded-xl bg-brand px-4 py-2.5 text-xs font-extrabold text-black disabled:opacity-40"
          >
            Save new order
          </button>
        </section>
      </div>
    </div>
  );
}

function ResourceTable({
  rows,
  resource,
  busy,
  canOperate,
  onAction,
}: {
  rows: Record<string, unknown>[];
  resource: string;
  busy: boolean;
  canOperate: boolean;
  onAction: (id: string, action: string, row: Record<string, unknown>) => void;
}) {
  const keys = Object.keys(rows[0] ?? {})
    .filter((key) => !['id', 'vendorAccountId'].includes(key))
    .slice(0, 6);
  const actionable =
    canOperate &&
    [
      'products',
      'collections',
      'returns',
      'stores',
      'codes',
      'inquiries',
      'warranties/claims',
      'team',
      'campaigns',
      'briefs',
      'recipes',
      'partnerships',
      'squads',
      'retainers',
      'matches',
      'pricing/suggestions',
      'pricing/flash-sales',
      'store/sponsored',
    ].includes(resource);
  const actions =
    resource === 'products'
      ? ['edit', 'stock', 'publish', 'archive']
      : resource === 'collections'
        ? ['edit', 'manage', 'publish', 'archive']
        : resource === 'returns'
          ? ['accept', 'complete', 'reject']
          : resource === 'codes'
            ? ['stats', 'revoke']
            : resource === 'inquiries'
              ? ['reply']
              : resource === 'warranties/claims'
                ? ['approve', 'reject', 'start', 'resolve']
                : resource === 'team'
                  ? ['accept', 'role', 'remove']
                  : resource === 'campaigns'
                    ? ['configure', 'approve', 'activate', 'refresh']
                    : resource === 'briefs'
                      ? ['edit', 'lock', 'fork', 'recompute-roi', 'retire']
                      : resource === 'recipes'
                        ? ['edit', 'attachments', 'lock', 'fork', 'retire']
                      : resource === 'partnerships'
                        ? ['prediction', 'analytics', 'coverage', 'insurance', 'claims', 'file-claim', 'adjust-commission', 'pause', 'resume', 'end']
                        : resource === 'squads'
                          ? ['invite']
                          : resource === 'retainers'
                            ? ['pause', 'resume', 'cancel']
                        : resource === 'matches'
                          ? ['invite', 'dismiss']
                    : resource === 'pricing/suggestions'
                      ? ['apply']
                      : resource === 'pricing/flash-sales'
                        ? ['incrementality']
                        : resource === 'store/sponsored'
                          ? ['configure', 'pause']
                    : resource === 'stores'
                      ? ['edit', 'archive']
                      : ['archive'];
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="bg-bg-elevated">
            {keys.map((key) => (
              <th
                key={key}
                className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-wider text-text-muted"
              >
                {fieldLabel(key)}
              </th>
            ))}
            {actionable && (
              <th className="px-4 py-3 text-right text-[10px] font-extrabold uppercase tracking-wider text-text-muted">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const identifier = String(resource === 'codes' ? (row.code ?? '') : (row.id ?? ''));
            return (
              <tr key={identifier || String(index)} className="border-t border-border-subtle">
                {keys.map((key) => (
                  <td key={key} className="max-w-[260px] truncate px-4 py-3 text-xs text-text-secondary">
                    {renderValue(row[key])}
                  </td>
                ))}
                {actionable && (
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {actions.map((action) => (
                        <button
                          key={action}
                          disabled={busy || !identifier}
                          onClick={() => onAction(identifier, action, row)}
                          className="rounded-lg border border-border-subtle px-2 py-1 text-[10px] font-bold uppercase text-text-secondary hover:border-brand/40 hover:text-brand disabled:opacity-40"
                        >
                          {actionLabel(action)}
                        </button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">{label}</span>
      <input
        type={type}
        step={type === 'number' ? 'any' : undefined}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-border-subtle bg-bg-card px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand/50"
      />
    </label>
  );
}

function renderValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (typeof value === 'object') return Array.isArray(value) ? `${value.length} elements` : 'Details';
  return String(value);
}

const ACTION_LABELS: Record<string, string> = {
  edit: 'Edit',
  stock: 'Stock',
  publish: 'Publish',
  archive: 'Archiver',
  manage: 'Products',
  accept: 'Accept',
  complete: 'Complete',
  reject: 'Reject',
  stats: 'Statistics',
  revoke: 'Revoke',
  reply: 'Reply',
  approve: 'Approve',
  start: 'Start',
  resolve: 'Resolve',
  role: 'Change role',
  remove: 'Remove',
  activate: 'Activate',
  refresh: 'Refresh',
  lock: 'Lock',
  fork: 'Duplicate',
  retire: 'Removed',
  'recompute-roi': 'Recalculate ROI',
  'accept-request': 'Accept',
  'decline-request': 'Decline',
  'adjust-commission': 'Commission',
  pause: 'Pause',
  resume: 'Resume',
  end: 'End',
  invite: 'Invite',
  dismiss: 'Dismiss',
  prediction: 'Forecast',
  analytics: 'Attribution',
  insurance: 'Insure',
  coverage: 'Coverage',
  claims: 'Claims',
  'file-claim': 'File claim',
  attachments: 'Brief links',
  cancel: 'Cancel',
};

const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  title: 'Title',
  state: 'Status',
  status: 'Status',
  code: 'Code',
  kind: 'Type',
  area: 'Service',
  reachable: 'Disponible',
  statusCode: 'Code HTTP',
  checkedUtc: 'Checked',
  createdUtc: 'Created',
  updatedUtc: 'Updated',
  publishedUtc: 'Published',
  expiresUtc: 'Expires',
  productCount: 'Products',
  itemCount: 'Items',
  scanCount: 'Scans',
  totalScans: 'Scans',
  priceAmount: 'Price',
  quantityOnHand: 'Stock',
  sku: 'SKU',
  city: 'City',
  addressLine: 'Address',
  role: 'Role',
  email: 'E-mail',
  displayName: 'Name',
  subject: 'Sujet',
  message: 'Message',
  orderNumber: 'Commande',
  totalAmount: 'Montant',
  currency: 'Currency',
  reason: 'Reason',
};
function actionLabel(action: string) {
  return ACTION_LABELS[action] ?? action;
}
function fieldLabel(key: string) {
  return FIELD_LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').trim();
}

function MetricsPanel({ data }: { data: unknown }) {
  const metrics = flattenMetrics(data).slice(0, 18);
  if (!metrics.length)
    return (
      <div className="flex h-48 items-center justify-center text-sm text-text-muted">
        No metrics available.
      </div>
    );
  return (
    <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
      {metrics.map(([label, value], index) => {
        const numeric = typeof value === 'number';
        const display = numeric ? value.toLocaleString('fr-CD', { maximumFractionDigits: 2 }) : String(value);
        return (
          <div
            key={label}
            className="relative overflow-hidden rounded-2xl border border-border-subtle bg-bg-elevated p-4"
          >
            <div
              className={`absolute inset-x-0 top-0 h-0.5 ${index % 3 === 0 ? 'bg-brand' : index % 3 === 1 ? 'bg-amber-300' : 'bg-sky-400'}`}
            />
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">
              {label.replace(/\./g, ' · ').replace(/([A-Z])/g, ' $1')}
            </p>
            <p className="mt-2 truncate text-2xl font-black tracking-tight text-text-primary">{display}</p>
          </div>
        );
      })}
    </div>
  );
}

function flattenMetrics(value: unknown, prefix = '', depth = 0): Array<[string, string | number | boolean]> {
  if (!value || typeof value !== 'object' || depth > 2) return [];
  const output: Array<[string, string | number | boolean]> = [];
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const label = prefix ? `${prefix}.${key}` : key;
    if (typeof child === 'number' || typeof child === 'string' || typeof child === 'boolean')
      output.push([label, child]);
    else if (child && typeof child === 'object' && !Array.isArray(child))
      output.push(...flattenMetrics(child, label, depth + 1));
  }
  return output;
}

export { VendorOperationsPage as Component };
