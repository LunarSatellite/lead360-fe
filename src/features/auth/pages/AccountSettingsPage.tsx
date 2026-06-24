import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Eye,
  EyeOff,
  Check,
  X,
  Save,
  Lock,
  LogOut,
  User,
  ShieldCheck,
  Menu,
  X as XIcon,
  CreditCard,
  Bell,
  Palette,
  Users,
  Mic,
  Plug,
  Video,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/app/router/route-paths';
import { useVideoConferencingStatus } from '@/features/integrations/api/videoConferencing.queries';
import { useCalendarIntegrationStatus } from '@/features/integrations/api/calendarIntegration.queries';
import { ApiCredentialsCard } from '@/features/tenant/components/ApiCredentialsCard';
import { ResponseStorageCard } from '@/features/tenant/components/ResponseStorageCard';
import { useProfile, useUpdateProfile, useChangePassword, useLogout } from '../api/auth.queries';
import {
  updateProfileSchema,
  changePasswordSchema,
  type UpdateProfileFormData,
  type ChangePasswordFormData,
} from '../types/auth.schemas';
import { USER_ROLE_LABEL } from '../types/auth.types';
import type { UserProfileDto, UserRoleValue } from '../types/auth.types';
import { ComplianceSettings } from '@/features/compliance';
import { Component as BotSettingsPage } from '@/features/flow-builder/pages/BotSettingsPage';
import { Component as TeamManagementContent } from '@/features/team/pages/TeamManagementPage';
import { VoiceSettingsPanel } from '@/features/voice/components/VoiceSettingsPanel';
import { DEFAULT_VOICE_SETTINGS, type VoiceSettings } from '@/features/voice/types/voice.types';

/* ═══════════════════════════════════════════════════════════
   SETTINGS PAGE — Dark theme, sidebar + content split
   Sidebar: user card → grouped nav with live indicators
   Content: section header → section-specific cards
   ═══════════════════════════════════════════════════════════ */

type SectionId =
  | 'profile'
  | 'team'
  | 'compliance'
  | 'botSettings'
  | 'voice'
  | 'integrations'
  | 'password'
  | 'billing'
  | 'notifications'
  | 'appearance'
  | 'danger';

interface SectionDef {
  id: SectionId;
  label: string;
  icon: typeof User;
  iconBg: string;
  iconColor: string;
  group: 'account' | 'preferences' | 'system';
  badge?: string;
  danger?: boolean;
  description: string;
}

const SECTIONS: SectionDef[] = [
  { id: 'profile', label: 'Profile', icon: User, iconBg: 'bg-brand-soft', iconColor: 'text-brand', group: 'account', description: 'Manage your personal information and account details.' },
  { id: 'team', label: 'Team', icon: Users, iconBg: 'bg-[rgba(167,139,250,0.06)]', iconColor: 'text-[#A78BFA]', group: 'account', description: 'Manage team members, roles, and invitations.' },
  { id: 'compliance', label: 'Compliance', icon: ShieldCheck, iconBg: 'bg-[rgba(52,211,153,0.06)]', iconColor: 'text-[#34D399]', group: 'account', description: 'Industry-specific rules that control what your chatbot can and cannot say.' },
  { id: 'botSettings', label: 'Bot Settings', icon: Mic, iconBg: 'bg-brand-soft', iconColor: 'text-brand', group: 'account', description: 'Configure voice input and text-to-speech settings for your chatbot.' },
  { id: 'voice', label: 'Voice & TTS', icon: Mic, iconBg: 'bg-brand-soft', iconColor: 'text-brand', group: 'account', description: 'Configure voice input and text-to-speech settings for your chatbot.' },
  { id: 'integrations', label: 'Integrations', icon: Plug, iconBg: 'bg-[rgba(0,217,126,0.06)]', iconColor: 'text-brand', group: 'account', description: 'Connect your external API and manage data-storage settings.' },
  { id: 'password', label: 'Password & Security', icon: Lock, iconBg: 'bg-[rgba(245,158,11,0.06)]', iconColor: 'text-[#F59E0B]', group: 'account', description: 'Change your password and manage authentication settings.' },
  { id: 'billing', label: 'Billing & Plan', icon: CreditCard, iconBg: 'bg-[#0F1A16]', iconColor: 'text-text-muted', group: 'preferences', badge: 'Soon', description: '' },
  { id: 'notifications', label: 'Notifications', icon: Bell, iconBg: 'bg-[#0F1A16]', iconColor: 'text-text-muted', group: 'preferences', badge: 'Soon', description: '' },
  { id: 'appearance', label: 'Appearance', icon: Palette, iconBg: 'bg-[#0F1A16]', iconColor: 'text-text-muted', group: 'preferences', badge: 'Soon', description: '' },
  { id: 'danger', label: 'Log out', icon: LogOut, iconBg: '', iconColor: '', group: 'system', danger: true, description: '' },
];

