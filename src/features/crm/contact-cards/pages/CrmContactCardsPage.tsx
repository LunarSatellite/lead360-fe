import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  Loader2,
  QrCode,
  Download,
  Copy,
  RefreshCw,
  BarChart3,
  Edit3,
  ExternalLink,
  X,
  Mail,
  Phone,
  Briefcase,
  Building2,
  Eye,
  EyeOff,
  Power,
  Check,
  Hash,
  Globe,
  Link as LinkIcon,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import {
  useContactCards,
  useContactCardStats,
  useUpdateContactCard,
  useRegenerateToken,
  useDownloadCardPng,
  useDownloadCardSvg,
  useCopyScanUrl,
  useCopyMeCard,
} from "../api/contact-cards.queries";
import { absolutePublicUrl, cardFilename } from "../api/contact-cards.api";
import { contactCardsApi } from "../api/contact-cards.api";
import type {
  CrmContactCardDto,
  CrmContactCardScanEntryDto,
} from "../types/contact-cards.types";
import { useAdminUpdateUser } from "@/features/team/api/team.queries";

// ─── Style helpers ───
const inputCls =
  "w-full px-3 py-2 rounded-xl bg-bg-input border-thin border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-glow";

const btnPrimary =
  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-bg bg-brand hover:bg-brand-light disabled:opacity-50 transition-all";

const btnGhost =
  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-elevated border border-border-subtle transition-all";

const btnDanger =
  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-danger border border-danger/30 hover:bg-danger-soft transition-all";

interface ComponentProps {
  inline?: boolean;
}

