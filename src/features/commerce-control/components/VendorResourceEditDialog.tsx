import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Image, Loader2, Package, Save, Truck, Upload, X } from 'lucide-react';
import { stylemintCommerceApi } from '../api/stylemint-commerce.api';

type Props = {
  kind: 'product' | 'store';
  id: string;
  initial: Record<string, unknown>;
  onClose: () => void;
  onSaved: () => void;
};
const text = (value: unknown) => String(value ?? '');
const list = (value: unknown) => (Array.isArray(value) ? (value as Record<string, unknown>[]) : []);
const nested = (source: Record<string, unknown>, key: string) =>
  source[key] && typeof source[key] === 'object' ? (source[key] as Record<string, unknown>) : {};

const empty = {
  categoryId: '',
  name: '',
  shortDescription: '',
  longDescriptionMarkdown: '',
  addressLine: '',
  city: 'Kinshasa',
  phone: '',
  latitude: '',
  longitude: '',
  imageUrls: '',
  videoUrl: '',
  posterUrl: '',
  duration: '40',
  sku: '',
  price: '',
  cost: '',
  quantity: '',
  trackInventory: true,
  allowOverselling: false,
  processingDays: '1',
  weightGrams: '500',
  lengthCm: '20',
  widthCm: '20',
  heightCm: '10',
  shippingFee: '0',
  shippingMin: '1',
  shippingMax: '3',
};