/* ═══ NAV ITEM RIGHT-SIDE INDICATORS ═══ */
function NavIndicator({ id }: { id: SectionId }) {
  switch (id) {
    case 'profile':
      return <div className="w-[6px] h-[6px] rounded-full bg-brand" />;
    case 'team':
      return (
        <span className="text-[10px] font-semibold text-[#A78BFA] bg-[rgba(167,139,250,0.06)] px-[7px] py-[2px] rounded">
          4
        </span>
      );
    case 'compliance':
      return (
        <span className="text-[9px] font-semibold text-[#34D399] bg-[rgba(52,211,153,0.06)] px-[7px] py-[2px] rounded">
          Healthcare
        </span>
      );
    case 'password':
      return (
        <div className="flex gap-[2px]">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`w-[10px] h-[3px] rounded-sm ${i <= 3 ? 'bg-brand' : 'bg-glass-2'}`}
            />
          ))}
        </div>
      );
    case 'voice':
    case 'integrations':
      return <div className="w-[6px] h-[6px] rounded-full bg-brand" />;
    default:
      return null;
  }
}

/* ═══════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════ */
export function Component() {
  const [activeSection, setActiveSection] = useState<SectionId>('profile');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(DEFAULT_VOICE_SETTINGS);
  const { data } = useProfile();
  const profile = data as unknown as UserProfileDto | undefined;

  const handleNav = (id: SectionId) => {
    setActiveSection(id);
    setSidebarOpen(false);
  };

  const activeConfig = SECTIONS.find((s) => s.id === activeSection)!;

  return (
    <div className="flex gap-6 min-h-[calc(100vh-120px)]">
      {/* Mobile toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-[76px] right-6 z-50 w-10 h-10 rounded-card
                   bg-bg-elevated border border-border-medium flex items-center justify-center
                   text-text-muted hover:text-text-primary transition-all"
      >
        {sidebarOpen ? <XIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* ═══ SIDEBAR ═══ */}
      <aside
        className={`
          w-[240px] shrink-0 flex flex-col rounded-frame border border-border-subtle bg-bg overflow-hidden
          lg:relative lg:translate-x-0 lg:opacity-100
          fixed top-0 left-0 h-full z-40 transition-all duration-200
          ${sidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 lg:translate-x-0 lg:opacity-100'}
        `}
      >
        {/* User card */}
        {profile && (
          <div className="p-5 border-b border-border-subtle">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <div
                  className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-brand to-brand-dark
                             flex items-center justify-center text-[15px] font-extrabold text-bg shrink-0"
                >
                  {(profile.firstName?.[0] || '').toUpperCase()}
                  {(profile.lastName?.[0] || '').toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-brand border-[2.5px] border-bg" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-text-primary truncate">
                  {profile.firstName} {profile.lastName}
                </div>
                <div className="text-2xs text-text-muted truncate">{profile.email}</div>
              </div>
            </div>
            <div className="flex gap-[5px] flex-wrap">
              <span className="px-[10px] py-1 rounded-[6px] bg-brand-soft text-[10px] font-semibold text-brand">
                {USER_ROLE_LABEL[profile.role as UserRoleValue] || 'User'}
              </span>
              <span className="px-[10px] py-1 rounded-[6px] bg-[rgba(0,255,170,0.04)] text-[10px] font-semibold text-text-secondary">
                Pro plan
              </span>
              {profile.tenantName && (
                <span className="px-[10px] py-1 rounded-[6px] bg-[rgba(0,255,170,0.03)] text-[10px] font-medium text-text-muted truncate max-w-[100px]">
                  {profile.tenantName}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Nav */}
        <div className="flex-1 px-3 py-3 flex flex-col">
          {['account', 'preferences', 'system'].map((group) => {
            const items = SECTIONS.filter((s) => s.group === group);
            return (
              <div key={group}>
                {group === 'preferences' && <div className="h-px bg-border-subtle mx-2 my-2" />}
                {group === 'system' && <div className="mt-auto" />}
                {items.map((section) => {
                  const isActive = activeSection === section.id;
                  const isDisabled = !!section.badge;

                  /* Logout button */
                  if (section.danger) {
                    return (
                      <button
                        key={section.id}
                        onClick={() => handleNav(section.id)}
                        className="w-full flex items-center gap-[10px] px-[10px] py-[10px] rounded-[10px]
                                   text-left text-text-muted text-xs font-medium
                                   transition-all duration-150 hover:text-danger hover:bg-[rgba(244,63,94,0.02)]"
                      >
                        <LogOut className="w-[15px] h-[15px]" strokeWidth={1.5} />
                        <span>Log out</span>
                      </button>
                    );
                  }

                  /* Regular nav item */
                  return (
                    <button
                      key={section.id}
                      onClick={() => !isDisabled && handleNav(section.id)}
                      disabled={isDisabled}
                      className={`
                        w-full flex items-center gap-[10px] px-[10px] py-[10px] rounded-[10px] text-left
                        transition-all duration-150 mb-[2px] border relative
                        ${isActive
                          ? 'bg-[rgba(0,217,126,0.03)] border-[rgba(0,217,126,0.06)]'
                          : 'border-transparent hover:bg-[rgba(255,255,255,0.015)]'
                        }
                        ${isDisabled ? 'opacity-20 cursor-not-allowed' : ''}
                      `}
                    >
                      {isActive && (
                        <div className="absolute left-[-1px] top-[10px] bottom-[10px] w-[3px] rounded-r-sm bg-brand" />
                      )}
                      <div
                        className={`w-[30px] h-[30px] rounded-[9px] flex items-center justify-center shrink-0 ${section.iconBg}`}
                      >
                        <section.icon
                          className={`w-4 h-4 ${isActive ? section.iconColor : 'text-text-muted'}`}
                          strokeWidth={1.5}
                        />
                      </div>
                      <span
                        className={`text-xs flex-1 ${
                          isActive ? 'font-semibold text-text-primary' : 'font-medium text-text-secondary'
                        }`}
                      >
                        {section.label}
                      </span>
                      {section.badge ? (
                        <span className="text-[8px] text-text-muted bg-[#0F1A16] px-[6px] py-[2px] rounded">
                          {section.badge}
                        </span>
                      ) : (
                        <NavIndicator id={section.id} />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ═══ CONTENT ═══ */}
      <div className="flex-1 min-w-0 rounded-frame border border-border-subtle bg-bg overflow-hidden flex flex-col">
        {/* Header */}
        {activeSection !== 'danger' && activeConfig.description && (
          <div className="px-7 pt-6">
            <h2 className="text-xl font-bold text-text-primary tracking-tight mb-1">
              {activeConfig.label}
            </h2>
            <p className="text-sm text-text-secondary mb-5">{activeConfig.description}</p>
            <div className="h-px bg-border-medium" />
          </div>
        )}

        {/* Body */}
        <div className="flex-1 px-7 py-6 overflow-y-auto">
          <div key={activeSection} className="animate-[fadeIn_0.3s_ease]">
            {activeSection === 'profile' && profile && <ProfileSection profile={profile} />}
            {activeSection === 'team' && <TeamSection />}
            {activeSection === 'compliance' && <ComplianceSection />}
            {activeSection === 'botSettings' && <BotSettingsPage />}
            {activeSection === 'voice' && (
              <VoiceSettingsPanel settings={voiceSettings} onChange={setVoiceSettings} />
            )}
            {activeSection === 'integrations' && <IntegrationsSection />}
            {activeSection === 'password' && <PasswordSection />}
            {activeSection === 'danger' && <DangerSection />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   CARD WRAPPER
   ═══════════════════════════════════════ */
function SettingsCard({
  title,
  icon: Icon,
  children,
  className = '',
}: {
  title?: string;
  icon?: typeof User;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[14px] border border-border-medium bg-bg-shell p-5 mb-3.5
                  transition-colors hover:border-glass-3 ${className}`}
    >
      {title && (
        <div className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-4">
          {Icon && <Icon className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} />}
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════
   PROFILE
   ═══════════════════════════════════════ */
function ProfileSection({ profile }: { profile: UserProfileDto }) {
  const update = useUpdateProfile();
  const form = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      phone: profile.phone || '',
      avatarUrl: profile.avatarUrl || '',
    },
  });

  const onSubmit = (data: UpdateProfileFormData) => {
    update.mutate({
      firstName: data.firstName || null,
      lastName: data.lastName || null,
      phone: data.phone || null,
      avatarUrl: data.avatarUrl || null,
    });
  };

  const initials = `${(profile.firstName?.[0] || '').toUpperCase()}${(profile.lastName?.[0] || '').toUpperCase()}`;

  return (
    <SettingsCard title="Personal information" icon={User}>
      {/* Avatar row */}
      <div className="flex items-center gap-4 mb-6 pb-5 border-b border-border-medium">
        <div
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand to-brand-dark
                     flex items-center justify-center text-xl font-extrabold text-bg"
        >
          {initials}
        </div>
        <div className="flex-1">
          <div className="text-base font-bold text-text-primary">
            {profile.firstName} {profile.lastName}
          </div>
          <div className="text-xs text-text-muted">{profile.email}</div>
        </div>
        {/* <button
          className="px-3.5 py-1.5 rounded-sm border border-border-subtle text-2xs font-medium
                     text-text-secondary hover:border-glass-3 hover:text-text-primary transition-all"
        >
          Change photo
        </button> */}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-2xs font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
              First name
            </label>
            <input {...form.register('firstName')} placeholder="John" className="form-input" />
          </div>
          <div>
            <label className="text-2xs font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
              Last name
            </label>
            <input {...form.register('lastName')} placeholder="Doe" className="form-input" />
          </div>
        </div>

        <div>
          <label className="text-2xs font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
            Email address
          </label>
          <input
            value={profile.email || ''}
            disabled
            className="form-input !border-[#1A2B22] !text-text-muted !cursor-not-allowed"
          />
          <p className="text-[10px] text-text-secondary mt-1.5">
            Email cannot be changed. Contact support if needed.
          </p>
        </div>

        <div>
          <label className="text-2xs font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
            Phone number
          </label>
          <input
            {...form.register('phone')}
            type="tel"
            placeholder="+254 712 345 678"
            className="form-input"
          />
        </div>

        <div>
          <label className="text-2xs font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
            Tenant
          </label>
          <input
            value={profile.tenantName || ''}
            disabled
            className="form-input !border-[#1A2B22] !text-text-muted !cursor-not-allowed"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            className="px-4 py-2 rounded-[10px] border border-border-subtle text-xs font-medium
                       text-text-secondary hover:border-glass-3 hover:text-text-primary transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={update.isPending || !form.formState.isDirty}
            className="flex items-center gap-2 px-5 py-2 rounded-[10px] text-xs font-semibold
                       bg-brand text-bg hover:bg-brand-light hover:-translate-y-px
                       hover:shadow-[0_4px_12px_rgba(0,217,126,0.15)]
                       disabled:opacity-40 disabled:hover:transform-none transition-all"
          >
            {update.isPending ? (
              <span className="w-3.5 h-3.5 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {update.isPending ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </SettingsCard>
  );
}

/* ═══════════════════════════════════════
   TEAM
   ═══════════════════════════════════════ */
function TeamSection() {
  return (
    <SettingsCard title="Members" icon={Users}>
      <TeamManagementContent />
    </SettingsCard>
  );
}

/* ═══════════════════════════════════════
   COMPLIANCE
   ═══════════════════════════════════════ */
function ComplianceSection() {
  return (
    <SettingsCard>
      <ComplianceSettings />
    </SettingsCard>
  );
}

/* ═══════════════════════════════════════
   INTEGRATIONS
   ═══════════════════════════════════════ */
function IntegrationsSection() {
  const navigate = useNavigate();
  const { data: vcStatus } = useVideoConferencingStatus();
  const connectedCount = vcStatus?.connected?.length ?? 0;
  const { data: calStatus } = useCalendarIntegrationStatus();

  return (
    <>
      <ApiCredentialsCard />
      <ResponseStorageCard />
      {/* Video Conferencing */}
      <button
        onClick={() => navigate(ROUTES.dashboard.videoConferencingSettings)}
        className="w-full text-left flex items-center gap-4 p-4 rounded-xl bg-bg-elevated border border-border-subtle hover:border-border-glow transition-colors group"
      >
        <div className="p-2 rounded-lg bg-[rgba(99,102,241,0.1)] shrink-0">
          <Video className="w-5 h-5 text-[#818CF8]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-primary text-sm">Video Conferencing</span>
            {connectedCount > 0 && (
              <span className="text-xs font-medium text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-2 py-0.5">
                {connectedCount} connected
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Connect Zoom, Google Meet, Teams, Webex, or GoToMeeting to auto-generate meeting links.
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text-primary transition-colors shrink-0" />
      </button>
      {/* Google Calendar */}
      <button
        onClick={() => navigate(ROUTES.dashboard.calendarSettings)}
        className="w-full text-left flex items-center gap-4 p-4 rounded-xl bg-bg-elevated border border-border-subtle hover:border-border-glow transition-colors group"
      >
        <div className="p-2 rounded-lg bg-[rgba(34,197,94,0.1)] shrink-0">
          <Calendar className="w-5 h-5 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-primary text-sm">Google Calendar</span>
            {calStatus?.isConnected && (
              <span className="text-xs font-medium text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-2 py-0.5">
                Connected
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Connect Google Calendar to generate real available slots for contact scheduling.
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text-primary transition-colors shrink-0" />
      </button>
      {/* Public Booking Page */}
      <button
        onClick={() => navigate(ROUTES.dashboard.bookingPageSettings)}
        className="w-full text-left flex items-center gap-4 p-4 rounded-xl bg-bg-elevated border border-border-subtle hover:border-border-glow transition-colors group"
      >
        <div className="p-2 rounded-lg bg-[rgba(99,102,241,0.1)] shrink-0">
          <Calendar className="w-5 h-5 text-indigo-500" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-text-primary text-sm">Booking Page</span>
          <p className="text-xs text-text-muted mt-0.5">
            Create a public Calendly-style page where contacts can book meetings directly.
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text-primary transition-colors shrink-0" />
      </button>
    </>
  );
}

/* ═══════════════════════════════════════
   PASSWORD & SECURITY
   ═══════════════════════════════════════ */
function PasswordSection() {
  const changePw = useChangePassword();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    mode: 'onSubmit',
  });

  const newPw = form.watch('newPassword');
  const pwChecks = [
    { label: '8+ characters', pass: newPw.length >= 8 },
    { label: 'Uppercase', pass: /[A-Z]/.test(newPw) },
    { label: 'Lowercase', pass: /[a-z]/.test(newPw) },
    { label: 'Digit', pass: /[0-9]/.test(newPw) },
  ];

  const onSubmit = ({ confirmPassword: _, ...data }: ChangePasswordFormData) => {
    if (data.newPassword === data.currentPassword) {
      form.setError('newPassword', { message: 'New password must be different from your current password' });
      return;
    }
    changePw.mutate(data);
  };

  return (
    <>
      {/* Password card */}
      <SettingsCard title="Password" icon={Lock}>
        <div className="mb-5">
          <div className="text-xs text-text-secondary mb-2">Strength</div>
          <div className="flex gap-1 mb-1.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-sm ${i <= 3 ? 'bg-brand' : 'bg-glass-2'}`}
              />
            ))}
          </div>
          <div className="flex justify-between">
            <span className="text-2xs font-semibold text-brand">Strong</span>
            <span className="text-2xs text-text-secondary">Last changed 14 days ago</span>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
          <div>
            <label className="text-2xs font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
              Current password <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <input
                {...form.register('currentPassword')}
                type={showCurrent ? 'text' : 'password'}
                placeholder="Enter current password"
                autoComplete="current-password"
                className="form-input !pr-12 w-full"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              {form.formState.errors.currentPassword && (
                <span className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 text-2xs text-danger whitespace-nowrap">
                  {form.formState.errors.currentPassword.message}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="text-2xs font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
              New password <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <input
                {...form.register('newPassword')}
                type={showNew ? 'text' : 'password'}
                placeholder="Min 8 characters"
                autoComplete="new-password"
                className="form-input !pr-12 w-full"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              {form.formState.errors.newPassword && (
                <span className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 text-2xs text-danger whitespace-nowrap">
                  {form.formState.errors.newPassword.message}
                </span>
              )}
            </div>
            {newPw.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
                {pwChecks.map((c) => (
                  <div key={c.label} className="flex items-center gap-2">
                    {c.pass ? (
                      <Check className="w-3.5 h-3.5 text-brand" strokeWidth={3} />
                    ) : (
                      <X className="w-3.5 h-3.5 text-text-muted" strokeWidth={2} />
                    )}
                    <span className={`text-xs ${c.pass ? 'text-brand' : 'text-text-muted'}`}>
                      {c.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-2xs font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
              Confirm new password <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <input
                {...form.register('confirmPassword')}
                type={showConfirm ? 'text' : 'password'}
                placeholder="Re-enter new password"
                autoComplete="new-password"
                className="form-input !pr-12 w-full"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              {form.formState.errors.confirmPassword && (
                <span className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 text-2xs text-danger whitespace-nowrap">
                  {form.formState.errors.confirmPassword.message}
                </span>
              )}
            </div>
          </div>

          {changePw.isError && (
            <div className="px-4 py-3 rounded-card bg-danger-soft border border-[rgba(244,63,94,0.15)] text-xs text-danger">
              {changePw.error?.message || 'Failed to change password.'}
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={changePw.isPending}
              className="flex items-center gap-2 px-5 py-2 rounded-[10px] text-xs font-semibold
                         bg-brand text-bg hover:bg-brand-light disabled:opacity-40 transition-all"
            >
              {changePw.isPending ? (
                <span className="w-3.5 h-3.5 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
              ) : (
                <Lock className="w-3.5 h-3.5" />
              )}
              {changePw.isPending ? 'Changing...' : 'Change password'}
            </button>
          </div>
        </form>
      </SettingsCard>

      {/* 2FA banner */}
      <SettingsCard title="Two-factor authentication" icon={ShieldCheck}>
        <div
          className="flex items-center gap-3 px-4 py-3.5 rounded-card
                     bg-[rgba(245,158,11,0.04)] border border-[rgba(245,158,11,0.12)]"
        >
          <div className="w-2 h-2 rounded-full bg-warning shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-warning">Not enabled</div>
            <div className="text-2xs text-text-secondary">
              Add an extra layer of security to your account.
            </div>
          </div>
          <button className="px-3.5 py-1.5 rounded-sm text-2xs font-semibold bg-warning text-bg hover:brightness-110 transition-all">
            Enable 2FA
          </button>
        </div>
      </SettingsCard>
    </>
  );
}

/* ═══════════════════════════════════════
   LOGOUT / DANGER
   ═══════════════════════════════════════ */
function DangerSection() {
  const logout = useLogout();
  return (
    <div>
      <h2 className="text-xl font-bold text-text-primary tracking-tight mb-1">Log out</h2>
      <p className="text-sm text-text-secondary mb-5">End your current session.</p>
      <div className="h-px bg-border-medium mb-6" />

      <SettingsCard className="!border-[rgba(244,63,94,0.12)]">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="text-sm font-semibold text-text-primary">Log out of your account</div>
            <div className="text-xs text-text-secondary mt-0.5">
              This will revoke your session on the server and clear all local data.
            </div>
          </div>
          <button
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-xs font-semibold
                       bg-danger-soft border border-[rgba(244,63,94,0.12)] text-danger
                       hover:bg-[rgba(244,63,94,0.12)] disabled:opacity-40 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            {logout.isPending ? 'Logging out...' : 'Log out'}
          </button>
        </div>
      </SettingsCard>
    </div>
  );
}