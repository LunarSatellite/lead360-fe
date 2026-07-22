
import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  X, ChevronRight, ChevronLeft, Check, Loader2, Search, Plus,
  DollarSign, Megaphone, Image, Globe, Users,
} from 'lucide-react';
import { apiClient } from '@/shared/lib/api-client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Interest { id: string; name: string; }

interface CreateCampaignRequest {
  name: string;
  objective: string;
  budgetType: string;
  budget: number;
  startTime: string;
  stopTime?: string;
  ageMin: number;
  ageMax: number;
  genders: number[];
  countryCodes: string[];
  interests: Interest[];
  platforms: string[];
  adName: string;
  headline: string;
  adBody: string;
  destinationUrl: string;
  imageUrl?: string;
  callToAction: string;
}

const OBJECTIVES = [
  { value: 'OUTCOME_LEADS',       label: 'Lead Generation',    desc: 'Collect leads via instant forms' },
  { value: 'OUTCOME_TRAFFIC',     label: 'Website Traffic',    desc: 'Drive visitors to your site' },
  { value: 'OUTCOME_AWARENESS',   label: 'Brand Awareness',    desc: 'Reach people likely to remember your brand' },
  { value: 'OUTCOME_ENGAGEMENT',  label: 'Engagement',         desc: 'Get more post likes, comments, shares' },
  { value: 'OUTCOME_SALES',       label: 'Conversions / Sales', desc: 'Drive purchases or sign-ups' },
];

const CTA_OPTIONS = [
  'LEARN_MORE', 'SIGN_UP', 'CONTACT_US', 'GET_QUOTE',
  'BOOK_TRAVEL', 'DOWNLOAD', 'GET_OFFER',
];