export function VendorResourceEditDialog({ kind, id, initial, onClose, onSaved }: Props) {
  const details = useQuery({
    queryKey: ['stylemint-vendor-product', id],
    queryFn: () => stylemintCommerceApi.vendorProduct(id),
    enabled: kind === 'product',
    retry: false,
  });
  const categories = useQuery({
    queryKey: ['stylemint-categories'],
    queryFn: stylemintCommerceApi.categories,
    enabled: kind === 'product',
    retry: false,
  });
  const [form, setForm] = useState(empty);
  const [sections, setSections] = useState({ media: false, pricing: false, shipping: false });
  const images = useMemo(
    () =>
      form.imageUrls
        .split(/\r?\n/)
        .map((x) => x.trim())
        .filter(Boolean),
    [form.imageUrls],
  );
  const uploadImages = useMutation({
    mutationFn: async (files: File[]) => {
      const urls: string[] = [];
      for (const file of files) {
        const result = await stylemintCommerceApi.uploadVendorProductImage(file);
        const wrapped =
          result.data && typeof result.data === 'object' ? (result.data as Record<string, unknown>) : result;
        const url = String(wrapped.url ?? '');
        if (!url) throw new Error(`URL absente apres l'envoi de ${file.name}.`);
        urls.push(url);
      }
      return urls;
    },
    onSuccess: (urls) => set('imageUrls', [...images, ...urls].slice(0, 10).join('\n')),
  });
  const source = useMemo(() => {
    const raw = kind === 'product' ? details.data : initial;
    if (!raw || typeof raw !== 'object') return initial;
    const wrapped = raw as Record<string, unknown>;
    return wrapped.data && typeof wrapped.data === 'object'
      ? (wrapped.data as Record<string, unknown>)
      : wrapped;
  }, [details.data, initial, kind]);

  useEffect(() => {
    const pricing = nested(source, 'pricing');
    const shipping = nested(source, 'shipping');
    const video = nested(source, 'video');
    const variants = list(source.variants);
    const firstVariant = variants[0] ?? {};
    const shippingOptions = list(shipping.shippingOptions ?? source.shippingOptions);
    const firstShipping = shippingOptions[0] ?? {};
    const sourceImages = list(source.images);
    setForm({
      ...empty,
      categoryId: text(source.categoryId),
      name: text(source.name),
      shortDescription: text(source.shortDescription),
      longDescriptionMarkdown: text(source.longDescriptionMarkdown),
      addressLine: text(source.addressLine),
      city: text(source.city || 'Kinshasa'),
      phone: text(source.phone),
      latitude: text(source.latitude),
      longitude: text(source.longitude),
      imageUrls: sourceImages
        .map((item) => text(item.cdnUrl || item.url))
        .filter(Boolean)
        .join('\n'),
      videoUrl: text(video.cdnUrl || source.videoUrl),
      posterUrl: text(video.posterCdnUrl || source.posterUrl),
      duration: text(video.durationSeconds || 40),
      sku: text(pricing.sku || source.sku || firstVariant.sku),
      price: text(pricing.priceAmount || source.priceAmount || firstVariant.priceAmount),
      cost: text(pricing.costPriceAmount || source.costPriceAmount || 0),
      quantity: text(pricing.quantityOnHand || source.quantityOnHand || firstVariant.quantityOnHand || 0),
      trackInventory: Boolean(pricing.trackInventory ?? source.trackInventory ?? true),
      allowOverselling: Boolean(pricing.allowOverselling ?? source.allowOverselling ?? false),
      processingDays: text(shipping.processingTimeDays || source.processingTimeDays || 1),
      weightGrams: text(shipping.weightGrams || source.weightGrams || 500),
      lengthCm: text(shipping.lengthCm || source.lengthCm || 20),
      widthCm: text(shipping.widthCm || source.widthCm || 20),
      heightCm: text(shipping.heightCm || source.heightCm || 10),
      shippingFee: text(firstShipping.feeAmount || 0),
      shippingMin: text(firstShipping.estimatedDaysMin || 1),
      shippingMax: text(firstShipping.estimatedDaysMax || 3),
    });
  }, [source]);

  const save = useMutation({
    mutationFn: async () => {
      if (kind === 'store')
        return stylemintCommerceApi.updateVendorStore(id, {
          name: form.name.trim(),
          addressLine: form.addressLine.trim(),
          city: form.city.trim(),
          phone: form.phone.trim() || undefined,
          latitude: form.latitude ? Number(form.latitude) : undefined,
          longitude: form.longitude ? Number(form.longitude) : undefined,
        });
      if (sections.media && (images.length < 5 || images.length > 10))
        throw new Error('Les medias exigent entre 5 et 10 images.');
      await stylemintCommerceApi.updateVendorProduct(id, 'details/basic', {
        categoryId: form.categoryId,
        name: form.name.trim(),
        shortDescription: form.shortDescription.trim(),
        longDescriptionMarkdown: form.longDescriptionMarkdown.trim(),
      });
      if (sections.media)
        await stylemintCommerceApi.updateVendorProduct(id, 'images', {
          images: images.map((cdnUrl, index) => ({ cdnUrl, sortOrder: index, isPrimary: index === 0 })),
          video: form.videoUrl.trim()
            ? {
                cdnUrl: form.videoUrl.trim(),
                durationSeconds: Number(form.duration),
                posterCdnUrl: form.posterUrl.trim() || images[0],
              }
            : null,
        });
      if (sections.pricing)
        await stylemintCommerceApi.updateVendorProduct(id, 'details/pricing', {
          sku: form.sku.trim(),
          priceAmount: Number(form.price),
          priceCurrency: 'CDF',
          costPriceAmount: Number(form.cost),
          costPriceCurrency: 'CDF',
          trackInventory: form.trackInventory,
          allowOverselling: form.allowOverselling,
          quantityOnHand: Number(form.quantity),
          productKind: 1,
          billingCadence: 1,
        });
      if (sections.shipping)
        await stylemintCommerceApi.updateVendorProduct(id, 'details/shipping', {
          processingTimeDays: Number(form.processingDays),
          shipsFromAddressId: null,
          weightGrams: Number(form.weightGrams),
          lengthCm: Number(form.lengthCm),
          widthCm: Number(form.widthCm),
          heightCm: Number(form.heightCm),
          shippingOptions: [
            {
              kind: 1,
              feeAmount: Number(form.shippingFee),
              feeCurrency: 'CDF',
              estimatedDaysMin: Number(form.shippingMin),
              estimatedDaysMax: Number(form.shippingMax),
            },
          ],
        });
      return id;
    },
    onSuccess: onSaved,
  });
  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));
  const valid =
    kind === 'product'
      ? !!form.categoryId &&
        !!form.name.trim() &&
        !!form.shortDescription.trim() &&
        !!form.longDescriptionMarkdown.trim() &&
        (!sections.media || (images.length >= 5 && images.length <= 10)) &&
        (!sections.pricing || (!!form.sku.trim() && form.price !== '' && form.quantity !== ''))
      : !!form.name.trim() && !!form.addressLine.trim() && !!form.city.trim();

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 md:p-6">
      <button
        aria-label="Fermer"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate();
        }}
        className="relative max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-[24px] border border-brand/20 bg-bg-card shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between border-b border-border-subtle bg-bg-card/95 px-5 py-4 backdrop-blur-xl">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-brand">
              Edition Stylemint
            </p>
            <h3 className="mt-1 text-xl font-black text-text-primary">
              {kind === 'product' ? 'Modifier le produit complet' : 'Modifier le magasin'}
            </h3>
            {kind === 'product' && (
              <p className="mt-1 text-xs text-text-muted">
                Activez uniquement les blocs que vous souhaitez remplacer.
              </p>
            )}
          </div>
          <button type="button" onClick={onClose}>
            <X className="h-4 w-4 text-text-muted" />
          </button>
        </header>
        {details.isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : (
          <div className="grid gap-4 p-5 lg:grid-cols-2">
            {kind === 'product' ? (
              <>
                <Section title="Identite produit">
                  <Field label="Categorie">
                    <select
                      required
                      value={form.categoryId}
                      onChange={(e) => set('categoryId', e.target.value)}
                      className={control}
                    >
                      <option value="">Choisir</option>
                      {(categories.data ?? []).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nameEn}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Input label="Nom" value={form.name} onChange={(v) => set('name', v)} />
                  <Input
                    label="Description courte"
                    value={form.shortDescription}
                    onChange={(v) => set('shortDescription', v)}
                  />
                  <Area
                    label="Description complete"
                    value={form.longDescriptionMarkdown}
                    onChange={(v) => set('longDescriptionMarkdown', v)}
                    rows={6}
                  />
                </Section>
                <OptionalSection
                  icon={<Image className="h-4 w-4" />}
                  title="Images et reel"
                  enabled={sections.media}
                  onToggle={(value) => setSections((s) => ({ ...s, media: value }))}
                >
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-brand/35 bg-brand/5 px-4 py-3 text-xs font-extrabold text-brand">
                    {uploadImages.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {uploadImages.isPending ? 'Envoi vers Stylemint…' : 'Ajouter des images JPG/PNG'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      multiple
                      className="hidden"
                      disabled={uploadImages.isPending}
                      onChange={(event) => {
                        const files = Array.from(event.target.files ?? []).slice(
                          0,
                          Math.max(0, 10 - images.length),
                        );
                        if (files.length) uploadImages.mutate(files);
                        event.target.value = '';
                      }}
                    />
                  </label>
                  <Area
                    label={`URLs images, une par ligne (${images.length}/5 minimum)`}
                    value={form.imageUrls}
                    onChange={(v) => set('imageUrls', v)}
                    rows={6}
                  />
                  <Input
                    label="URL du reel"
                    value={form.videoUrl}
                    onChange={(v) => set('videoUrl', v)}
                    required={false}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Poster"
                      value={form.posterUrl}
                      onChange={(v) => set('posterUrl', v)}
                      required={false}
                    />
                    <Input
                      label="Duree sec."
                      type="number"
                      value={form.duration}
                      onChange={(v) => set('duration', v)}
                    />
                  </div>
                </OptionalSection>
                <OptionalSection
                  icon={<Package className="h-4 w-4" />}
                  title="Prix et inventaire"
                  enabled={sections.pricing}
                  onToggle={(value) => setSections((s) => ({ ...s, pricing: value }))}
                >
                  <Input label="SKU" value={form.sku} onChange={(v) => set('sku', v)} />
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      label="Prix CDF"
                      type="number"
                      value={form.price}
                      onChange={(v) => set('price', v)}
                    />
                    <Input
                      label="Cout CDF"
                      type="number"
                      value={form.cost}
                      onChange={(v) => set('cost', v)}
                    />
                    <Input
                      label="Stock"
                      type="number"
                      value={form.quantity}
                      onChange={(v) => set('quantity', v)}
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Check
                      label="Suivre le stock"
                      checked={form.trackInventory}
                      onChange={(v) => set('trackInventory', v)}
                    />
                    <Check
                      label="Autoriser la survente"
                      checked={form.allowOverselling}
                      onChange={(v) => set('allowOverselling', v)}
                    />
                  </div>
                </OptionalSection>
                <OptionalSection
                  icon={<Truck className="h-4 w-4" />}
                  title="Livraison"
                  enabled={sections.shipping}
                  onToggle={(value) => setSections((s) => ({ ...s, shipping: value }))}
                >
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Preparation jours"
                      type="number"
                      value={form.processingDays}
                      onChange={(v) => set('processingDays', v)}
                    />
                    <Input
                      label="Poids g"
                      type="number"
                      value={form.weightGrams}
                      onChange={(v) => set('weightGrams', v)}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      label="Longueur cm"
                      type="number"
                      value={form.lengthCm}
                      onChange={(v) => set('lengthCm', v)}
                    />
                    <Input
                      label="Largeur cm"
                      type="number"
                      value={form.widthCm}
                      onChange={(v) => set('widthCm', v)}
                    />
                    <Input
                      label="Hauteur cm"
                      type="number"
                      value={form.heightCm}
                      onChange={(v) => set('heightCm', v)}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      label="Frais CDF"
                      type="number"
                      value={form.shippingFee}
                      onChange={(v) => set('shippingFee', v)}
                    />
                    <Input
                      label="Delai min"
                      type="number"
                      value={form.shippingMin}
                      onChange={(v) => set('shippingMin', v)}
                    />
                    <Input
                      label="Delai max"
                      type="number"
                      value={form.shippingMax}
                      onChange={(v) => set('shippingMax', v)}
                    />
                  </div>
                </OptionalSection>
              </>
            ) : (
              <Section title="Coordonnees du magasin">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input label="Nom" value={form.name} onChange={(v) => set('name', v)} />
                  <Input label="Ville" value={form.city} onChange={(v) => set('city', v)} />
                  <div className="md:col-span-2">
                    <Input label="Adresse" value={form.addressLine} onChange={(v) => set('addressLine', v)} />
                  </div>
                  <Input
                    label="Telephone"
                    value={form.phone}
                    onChange={(v) => set('phone', v)}
                    required={false}
                  />
                  <Input
                    label="Latitude"
                    value={form.latitude}
                    onChange={(v) => set('latitude', v)}
                    required={false}
                  />
                  <Input
                    label="Longitude"
                    value={form.longitude}
                    onChange={(v) => set('longitude', v)}
                    required={false}
                  />
                </div>
              </Section>
            )}
          </div>
        )}
        {(save.isError || uploadImages.isError) && (
          <p className="mx-5 mb-4 rounded-xl bg-danger-soft px-4 py-3 text-xs font-semibold text-danger">
            {((save.error || uploadImages.error) as Error).message}
          </p>
        )}
        <footer className="sticky bottom-0 border-t border-border-subtle bg-bg-card/95 px-5 py-4 backdrop-blur-xl">
          <button
            disabled={save.isPending || details.isLoading || !valid}
            className="ml-auto flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-extrabold text-black disabled:opacity-40"
          >
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save and synchronize
          </button>
        </footer>
      </form>
    </div>
  );
}