export function Component({ inline }: ComponentProps = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const focusUserId = searchParams.get("user");

  const { data: cards = [], isLoading } = useContactCards();
  const cardList: CrmContactCardDto[] = Array.isArray(cards) ? cards : [];

  // If the team-management page navigated in with ?user=<id>, auto-open that card.
  useEffect(() => {
    if (!focusUserId || cardList.length === 0) return;
    const found = cardList.find((c: CrmContactCardDto) => c.userId === focusUserId);
    if (found) {
      setSelected(found);
      setSearchParams({}, { replace: true });
    }
  }, [focusUserId, cardList, setSearchParams]);


  const [selected, setSelected] = useState<CrmContactCardDto | null>(null);

  // When the underlying cards list updates (e.g. after the admin profile
  // save invalidates the query), refresh `selected` so the modal shows
  // the freshly-saved phone / role / department without a manual reload.
  useEffect(() => {
    if (!selected) return;
    const fresh = cardList.find((c) => c.userId === selected.userId);
    if (fresh && fresh !== selected) setSelected(fresh);
  }, [cardList, selected]);

  return (
    <div className="space-y-6">
      {!inline && <Header count={cardList.length} />}
      {isLoading ? <LoadingState /> : <CardGrid cards={cardList} onSelect={setSelected} />}
      {selected && (
        <CardDetailModal card={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

// ─── Header ───
function Header({ count }: { count: number }) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-xl font-extrabold text-text-primary tracking-tight flex items-center gap-2">
          <QrCode className="w-5 h-5 text-brand" />
          Contact cards
        </h1>
        <p className="text-sm text-text-secondary mt-1 max-w-2xl">
          Print-ready QR codes for each team member. Customers scan with their phone and
          get a native <span className="font-semibold text-text-primary">&ldquo;Save contact?&rdquo;</span> prompt —
          the contact is filed under your business name with their role and team.
        </p>
      </div>
      <span className="text-xs font-semibold text-text-muted">
        {count} {count === 1 ? "card" : "cards"}
      </span>
    </div>
  );
}

// ─── Loading ───
function LoadingState() {
  return (
    <div className="flex items-center justify-center h-48 text-text-muted">
      <Loader2 className="w-5 h-5 animate-spin mr-2" />
      Loading team cards…
    </div>
  );
}

// ─── Grid ───
function CardGrid({
  cards,
  onSelect,
}: {
  cards: CrmContactCardDto[];
  onSelect: (c: CrmContactCardDto) => void;
}) {
  if (cards.length === 0) {
    return <EmptyState />;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {cards.map((card) => (
        <CardTile key={card.userId} card={card} onClick={() => onSelect(card)} />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-card bg-glass-2 border-thin border-border-subtle p-8 text-center">
      <QrCode className="w-8 h-8 text-text-muted mx-auto mb-3" />
      <h3 className="text-sm font-bold text-text-primary">No team cards yet</h3>
      <p className="text-xs text-text-secondary mt-1 max-w-md mx-auto">
        Each team member automatically gets a vCard QR code the first time their
        phone number and role are set. Edit a team member from the Team page to
        enable their card.
      </p>
    </div>
  );
}

// ─── Tile ───
function CardTile({
  card,
  onClick,
}: {
  card: CrmContactCardDto;
  onClick: () => void;
}) {
  const missing = !card.phone || !card.jobTitle;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-card border-thin p-4 transition-all hover:border-border-glow ${
        card.isActive
          ? "bg-glass-2 border-border-subtle"
          : "bg-glass border-border-subtle/50 opacity-70"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-brand-soft border-thin border-border-glow flex items-center justify-center text-xs font-extrabold text-brand shrink-0">
          {initialsOf(card.firstName, card.lastName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-text-primary truncate">
            {card.fullName}
          </div>
          <div className="text-xs text-text-secondary truncate">
            {[card.jobTitle, card.department].filter(Boolean).join(" • ") || (
              <span className="text-text-muted italic">No role set</span>
            )}
          </div>
          <div className="text-[10px] text-text-muted mt-0.5 truncate">
            {card.tenantName}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {card.email && (
          <span className="inline-flex items-center gap-1 text-[10px] text-text-secondary px-2 py-0.5 rounded-md bg-bg-elevated border border-border-subtle">
            <Mail className="w-3 h-3" />
            <span className="truncate max-w-[120px]">{card.email}</span>
          </span>
        )}
        {card.phone ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-text-secondary px-2 py-0.5 rounded-md bg-bg-elevated border border-border-subtle">
            <Phone className="w-3 h-3" />
            {card.phone}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] text-warning px-2 py-0.5 rounded-md bg-warning/10 border border-warning/30">
            <Phone className="w-3 h-3" />
            Add phone
          </span>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-border-subtle flex items-center justify-between text-[10px]">
        <span className="text-text-muted">
          {card.scanCount} {card.scanCount === 1 ? "scan" : "scans"}
          {card.lastScannedAt && (
            <>
              {" · last "}
              {formatDistanceToNow(new Date(card.lastScannedAt), { addSuffix: true })}
            </>
          )}
        </span>
        <span className="flex items-center gap-1">
          {missing && <span className="text-warning font-semibold">Incomplete</span>}
          <span
            className={`px-1.5 py-0.5 rounded-md font-bold ${
              card.isActive
                ? "bg-brand-soft text-brand"
                : "bg-bg-elevated text-text-muted"
            }`}
          >
            {card.isActive ? "Active" : "Off"}
          </span>
        </span>
      </div>
    </button>
  );
}

// ─── Detail modal ───
export function CardDetailModal({
  card,
  onClose,
}: {
  card: CrmContactCardDto;
  onClose: () => void;
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-end pr-4 bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="drawer-slide-in relative w-[640px] flex flex-col overflow-hidden"
        style={{
          borderRadius: 18,
          background: 'var(--bg-card)',
          border: '1px solid rgba(0,217,138,0.2)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 24px rgba(0,217,138,0.25), inset 0 1px 0 rgba(0,255,163,0.05)',
          maxHeight: 'calc(100vh - 32px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent bar */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #00D98A 35%, #00FFA3 65%, transparent)', flexShrink: 0 }} />
        <ModalHeader card={card} onClose={onClose} />
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <PreviewSection card={card} />
          <ProfileSection card={card} />
          <ShareSection card={card} />
          <SettingsSection card={card} />
          <StatsSection userId={card.userId} />
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ModalHeader({
  card,
  onClose,
}: {
  card: CrmContactCardDto;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-thin border-border-subtle shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-lg bg-brand-soft border-thin border-border-glow flex items-center justify-center text-xs font-extrabold text-brand shrink-0">
          {initialsOf(card.firstName, card.lastName)}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-text-primary truncate">
            {card.fullName}
          </h3>
          <div className="text-[11px] text-text-secondary truncate">
            {card.jobTitle ?? "No role"} • {card.tenantName}
          </div>
        </div>
      </div>
      <button
        onClick={onClose}
        className="text-text-muted hover:text-text-primary"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Live QR preview ───
function PreviewSection({ card }: { card: CrmContactCardDto }) {
  const png = useDownloadCardPng();
  const svg = useDownloadCardSvg();
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const prevUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    setQrError(null);
    contactCardsApi
      .qrPng(card.userId, 512)
      .then((blob) => {
        if (!active) return;
        const url = window.URL.createObjectURL(blob);
        if (prevUrlRef.current) window.URL.revokeObjectURL(prevUrlRef.current);
        prevUrlRef.current = url;
        setQrUrl(url);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setQrUrl(null);
        setQrError(err instanceof Error ? err.message : "QR preview failed.");
      });
    return () => {
      active = false;
      if (prevUrlRef.current) {
        window.URL.revokeObjectURL(prevUrlRef.current);
        prevUrlRef.current = null;
      }
    };
  }, [card.userId]);

  return (
    <section className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-5 items-start">
      <div className="rounded-card bg-bg border-thin border-border-subtle p-4 flex flex-col items-center justify-center gap-2">
        {qrUrl ? (
          <img
            src={qrUrl}
            alt={`QR for ${card.fullName}`}
            className="w-48 h-48 rounded-md bg-white p-1"
          />
        ) : qrError ? (
          <div className="w-48 h-48 rounded-md bg-danger-soft border border-danger/30 flex items-center justify-center px-3 text-center text-[10px] text-danger">
            {qrError}
          </div>
        ) : (
          <div className="w-48 h-48 rounded-md bg-bg-input flex items-center justify-center text-text-muted">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        )}
        <p className="text-[10px] text-text-muted text-center leading-snug">
          Scanned by a phone camera, the contact is saved as:
          <br />
          <span className="font-semibold text-text-secondary">
            {card.fullName} — {card.tenantName} {card.jobTitle ? `· ${card.jobTitle}` : ""}
          </span>
        </p>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={btnPrimary}
            disabled={png.isPending}
            onClick={() => png.mutate(card.userId)}
          >
            {png.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            PNG (1024px)
          </button>
          <button
            type="button"
            className={btnGhost}
            disabled={svg.isPending}
            onClick={() => svg.mutate(card.userId)}
          >
            {svg.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            SVG
          </button>
        </div>

        <div className="rounded-card bg-glass-2 border-thin border-border-subtle p-3 text-xs space-y-1.5">
          <div className="flex items-center gap-2 text-text-secondary">
            <Smartphone className="w-3.5 h-3.5 text-text-muted" />
            When a customer scans, their phone asks &ldquo;Save this contact?&rdquo;.
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <Briefcase className="w-3.5 h-3.5 text-text-muted" />
            Organization = <span className="font-semibold text-text-primary">{card.tenantName}</span>
          </div>
          {card.tenantWebsite && (
            <div className="flex items-center gap-2 text-text-secondary">
              <Globe className="w-3.5 h-3.5 text-text-muted" />
              Website saved: <span className="font-semibold text-text-primary">{card.tenantWebsite}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-text-muted text-[10px] pt-1">
            <Hash className="w-3 h-3" />
            Token: {card.token}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Profile (inline edit for phone / jobTitle / department) ───
function ProfileSection({ card }: { card: CrmContactCardDto }) {
  const adminUpdate = useAdminUpdateUser();
  const [phone, setPhone] = useState(card.phone ?? "");
  const [jobTitle, setJobTitle] = useState(card.jobTitle ?? "");
  const [department, setDepartment] = useState(card.department ?? "");

  const dirty =
    phone !== (card.phone ?? "") ||
    jobTitle !== (card.jobTitle ?? "") ||
    department !== (card.department ?? "");

  function save() {
    adminUpdate.mutate(
      {
        userId: card.userId,
        data: {
          phone: phone.trim() || null,
          jobTitle: jobTitle.trim() || null,
          department: department.trim() || null,
        },
      },
      {
        onSuccess: () =>
          toast.success("Profile saved. QR will reflect new details on next load."),
      },
    );
  }

  return (
    <section className="space-y-2">
      <SectionHeader
        icon={<Edit3 className="w-3.5 h-3.5" />}
        title="Card details"
        subtitle="Phone and role are embedded in the QR. Keep them accurate."
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field
          icon={<Phone className="w-3.5 h-3.5" />}
          label="Phone"
          value={phone}
          onChange={setPhone}
          placeholder="+1 555 123 4567"
        />
        <Field
          icon={<Briefcase className="w-3.5 h-3.5" />}
          label="Role"
          value={jobTitle}
          onChange={setJobTitle}
          placeholder="Sales, Support, …"
        />
        <Field
          icon={<Building2 className="w-3.5 h-3.5" />}
          label="Department"
          value={department}
          onChange={setDepartment}
          placeholder="(optional)"
        />
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          className={btnPrimary}
          disabled={!dirty || adminUpdate.isPending}
          onClick={save}
        >
          {adminUpdate.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
          Save
        </button>
      </div>
    </section>
  );
}

function Field({
  icon,
  label,
  value,
  onChange,
  placeholder,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <input
        type="text"
        className={inputCls + " mt-1"}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

// ─── Share section: copy scan URL, copy vCard, open preview ───
function ShareSection({ card }: { card: CrmContactCardDto }) {
  const copyUrl = useCopyScanUrl();
  const copyMe = useCopyMeCard();

  const scanUrl = absolutePublicUrl(`/api/v1/c/card/${card.token}`);
  const vcardUrl = absolutePublicUrl(`/api/v1/c/card/${card.token}.vcf`);

  return (
    <section className="space-y-2">
      <SectionHeader
        icon={<LinkIcon className="w-3.5 h-3.5" />}
        title="Share"
        subtitle="Direct-scan link logs a hit and serves the vCard. The .vcf link skips logging."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-card bg-glass-2 border-thin border-border-subtle p-3">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">
            Scan URL (logs)
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[11px] text-text-secondary truncate font-mono">
              {scanUrl}
            </code>
            <button
              type="button"
              className={btnGhost}
              onClick={() => copyUrl.mutate(card.userId)}
              title="Copy scan URL"
            >
              {copyUrl.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
            <a
              href={scanUrl}
              target="_blank"
              rel="noreferrer"
              className={btnGhost}
              title="Open"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
        <div className="rounded-card bg-glass-2 border-thin border-border-subtle p-3">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">
            vCard file (.vcf)
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[11px] text-text-secondary truncate font-mono">
              {vcardUrl}
            </code>
            <button
              type="button"
              className={btnGhost}
              onClick={() => {
                navigator.clipboard
                  .writeText(vcardUrl)
                  .then(() => toast.success("vCard URL copied."))
                  .catch(() => toast.error("Clipboard write failed"));
              }}
              title="Copy .vcf URL"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <a
              href={vcardUrl}
              target="_blank"
              rel="noreferrer"
              className={btnGhost}
              title="Open .vcf"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={btnGhost}
          onClick={() => copyMe.mutate(card.userId)}
          title="Copy MECARD text"
        >
          {copyMe.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          Copy MECARD
        </button>
        <span className="text-[10px] text-text-muted">
          Filename: <span className="font-mono">{cardFilename(card, "png")}</span>
        </span>
      </div>
    </section>
  );
}

// ─── Settings: active flag, notes, regenerate token ───
function SettingsSection({ card }: { card: CrmContactCardDto }) {
  const update = useUpdateContactCard();
  const regen = useRegenerateToken();
  const [notes, setNotes] = useState(card.notes ?? "");

  useEffect(() => {
    setNotes(card.notes ?? "");
  }, [card.notes]);

  const notesDirty = notes !== (card.notes ?? "");

  function toggleActive() {
    update.mutate({ userId: card.userId, data: { isActive: !card.isActive } });
  }

  function saveNotes() {
    update.mutate({ userId: card.userId, data: { notes: notes.trim() || null } });
  }

  function confirmRegenerate() {
    if (!window.confirm("Regenerating the token invalidates the current QR and .vcf links. Continue?")) return;
    regen.mutate(card.userId);
  }

  return (
    <section className="space-y-2">
      <SectionHeader
        icon={<Power className="w-3.5 h-3.5" />}
        title="Card settings"
        subtitle="Inactive cards still resolve but the QR prompts no longer appear."
      />
      <div className="rounded-card bg-glass-2 border-thin border-border-subtle p-3 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-text-primary">
              {card.isActive ? "Card is active" : "Card is inactive"}
            </div>
            <div className="text-[10px] text-text-muted">
              {card.isActive
                ? "Customer phones will offer to save the contact."
                : "Scans are blocked."}
            </div>
          </div>
          <button
            type="button"
            className={btnGhost}
            onClick={toggleActive}
            disabled={update.isPending}
          >
            {card.isActive ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                Deactivate
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                Activate
              </>
            )}
          </button>
        </div>

        <div>
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
            Internal notes
          </label>
          <textarea
            className={inputCls + " mt-1 min-h-[64px]"}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="(only visible to your team)"
          />
          <div className="flex items-center justify-end gap-2 mt-2">
            <button
              type="button"
              className={btnPrimary}
              onClick={saveNotes}
              disabled={!notesDirty || update.isPending}
            >
              {update.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              Save notes
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-border-subtle">
          <div>
            <div className="text-xs font-semibold text-text-primary">Regenerate token</div>
            <div className="text-[10px] text-text-muted">
              Old QR codes and .vcf links stop working immediately.
            </div>
          </div>
          <button
            type="button"
            className={btnDanger}
            onClick={confirmRegenerate}
            disabled={regen.isPending}
          >
            {regen.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Regenerate
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Stats: total scans, unique visitors, recent ───
function StatsSection({ userId }: { userId: string }) {
  const { data, isLoading } = useContactCardStats(userId);

  if (isLoading) {
    return (
      <section>
        <SectionHeader icon={<BarChart3 className="w-3.5 h-3.5" />} title="Scan activity" />
        <div className="flex items-center justify-center h-20 text-text-muted text-xs">
          <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
          Loading…
        </div>
      </section>
    );
  }

  const stats = data ?? { cardId: userId, totalScans: 0, uniqueVisitors: 0, lastScannedAt: null, recentScans: [] };
  const recentScans: CrmContactCardScanEntryDto[] = stats.recentScans ?? [];

  return (
    <section className="space-y-2">
      <SectionHeader icon={<BarChart3 className="w-3.5 h-3.5" />} title="Scan activity" />
      <div className="grid grid-cols-3 gap-2">
        <StatBox label="Total scans" value={stats.totalScans} />
        <StatBox label="Unique phones" value={stats.uniqueVisitors} />
        <StatBox
          label="Last scan"
          value={
            stats.lastScannedAt
              ? formatDistanceToNow(new Date(stats.lastScannedAt), { addSuffix: true })
              : "Never"
          }
        />
      </div>
      <RecentList scans={recentScans} />
    </section>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-card bg-glass-2 border-thin border-border-subtle p-3">
      <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
        {label}
      </div>
      <div className="text-base font-extrabold text-text-primary mt-1">{value}</div>
    </div>
  );
}

function RecentList({ scans }: { scans: CrmContactCardScanEntryDto[] }) {
  if (scans.length === 0) {
    return (
      <div className="text-[10px] text-text-muted text-center py-3">
        No scans yet — share the QR to get started.
      </div>
    );
  }
  return (
    <ul className="rounded-card bg-glass border-thin border-border-subtle divide-y divide-border-subtle max-h-40 overflow-y-auto">
      {scans.slice(0, 20).map((s, i) => (
        <li
          key={`${s.scannedAt}-${i}`}
          className="px-3 py-1.5 flex items-center justify-between text-[11px]"
        >
          <span className="text-text-secondary">
            {formatDistanceToNow(new Date(s.scannedAt), { addSuffix: true })}
          </span>
          <span className="font-mono text-text-muted">{s.countryCode ?? "—"}</span>
        </li>
      ))}
    </ul>
  );
}

// ─── Tiny reusable sub-components ───
function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <h4 className="text-[11px] font-extrabold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
        {icon}
        {title}
      </h4>
      {subtitle && <p className="text-[10px] text-text-muted mt-0.5">{subtitle}</p>}
    </div>
  );
}

function initialsOf(first: string, last: string): string {
  const a = (first ?? "").trim().charAt(0).toUpperCase();
  const b = (last ?? "").trim().charAt(0).toUpperCase();
  return `${a}${b}` || "·";
}