const ALL_COUNTRIES = [
  { code: 'AF', label: 'Afghanistan' }, { code: 'AL', label: 'Albania' },
  { code: 'DZ', label: 'Algeria' }, { code: 'AD', label: 'Andorra' },
  { code: 'AO', label: 'Angola' }, { code: 'AG', label: 'Antigua and Barbuda' },
  { code: 'AR', label: 'Argentina' }, { code: 'AM', label: 'Armenia' },
  { code: 'AU', label: 'Australia' }, { code: 'AT', label: 'Austria' },
  { code: 'AZ', label: 'Azerbaijan' }, { code: 'BS', label: 'Bahamas' },
  { code: 'BH', label: 'Bahrain' }, { code: 'BD', label: 'Bangladesh' },
  { code: 'BB', label: 'Barbados' }, { code: 'BY', label: 'Belarus' },
  { code: 'BE', label: 'Belgium' }, { code: 'BZ', label: 'Belize' },
  { code: 'BJ', label: 'Benin' }, { code: 'BT', label: 'Bhutan' },
  { code: 'BO', label: 'Bolivia' }, { code: 'BA', label: 'Bosnia and Herzegovina' },
  { code: 'BW', label: 'Botswana' }, { code: 'BR', label: 'Brazil' },
  { code: 'BN', label: 'Brunei' }, { code: 'BG', label: 'Bulgaria' },
  { code: 'BF', label: 'Burkina Faso' }, { code: 'BI', label: 'Burundi' },
  { code: 'CV', label: 'Cabo Verde' }, { code: 'KH', label: 'Cambodia' },
  { code: 'CM', label: 'Cameroon' }, { code: 'CA', label: 'Canada' },
  { code: 'CF', label: 'Central African Republic' }, { code: 'TD', label: 'Chad' },
  { code: 'CL', label: 'Chile' }, { code: 'CN', label: 'China' },
  { code: 'CO', label: 'Colombia' }, { code: 'KM', label: 'Comoros' },
  { code: 'CG', label: 'Congo' }, { code: 'CR', label: 'Costa Rica' },
  { code: 'HR', label: 'Croatia' }, { code: 'CU', label: 'Cuba' },
  { code: 'CY', label: 'Cyprus' }, { code: 'CZ', label: 'Czech Republic' },
  { code: 'DK', label: 'Denmark' }, { code: 'DJ', label: 'Djibouti' },
  { code: 'DM', label: 'Dominica' }, { code: 'DO', label: 'Dominican Republic' },
  { code: 'EC', label: 'Ecuador' }, { code: 'EG', label: 'Egypt' },
  { code: 'SV', label: 'El Salvador' }, { code: 'GQ', label: 'Equatorial Guinea' },
  { code: 'ER', label: 'Eritrea' }, { code: 'EE', label: 'Estonia' },
  { code: 'SZ', label: 'Eswatini' }, { code: 'ET', label: 'Ethiopia' },
  { code: 'FJ', label: 'Fiji' }, { code: 'FI', label: 'Finland' },
  { code: 'FR', label: 'France' }, { code: 'GA', label: 'Gabon' },
  { code: 'GM', label: 'Gambia' }, { code: 'GE', label: 'Georgia' },
  { code: 'DE', label: 'Germany' }, { code: 'GH', label: 'Ghana' },
  { code: 'GR', label: 'Greece' }, { code: 'GD', label: 'Grenada' },
  { code: 'GT', label: 'Guatemala' }, { code: 'GN', label: 'Guinea' },
  { code: 'GW', label: 'Guinea-Bissau' }, { code: 'GY', label: 'Guyana' },
  { code: 'HT', label: 'Haiti' }, { code: 'HN', label: 'Honduras' },
  { code: 'HU', label: 'Hungary' }, { code: 'IS', label: 'Iceland' },
  { code: 'IN', label: 'India' }, { code: 'ID', label: 'Indonesia' },
  { code: 'IR', label: 'Iran' }, { code: 'IQ', label: 'Iraq' },
  { code: 'IE', label: 'Ireland' }, { code: 'IL', label: 'Israel' },
  { code: 'IT', label: 'Italy' }, { code: 'JM', label: 'Jamaica' },
  { code: 'JP', label: 'Japan' }, { code: 'JO', label: 'Jordan' },
  { code: 'KZ', label: 'Kazakhstan' }, { code: 'KE', label: 'Kenya' },
  { code: 'KI', label: 'Kiribati' }, { code: 'KW', label: 'Kuwait' },
  { code: 'KG', label: 'Kyrgyzstan' }, { code: 'LA', label: 'Laos' },
  { code: 'LV', label: 'Latvia' }, { code: 'LB', label: 'Lebanon' },
  { code: 'LS', label: 'Lesotho' }, { code: 'LR', label: 'Liberia' },
  { code: 'LY', label: 'Libya' }, { code: 'LI', label: 'Liechtenstein' },
  { code: 'LT', label: 'Lithuania' }, { code: 'LU', label: 'Luxembourg' },
  { code: 'MG', label: 'Madagascar' }, { code: 'MW', label: 'Malawi' },
  { code: 'MY', label: 'Malaysia' }, { code: 'MV', label: 'Maldives' },
  { code: 'ML', label: 'Mali' }, { code: 'MT', label: 'Malta' },
  { code: 'MH', label: 'Marshall Islands' }, { code: 'MR', label: 'Mauritania' },
  { code: 'MU', label: 'Mauritius' }, { code: 'MX', label: 'Mexico' },
  { code: 'FM', label: 'Micronesia' }, { code: 'MD', label: 'Moldova' },
  { code: 'MC', label: 'Monaco' }, { code: 'MN', label: 'Mongolia' },
  { code: 'ME', label: 'Montenegro' }, { code: 'MA', label: 'Morocco' },
  { code: 'MZ', label: 'Mozambique' }, { code: 'MM', label: 'Myanmar' },
  { code: 'NA', label: 'Namibia' }, { code: 'NR', label: 'Nauru' },
  { code: 'NP', label: 'Nepal' }, { code: 'NL', label: 'Netherlands' },
  { code: 'NZ', label: 'New Zealand' }, { code: 'NI', label: 'Nicaragua' },
  { code: 'NE', label: 'Niger' }, { code: 'NG', label: 'Nigeria' },
  { code: 'NO', label: 'Norway' }, { code: 'OM', label: 'Oman' },
  { code: 'PK', label: 'Pakistan' }, { code: 'PW', label: 'Palau' },
  { code: 'PA', label: 'Panama' }, { code: 'PG', label: 'Papua New Guinea' },
  { code: 'PY', label: 'Paraguay' }, { code: 'PE', label: 'Peru' },
  { code: 'PH', label: 'Philippines' }, { code: 'PL', label: 'Poland' },
  { code: 'PT', label: 'Portugal' }, { code: 'QA', label: 'Qatar' },
  { code: 'RO', label: 'Romania' }, { code: 'RU', label: 'Russia' },
  { code: 'RW', label: 'Rwanda' }, { code: 'KN', label: 'Saint Kitts and Nevis' },
  { code: 'LC', label: 'Saint Lucia' }, { code: 'VC', label: 'Saint Vincent and the Grenadines' },
  { code: 'WS', label: 'Samoa' }, { code: 'SM', label: 'San Marino' },
  { code: 'ST', label: 'Sao Tome and Principe' }, { code: 'SA', label: 'Saudi Arabia' },
  { code: 'SN', label: 'Senegal' }, { code: 'RS', label: 'Serbia' },
  { code: 'SC', label: 'Seychelles' }, { code: 'SL', label: 'Sierra Leone' },
  { code: 'SG', label: 'Singapore' }, { code: 'SK', label: 'Slovakia' },
  { code: 'SI', label: 'Slovenia' }, { code: 'SB', label: 'Solomon Islands' },
  { code: 'SO', label: 'Somalia' }, { code: 'ZA', label: 'South Africa' },
  { code: 'SS', label: 'South Sudan' }, { code: 'ES', label: 'Spain' },
  { code: 'LK', label: 'Sri Lanka' }, { code: 'SD', label: 'Sudan' },
  { code: 'SR', label: 'Suriname' }, { code: 'SE', label: 'Sweden' },
  { code: 'CH', label: 'Switzerland' }, { code: 'SY', label: 'Syria' },
  { code: 'TW', label: 'Taiwan' }, { code: 'TJ', label: 'Tajikistan' },
  { code: 'TZ', label: 'Tanzania' }, { code: 'TH', label: 'Thailand' },
  { code: 'TL', label: 'Timor-Leste' }, { code: 'TG', label: 'Togo' },
  { code: 'TO', label: 'Tonga' }, { code: 'TT', label: 'Trinidad and Tobago' },
  { code: 'TN', label: 'Tunisia' }, { code: 'TR', label: 'Turkey' },
  { code: 'TM', label: 'Turkmenistan' }, { code: 'TV', label: 'Tuvalu' },
  { code: 'UG', label: 'Uganda' }, { code: 'UA', label: 'Ukraine' },
  { code: 'AE', label: 'United Arab Emirates' }, { code: 'GB', label: 'United Kingdom' },
  { code: 'US', label: 'United States' }, { code: 'UY', label: 'Uruguay' },
  { code: 'UZ', label: 'Uzbekistan' }, { code: 'VU', label: 'Vanuatu' },
  { code: 'VE', label: 'Venezuela' }, { code: 'VN', label: 'Vietnam' },
  { code: 'YE', label: 'Yemen' }, { code: 'ZM', label: 'Zambia' },
  { code: 'ZW', label: 'Zimbabwe' },
];