const control =
  'w-full rounded-xl border border-border-subtle bg-bg-card px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand/50';
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl border border-border-subtle bg-bg-elevated p-4">
      <h4 className="text-xs font-extrabold uppercase tracking-wider text-text-primary">{title}</h4>
      {children}
    </section>
  );
}
function OptionalSection({
  icon,
  title,
  enabled,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  enabled: boolean;
  onToggle: (value: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border p-4 ${enabled ? 'border-brand/35 bg-brand/5' : 'border-border-subtle bg-bg-elevated'}`}
    >
      <label className="flex cursor-pointer items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-text-primary">
          {icon}
          {title}
        </span>
        <span className="flex items-center gap-2 text-[10px] font-bold uppercase text-text-muted">
          Remplacer
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
            className="accent-[var(--color-brand)]"
          />
        </span>
      </label>
      {enabled && <div className="mt-4 space-y-3">{children}</div>}
    </section>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] font-bold uppercase text-text-muted">{label}</span>
      {children}
    </label>
  );
}
function Input({
  label,
  value,
  onChange,
  required = true,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <Field label={label}>
      <input
        type={type}
        min={type === 'number' ? 0 : undefined}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={control}
      />
    </Field>
  );
}
function Area({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <Field label={label}>
      <textarea
        required
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${control} resize-y`}
      />
    </Field>
  );
}
function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-card p-3 text-xs font-semibold text-text-secondary">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-[var(--color-brand)]"
      />
      {label}
    </label>
  );
}
