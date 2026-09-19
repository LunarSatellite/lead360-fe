import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle2, Loader2, PackagePlus, Upload, X } from 'lucide-react';
import { stylemintCommerceApi } from '../api/stylemint-commerce.api';

type Props = { onClose: () => void; onDone: () => void };

const initial = {
  categoryId: '',
  name: '',
  shortDescription: '',
  longDescription: '',
  sku: '',
  price: '',
  cost: '',
  quantity: '',
  imageUrls: '',
  videoUrl: '',
  posterUrl: '',
  duration: '40',
  processingDays: '1',
  weightGrams: '500',
  lengthCm: '20',
  widthCm: '20',
  heightCm: '10',
  shippingFee: '0',
  shippingMin: '1',
  shippingMax: '3',
  publish: true,
};

export function ProductComposer({ onClose, onDone }: Props) {
  const [form, setForm] = useState(initial);
  const [createdId, setCreatedId] = useState('');
  const images = useMemo(
    () =>
      form.imageUrls
        .split(/\r?\n/)
        .map((url) => url.trim())
        .filter(Boolean),
    [form.imageUrls],
  );
  const categories = useQuery({
    queryKey: ['stylemint-categories'],
    queryFn: stylemintCommerceApi.categories,
    retry: false,
  });
  const set = (key: keyof typeof initial, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));
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

  const create = useMutation({
    mutationFn: async () => {
      if (images.length < 5 || images.length > 10) throw new Error('Add between 5 and 10 images.');
      const draft = await stylemintCommerceApi.createVendorProduct({
        categoryId: form.categoryId.trim(),
        name: form.name.trim(),
        shortDescription: form.shortDescription.trim(),
        longDescriptionMarkdown: form.longDescription.trim(),
      });
      const productId = String(draft.id ?? (draft.data as Record<string, unknown> | undefined)?.id ?? '');
      if (!productId) throw new Error('Stylemint n’a pas retourne l’identifiant produit.');
      setCreatedId(productId);

      await stylemintCommerceApi.updateVendorProduct(productId, 'step-2', {
        images: images.map((cdnUrl, index) => ({ cdnUrl, sortOrder: index, isPrimary: index === 0 })),
        video: form.videoUrl.trim()
          ? {
              cdnUrl: form.videoUrl.trim(),
              durationSeconds: Number(form.duration),
              posterCdnUrl: form.posterUrl.trim() || images[0],
            }
          : null,
      });
      await stylemintCommerceApi.updateVendorProduct(productId, 'step-3', {
        sku: form.sku.trim(),
        priceAmount: Number(form.price),
        priceCurrency: 'CDF',
        costPriceAmount: Number(form.cost),
        costPriceCurrency: 'CDF',
        trackInventory: true,
        allowOverselling: false,
        quantityOnHand: Number(form.quantity),
        productKind: 1,
        billingCadence: 1,
      });
      await stylemintCommerceApi.updateVendorProduct(productId, 'step-4', {
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
      if (form.publish) await stylemintCommerceApi.vendorProductAction(productId, 'publish');
      return productId;
    },
    onSuccess: onDone,
  });

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
          create.mutate();
        }}
        className="relative max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-[24px] border border-border-subtle bg-bg-card shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between border-b border-border-subtle bg-bg-card/95 px-5 py-4 backdrop-blur-xl">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
              Catalogue Stylemint
            </p>
            <h2 className="mt-1 text-xl font-black text-text-primary">New Kin Marche product</h2>
            <p className="mt-1 text-xs text-text-muted">
              Produit, cinq visuels minimum, reel, prix CDF, stock et livraison dans un seul parcours.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border-subtle p-2 text-text-muted hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="grid gap-5 p-5 lg:grid-cols-2">
          <Section title="1. Identite produit">
            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                Category
              </span>
              <select
                required
                value={form.categoryId}
                onChange={(event) => set('categoryId', event.target.value)}
                className="w-full rounded-xl border border-border-subtle bg-bg-card px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand/50"
              >
                <option value="">
                  {categories.isLoading ? 'Chargement…' : 'Select a category'}
                </option>
                {(categories.data ?? [])
                  .filter((category) => category.isActive)
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.nameEn} · {category.slug}
                    </option>
                  ))}
              </select>
              {categories.isError && (
                <span className="block text-[10px] font-semibold text-danger">
                  Categories are unavailable. Check the Stylemint connection.
                </span>
              )}
            </label>
            <Input label="Nom" value={form.name} onChange={(value) => set('name', value)} required />
            <Input
              label="Description courte"
              value={form.shortDescription}
              onChange={(value) => set('shortDescription', value)}
              required
            />
            <Area
              label="Description complete"
              value={form.longDescription}
              onChange={(value) => set('longDescription', value)}
              required
            />
          </Section>

          <Section title="2. Images and reel">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-brand/35 bg-brand/5 px-4 py-3 text-xs font-extrabold text-brand">
              {uploadImages.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploadImages.isPending ? 'Uploading to Stylemint…' : 'Upload JPG/PNG images'}
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
              label={`URLs images — une par ligne (${images.length}/5 minimum)`}
              value={form.imageUrls}
              onChange={(value) => set('imageUrls', value)}
              required
              rows={7}
            />
            <Input
              label="Reel / video URL"
              value={form.videoUrl}
              onChange={(value) => set('videoUrl', value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Reel poster"
                value={form.posterUrl}
                onChange={(value) => set('posterUrl', value)}
              />
              <Input
                label="Duree (secondes)"
                type="number"
                value={form.duration}
                onChange={(value) => set('duration', value)}
              />
            </div>
          </Section>

          <Section title="3. Price and inventory">
            <Input label="SKU" value={form.sku} onChange={(value) => set('sku', value)} required />
            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Price (CDF)"
                type="number"
                value={form.price}
                onChange={(value) => set('price', value)}
                required
              />
              <Input
                label="Cout CDF"
                type="number"
                value={form.cost}
                onChange={(value) => set('cost', value)}
                required
              />
              <Input
                label="Stock"
                type="number"
                value={form.quantity}
                onChange={(value) => set('quantity', value)}
                required
              />
            </div>
          </Section>

          <Section title="4. Livraison Kinshasa">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Preparation (jours)"
                type="number"
                value={form.processingDays}
                onChange={(value) => set('processingDays', value)}
              />
              <Input
                label="Poids (g)"
                type="number"
                value={form.weightGrams}
                onChange={(value) => set('weightGrams', value)}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Longueur cm"
                type="number"
                value={form.lengthCm}
                onChange={(value) => set('lengthCm', value)}
              />
              <Input
                label="Largeur cm"
                type="number"
                value={form.widthCm}
                onChange={(value) => set('widthCm', value)}
              />
              <Input
                label="Hauteur cm"
                type="number"
                value={form.heightCm}
                onChange={(value) => set('heightCm', value)}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Frais CDF"
                type="number"
                value={form.shippingFee}
                onChange={(value) => set('shippingFee', value)}
              />
              <Input
                label="Delai min"
                type="number"
                value={form.shippingMin}
                onChange={(value) => set('shippingMin', value)}
              />
              <Input
                label="Delai max"
                type="number"
                value={form.shippingMax}
                onChange={(value) => set('shippingMax', value)}
              />
            </div>
            <label className="flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-elevated p-3 text-xs font-semibold text-text-secondary">
              <input
                type="checkbox"
                checked={form.publish}
                onChange={(event) => set('publish', event.target.checked)}
                className="accent-[var(--color-brand)]"
              />
              Publier automatiquement apres validation des quatre etapes
            </label>
          </Section>
        </div>

        {(create.isError || uploadImages.isError) && (
          <div className="mx-5 mb-4 rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-xs font-semibold text-danger">
            {((create.error || uploadImages.error) as Error).message}
            {createdId ? ` Brouillon conserve: ${createdId}` : ''}
          </div>
        )}
        <footer className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-border-subtle bg-bg-card/95 px-5 py-4 backdrop-blur-xl">
          <p className="hidden items-center gap-1.5 text-[11px] text-text-muted sm:flex">
            <CheckCircle2 className="h-3.5 w-3.5 text-brand" />
            CDF · stock suivi · livraison standard
          </p>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border-subtle px-4 py-2.5 text-xs font-bold text-text-secondary"
            >
              Cancel
            </button>
            <button
              disabled={create.isPending || images.length < 5}
              className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-xs font-extrabold text-black disabled:opacity-40"
            >
              {create.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PackagePlus className="h-4 w-4" />
              )}
              {create.isPending ? 'Creation en cours…' : 'Create product'}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl border border-border-subtle bg-bg-elevated p-4">
      <h3 className="text-xs font-extrabold uppercase tracking-wider text-text-primary">{title}</h3>
      {children}
    </section>
  );
}
function Input({
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
    <label className="block space-y-1.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{label}</span>
      <input
        type={type}
        min={type === 'number' ? 0 : undefined}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-border-subtle bg-bg-card px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand/50"
      />
    </label>
  );
}
function Area({
  label,
  value,
  onChange,
  required,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  rows?: number;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{label}</span>
      <textarea
        rows={rows}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y rounded-xl border border-border-subtle bg-bg-card px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand/50"
      />
    </label>
  );
}