const STEP_ICONS = [Megaphone, Users, DollarSign, Image];
const STEP_LABELS = ['Campaign', 'Audience', 'Budget & Schedule', 'Ad Creative'];

const defaultForm = (): CreateCampaignRequest => ({
  name: '',
  objective: 'OUTCOME_LEADS',
  budgetType: 'daily',
  budget: 10,
  startTime: new Date().toISOString().slice(0, 16),
  stopTime: '',
  ageMin: 18,
  ageMax: 65,
  genders: [],
  countryCodes: ['US'],
  interests: [],
  platforms: ['facebook', 'instagram'],
  adName: '',
  headline: '',
  adBody: '',
  destinationUrl: '',
  imageUrl: '',
  callToAction: 'LEARN_MORE',
});

// ─── Main Drawer ──────────────────────────────────────────────────────────────

interface Props { onClose: () => void; }

export function CreateCampaignDrawer({ onClose }: Props) {
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CreateCampaignRequest>(defaultForm);
  const set = <K extends keyof CreateCampaignRequest>(k: K, v: CreateCampaignRequest[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const createMut = useMutation({
    mutationFn: (data: CreateCampaignRequest) =>
      apiClient.post('/v1/crm/fb-ads/campaigns', data),
    onSuccess: () => {
      toast.success("Campaign created on Facebook! It's saved as PAUSED — activate it in Ads Manager when ready.");
      qc.invalidateQueries({ queryKey: ['fb-campaigns'] });
      qc.invalidateQueries({ queryKey: ['fb-aggregate'] });
      onClose();
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to create campaign'),
  });

  const canNext = (): boolean => {
    if (step === 0) return !!form.name && !!form.objective;
    if (step === 1) return form.countryCodes.length > 0 && form.ageMin < form.ageMax;
    if (step === 2) return form.budget > 0;
    if (step === 3) return !!form.adName && !!form.headline && !!form.adBody && !!form.destinationUrl;
    return true;
  };

  const onSubmit = () => {
    const payload = { ...form, startTime: new Date(form.startTime).toISOString() };
    if (payload.stopTime) payload.stopTime = new Date(payload.stopTime).toISOString();
    else delete (payload as any).stopTime;
    if (!payload.imageUrl) delete (payload as any).imageUrl;
    createMut.mutate(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/50" onClick={onClose} />

      {/* Drawer */}
      <div className="drawer-slide-in w-full max-w-xl bg-bg-card border-l border-border-subtle flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <div>
            <h2 className="text-base font-extrabold text-text-primary">Create Facebook Ad Campaign</h2>
            <p className="text-xs text-text-muted mt-0.5">4 steps — takes about 2 minutes</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-elevated text-text-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-0 px-6 py-3 border-b border-border-subtle overflow-x-auto">
          {STEP_LABELS.map((label, i) => {
            const Icon = STEP_ICONS[i];
            const done = i < step;
            const active = i === step;
            return (
              <div key={i} className="flex items-center">
                <button
                  onClick={() => done && setStep(i)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    active ? 'bg-brand-soft text-brand'
                    : done  ? 'text-success cursor-pointer hover:bg-bg-elevated'
                    : 'text-text-muted'
                  }`}
                >
                  {done
                    ? <Check className="w-3.5 h-3.5" />
                    : <Icon className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{label}</span>
                </button>
                {i < STEP_LABELS.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-text-muted mx-0.5" />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 0 && <StepCampaign form={form} set={set} />}
          {step === 1 && <StepAudience form={form} set={set} />}
          {step === 2 && <StepBudget form={form} set={set} />}
          {step === 3 && <StepCreative form={form} set={set} />}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border-subtle">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl border border-border-subtle bg-bg-elevated text-text-secondary disabled:opacity-40 hover:border-border-medium transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext()}
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-xl bg-brand text-bg disabled:opacity-50 hover:opacity-90 transition-all"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onSubmit}
              disabled={!canNext() || createMut.isPending}
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-xl bg-brand text-bg disabled:opacity-50 hover:opacity-90 transition-all"
            >
              {createMut.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
                : <><Check className="w-4 h-4" /> Launch Campaign</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step helpers ─────────────────────────────────────────────────────────────

type SetFn = <K extends keyof CreateCampaignRequest>(k: K, v: CreateCampaignRequest[K]) => void;

const inputCls = 'w-full px-3 py-2.5 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-all';
const labelCls = 'block text-xs font-semibold text-text-muted mb-1.5';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

// ─── Step 1: Campaign ─────────────────────────────────────────────────────────

function StepCampaign({ form, set }: { form: CreateCampaignRequest; set: SetFn }) {
  return (
    <div className="space-y-5">
      <Field label="Campaign Name">
        <input
          className={inputCls}

          value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="e.g. Summer Sale 2026 — Lead Gen"
        />
      </Field>

      <Field label="Campaign Objective">
        <div className="space-y-2">
          {OBJECTIVES.map(obj => (
            <label key={obj.value} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
              form.objective === obj.value
                ? 'border-brand bg-brand-soft'
                : 'border-border-subtle bg-bg-elevated hover:border-border-medium'
            }`}>
              <input
                type="radio"
                name="objective"
                value={obj.value}
                checked={form.objective === obj.value}
                onChange={() => set('objective', obj.value)}
                className="mt-0.5 accent-brand"
              />
              <div>
                <p className="text-sm font-semibold text-text-primary">{obj.label}</p>
                <p className="text-xs text-text-muted">{obj.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </Field>
    </div>
  );
}

// ─── Step 2: Audience ─────────────────────────────────────────────────────────

function StepAudience({ form, set }: { form: CreateCampaignRequest; set: SetFn }) {
  const [interestQ, setInterestQ] = useState('');
  const [showInterestSearch, setShowInterestSearch] = useState(false);
  const [countryQ, setCountryQ] = useState('');
  const [showCountrySearch, setShowCountrySearch] = useState(false);
  const countryRef = useRef<HTMLDivElement>(null);
  const interestRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mouseHandler = (e: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node))
        setShowCountrySearch(false);
      if (interestRef.current && !interestRef.current.contains(e.target as Node))
        setShowInterestSearch(false);
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowCountrySearch(false);
        setShowInterestSearch(false);
      }
    };
    document.addEventListener('mousedown', mouseHandler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', mouseHandler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, []);

  const filteredCountries = countryQ.length > 0
    ? ALL_COUNTRIES.filter(c =>
        c.label.toLowerCase().includes(countryQ.toLowerCase()) ||
        c.code.toLowerCase().includes(countryQ.toLowerCase())
      ).slice(0, 8)
    : ALL_COUNTRIES.slice(0, 8);

  const { data: interestResults, isFetching: searchingInterests } = useQuery({
    queryKey: ['fb-interests', interestQ],
    queryFn: () => apiClient.get<{ interests: Interest[] }>(`/v1/crm/fb-ads/interests?q=${encodeURIComponent(interestQ)}`),
    enabled: interestQ.length >= 2,
  });
  const interests = (interestResults as any)?.interests ?? [];

  const toggleCountry = (code: string) => {
    const arr = form.countryCodes.includes(code)
      ? form.countryCodes.filter(c => c !== code)
      : [...form.countryCodes, code];
    set('countryCodes', arr);
  };

  const toggleGender = (g: number) => {
    const arr = form.genders.includes(g)
      ? form.genders.filter(x => x !== g)
      : [...form.genders, g];
    set('genders', arr);
  };

  const togglePlatform = (p: string) => {
    const arr = form.platforms.includes(p)
      ? form.platforms.filter(x => x !== p)
      : [...form.platforms, p];
    set('platforms', arr);
  };

  const addInterest = (i: Interest) => {
    if (!form.interests.find(x => x.id === i.id))
      set('interests', [...form.interests, i]);
    setInterestQ('');
    setShowInterestSearch(false);
  };

  const removeInterest = (id: string) =>
    set('interests', form.interests.filter(i => i.id !== id));

  return (
    <div className="space-y-5">
      {/* Age range */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Min Age">
          <input
            type="number" min={13} max={65}
            className={inputCls}
  
            value={form.ageMin}
            onChange={e => set('ageMin', Number(e.target.value))}
          />
        </Field>
        <Field label="Max Age">
          <input
            type="number" min={13} max={65}
            className={inputCls}
  
            value={form.ageMax}
            onChange={e => set('ageMax', Number(e.target.value))}
          />
        </Field>
      </div>

      {/* Gender */}
      <Field label="Gender (leave blank for all)">
        <div className="flex gap-2">
          {[{ g: 1, label: 'Male' }, { g: 2, label: 'Female' }].map(({ g, label }) => (
            <button
              key={g}
              type="button"
              onClick={() => toggleGender(g)}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                form.genders.includes(g)
                  ? 'bg-brand-soft text-brand border-border-glow'
                  : 'bg-bg-elevated text-text-secondary border-border-subtle hover:border-border-medium'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Field>

      {/* Countries */}
      <Field label="Target Countries">
        <div className="space-y-2" ref={countryRef}>
          {/* Selected country tags */}
          {form.countryCodes.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {form.countryCodes.map(code => {
                const country = ALL_COUNTRIES.find(c => c.code === code);
                return (
                  <span key={code} className="flex items-center gap-1 px-2.5 py-1 bg-brand-soft text-brand border border-border-glow text-xs font-semibold rounded-full">
                    {country?.label ?? code}
                    <button type="button" onClick={() => toggleCountry(code)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
            <input
              className={inputCls + ' pl-8'}
    
              value={countryQ}
              onChange={e => { setCountryQ(e.target.value); setShowCountrySearch(true); }}
              onFocus={() => setShowCountrySearch(true)}
              placeholder="Search country…"
            />
          </div>
          {/* Dropdown */}
          {showCountrySearch && (
            <div className="rounded-xl border border-border-subtle bg-bg-card shadow-lg max-h-52 overflow-y-auto">
              {filteredCountries.length === 0 && (
                <p className="px-3 py-2 text-xs text-text-muted">No countries found</p>
              )}
              {filteredCountries.map(c => {
                const selected = form.countryCodes.includes(c.code);
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => { toggleCountry(c.code); setCountryQ(''); setShowCountrySearch(false); }}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 hover:bg-bg-elevated transition-colors ${selected ? 'text-brand' : 'text-text-primary'}`}
                  >
                    <span>{c.label} <span className="text-text-muted text-xs">({c.code})</span></span>
                    {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
              {countryQ.length === 0 && (
                <p className="px-3 py-1.5 text-[10px] text-text-muted border-t border-border-subtle">
                  Showing first 8 — type to search all {ALL_COUNTRIES.length} countries
                </p>
              )}
            </div>
          )}
        </div>
      </Field>

      {/* Interests */}
      <Field label="Interests (optional)">
        <div className="space-y-2" ref={interestRef}>
          {/* Selected interest tags */}
          {form.interests.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {form.interests.map(i => (
                <span key={i.id} className="flex items-center gap-1 px-2.5 py-1 bg-brand-soft text-brand border border-border-glow text-xs font-semibold rounded-full">
                  {i.name}
                  <button type="button" onClick={() => removeInterest(i.id)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
            <input
              className={inputCls + ' pl-8 pr-8'}
    
              value={interestQ}
              onChange={e => { setInterestQ(e.target.value); setShowInterestSearch(true); }}
              onFocus={() => setShowInterestSearch(true)}
              placeholder="Search interests (e.g. fitness, travel, cooking)…"
            />
            {searchingInterests && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted animate-spin" />
            )}
          </div>
          {/* Dropdown */}
          {showInterestSearch && (
            <div className="rounded-xl border border-border-subtle bg-bg-card shadow-lg max-h-52 overflow-y-auto">
              {interestQ.length < 2 && (
                <p className="px-3 py-2.5 text-xs text-text-muted">Type at least 2 characters to search Meta's interest library…</p>
              )}
              {interestQ.length >= 2 && !searchingInterests && interests.length === 0 && (
                <p className="px-3 py-2.5 text-xs text-text-muted">No interests found for "{interestQ}"</p>
              )}
              {interests.map((i: Interest) => {
                const selected = !!form.interests.find(x => x.id === i.id);
                return (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => addInterest(i)}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 hover:bg-bg-elevated transition-colors ${selected ? 'text-brand' : 'text-text-primary'}`}
                  >
                    <span>{i.name}</span>
                    {selected
                      ? <Check className="w-3.5 h-3.5 shrink-0" />
                      : <Plus className="w-3.5 h-3.5 text-brand shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Field>

      {/* Platforms */}
      <Field label="Platforms">
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'facebook',          label: 'Facebook' },
            { value: 'instagram',         label: 'Instagram' },
            { value: 'audience_network',  label: 'Audience Network' },
            { value: 'messenger',         label: 'Messenger' },
          ].map(p => (
            <button
              key={p.value}
              type="button"
              onClick={() => togglePlatform(p.value)}
              className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                form.platforms.includes(p.value)
                  ? 'bg-brand-soft text-brand border-border-glow'
                  : 'bg-bg-elevated text-text-secondary border-border-subtle hover:border-border-medium'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </Field>
    </div>
  );
}

// ─── Step 3: Budget & Schedule ────────────────────────────────────────────────

function StepBudget({ form, set }: { form: CreateCampaignRequest; set: SetFn }) {
  return (
    <div className="space-y-5">
      {/* Budget type */}
      <Field label="Budget Type">
        <div className="flex gap-2">
          {[{ v: 'daily', label: 'Daily Budget' }, { v: 'lifetime', label: 'Lifetime Budget' }].map(({ v, label }) => (
            <button
              key={v}
              type="button"
              onClick={() => set('budgetType', v)}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                form.budgetType === v
                  ? 'bg-brand-soft text-brand border-border-glow'
                  : 'bg-bg-elevated text-text-secondary border-border-subtle hover:border-border-medium'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Field>

      <Field label={`${form.budgetType === 'daily' ? 'Daily' : 'Lifetime'} Budget (USD)`}>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input
            type="number" min={1} step={0.01}
            className={inputCls + ' pl-8'}
  
            value={form.budget}
            onChange={e => set('budget', Number(e.target.value))}
            placeholder="10.00"
          />
        </div>
        <p className="text-xs text-text-muted mt-1">
          {form.budgetType === 'daily'
            ? 'Facebook will spend up to this amount per day.'
            : 'Total spend over the entire campaign duration.'}
        </p>
      </Field>

      <Field label="Start Date & Time">
        <input
          type="datetime-local"
          className={inputCls}

          value={form.startTime}
          onChange={e => set('startTime', e.target.value)}
        />
      </Field>

      <Field label={`End Date & Time ${form.budgetType === 'lifetime' ? '(required)' : '(optional)'}`}>
        <input
          type="datetime-local"
          className={inputCls}

          value={form.stopTime ?? ''}
          onChange={e => set('stopTime', e.target.value)}
        />
      </Field>
    </div>
  );
}

// ─── Step 4: Ad Creative ──────────────────────────────────────────────────────

function StepCreative({ form, set }: { form: CreateCampaignRequest; set: SetFn }) {
  return (
    <div className="space-y-5">
      <Field label="Ad Name (internal reference)">
        <input
          className={inputCls}

          value={form.adName}
          onChange={e => set('adName', e.target.value)}
          placeholder="e.g. Summer Sale — Lead Ad v1"
        />
      </Field>

      <Field label="Headline (shown in bold on the ad)">
        <input
          className={inputCls}

          value={form.headline}
          onChange={e => set('headline', e.target.value)}
          placeholder="e.g. Get 30% Off This Summer!"
          maxLength={255}
        />
        <p className="text-xs text-text-muted mt-1">{form.headline.length}/255</p>
      </Field>

      <Field label="Ad Body (main text above the ad)">
        <textarea
          className={inputCls + ' min-h-[90px] resize-none'}

          value={form.adBody}
          onChange={e => set('adBody', e.target.value)}
          placeholder="e.g. Don't miss our biggest sale of the year. Shop now and save big on all products."
          maxLength={1000}
        />
        <p className="text-xs text-text-muted mt-1">{form.adBody.length}/1000</p>
      </Field>

      <Field label="Destination URL">
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input
            className={inputCls + ' pl-8'}
  
            value={form.destinationUrl}
            onChange={e => set('destinationUrl', e.target.value)}
            placeholder="https://yourwebsite.com/landing"
            type="url"
          />
        </div>
      </Field>

      <Field label="Image URL (optional — leave blank for link preview)">
        <div className="relative">
          <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input
            className={inputCls + ' pl-8'}
  
            value={form.imageUrl ?? ''}
            onChange={e => set('imageUrl', e.target.value)}
            placeholder="https://cdn.example.com/ad-image.jpg"
            type="url"
          />
        </div>
      </Field>

      <Field label="Call to Action Button">
        <select
          className={inputCls}

          value={form.callToAction}
          onChange={e => set('callToAction', e.target.value)}
        >
          {CTA_OPTIONS.map(c => (
            <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </Field>

      {/* Facebook Ad Preview */}
      {(form.headline || form.adBody || form.imageUrl) && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Ad Preview</p>
            <span className="text-[10px] text-text-muted bg-bg-elevated border border-border-subtle px-1.5 py-0.5 rounded-full">Facebook · Dark mode</span>
          </div>

          {/* FB card shell — dark mode */}
          <div className="rounded-xl overflow-hidden shadow-2xl" style={{ background: '#242526', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif' }}>

            {/* ── Post header ── */}
            <div className="flex items-start justify-between px-3 pt-3 pb-2">
              <div className="flex items-center gap-2">
                {/* Page avatar with notification dot */}
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="white" className="w-[22px] h-[22px]">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  {/* Online indicator */}
                  <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#31a24c] border-2 border-[#242526]" />
                </div>

                <div>
                  {/* Page name + verified */}
                  <div className="flex items-center gap-1">
                    <span className="text-[14px] font-semibold leading-tight" style={{ color: '#e4e6ea' }}>Your Business Page</span>
                    {/* Verified badge */}
                    <svg viewBox="0 0 16 16" fill="#1877F2" className="w-3.5 h-3.5 shrink-0">
                      <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm3.54 6.46l-4 4a.75.75 0 01-1.08 0l-2-2a.75.75 0 011.08-1.04l1.46 1.46 3.46-3.46a.75.75 0 011.08 1.04z"/>
                    </svg>
                  </div>
                  {/* Sponsored row */}
                  <div className="flex items-center gap-1 mt-px">
                    <span className="text-[12px]" style={{ color: '#b0b3b8' }}>Sponsored</span>
                    <span style={{ color: '#b0b3b8' }} className="text-[12px]">·</span>
                    {/* Globe icon */}
                    <svg viewBox="0 0 16 16" fill="#b0b3b8" className="w-3 h-3">
                      <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm5.93 6.5h-2.14a11.6 11.6 0 00-.96-4.16A6.01 6.01 0 0113.93 7.5zm-4.16 0H6.23A10.1 10.1 0 018 2.06 10.1 10.1 0 019.77 7.5zM5.17 3.34A11.6 11.6 0 004.21 7.5H2.07a6.01 6.01 0 013.1-4.16zM2.07 8.5h2.14c.13 1.5.47 2.94.96 4.16A6.01 6.01 0 012.07 8.5zm4.16 0h3.54A10.1 10.1 0 018 13.94 10.1 10.1 0 016.23 8.5zm4.6 4.16c.49-1.22.83-2.66.96-4.16h2.14a6.01 6.01 0 01-3.1 4.16z"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Top-right controls */}
              <div className="flex items-center gap-1 mt-0.5">
                {/* Follow button */}
                <button className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[13px] font-semibold transition-colors" style={{ background: '#263951', color: '#1877F2' }}>
                  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zM7.25 4.75a.75.75 0 011.5 0v2.5h2.5a.75.75 0 010 1.5h-2.5v2.5a.75.75 0 01-1.5 0v-2.5h-2.5a.75.75 0 010-1.5h2.5v-2.5z"/></svg>
                  Follow
                </button>
                {/* Three dots menu */}
                <button className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-[#3a3b3c]" style={{ color: '#b0b3b8' }}>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 4a2 2 0 110-4 2 2 0 010 4zm0 4a2 2 0 110-4 2 2 0 010 4z"/>
                  </svg>
                </button>
                {/* Close X */}
                <button className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-[#3a3b3c]" style={{ color: '#b0b3b8' }}>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* ── Ad body text ── */}
            {form.adBody && (
              <div className="px-3 pb-2">
                <p className="text-[14px] leading-[1.4]" style={{ color: '#e4e6ea' }}>
                  {form.adBody.length > 130 ? (
                    <>{form.adBody.slice(0, 130)}<span style={{ color: '#b0b3b8' }}>… </span><span className="cursor-pointer font-semibold" style={{ color: '#b0b3b8' }}>See more</span></>
                  ) : form.adBody}
                </p>
              </div>
            )}

            {/* ── Image ── */}
            {form.imageUrl ? (
              <div className="w-full aspect-[1.91/1] overflow-hidden relative" style={{ background: '#3a3b3c' }}>
                <img src={form.imageUrl} alt="Ad" className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).parentElement!.style.background = '#3a3b3c'; (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            ) : (
              <div className="w-full aspect-[1.91/1] flex flex-col items-center justify-center gap-2" style={{ background: '#3a3b3c' }}>
                <svg viewBox="0 0 24 24" fill="#606770" className="w-12 h-12">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
                <p className="text-[12px]" style={{ color: '#606770' }}>Add an image URL to preview your ad</p>
              </div>
            )}

            {/* ── Link bar ── */}
            <div className="flex items-center justify-between px-3 py-2.5" style={{ background: '#3a3b3c' }}>
              <div className="flex-1 min-w-0 mr-3">
                <p className="text-[11px] uppercase tracking-[0.05em] truncate" style={{ color: '#b0b3b8' }}>
                  {form.destinationUrl
                    ? (() => { try { return new URL(form.destinationUrl).hostname.replace('www.', ''); } catch { return form.destinationUrl; } })()
                    : 'yourwebsite.com'}
                </p>
                <p className="text-[15px] font-semibold leading-snug truncate mt-px" style={{ color: '#e4e6ea' }}>
                  {form.headline || 'Your headline here'}
                </p>
                <p className="text-[13px] truncate mt-px" style={{ color: '#b0b3b8' }}>
                  {form.adBody ? form.adBody.slice(0, 50) + (form.adBody.length > 50 ? '…' : '') : 'Ad description'}
                </p>
              </div>
              <button className="shrink-0 px-3 py-2 rounded-md text-[14px] font-semibold whitespace-nowrap transition-colors hover:opacity-90" style={{ background: '#4e4f50', color: '#e4e6ea' }}>
                {form.callToAction.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </button>
            </div>

            {/* ── Reaction summary ── */}
            <div className="flex items-center justify-between px-3 py-1.5">
              <div className="flex items-center gap-1">
                {/* Stacked reaction emoji circles */}
                <div className="flex -space-x-1">
                  {['#1877F2','#f02849','#f7b928'].map((bg, i) => (
                    <div key={i} className="w-[18px] h-[18px] rounded-full border-2 border-[#242526] flex items-center justify-center text-[9px]" style={{ background: bg, zIndex: 3 - i }}>
                      {i === 0 ? '👍' : i === 1 ? '❤️' : '😂'}
                    </div>
                  ))}
                </div>
                <span className="text-[13px]" style={{ color: '#b0b3b8' }}>2.4K</span>
              </div>
              <div className="flex items-center gap-2 text-[13px]" style={{ color: '#b0b3b8' }}>
                <span>847 comments</span>
                <span>·</span>
                <span>312 shares</span>
              </div>
            </div>

            {/* ── Divider ── */}
            <div className="mx-3" style={{ height: '1px', background: '#3a3b3c' }} />

            {/* ── Action buttons ── */}
            <div className="flex items-center px-1 py-1">
              {[
                {
                  label: 'Like',
                  icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>
                },
                {
                  label: 'Comment',
                  icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z"/></svg>
                },
                {
                  label: 'Share',
                  icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>
                },
              ].map(({ label, icon }) => (
                <button key={label} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md transition-colors hover:bg-[#3a3b3c]" style={{ color: '#b0b3b8' }}>
                  {icon}
                  <span className="text-[13px] font-semibold">{label}</span>
                </button>
              ))}
            </div>

            {/* ── Why am I seeing this ── */}
            <div className="flex items-center justify-center pb-2">
              <button className="flex items-center gap-1 text-[11px] transition-colors hover:underline" style={{ color: '#b0b3b8' }}>
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm.75 10.5h-1.5v-5h1.5v5zm0-6.5h-1.5V3.5h1.5V5z"/></svg>
                Why am I seeing this ad?
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.05)] p-3">
        <p className="text-xs text-[#F59E0B] font-semibold">Campaign will be saved as PAUSED</p>
        <p className="text-xs text-text-muted mt-0.5">Review it in Meta Ads Manager and activate when you're ready to spend.</p>
      </div>
    </div>
  );
}
