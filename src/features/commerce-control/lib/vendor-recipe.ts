export type VendorRecipeDraft = {
  title: string;
  musicTrackRefId: string;
  productVariantIds: string;
  brandStoryAnchor: string;
  moodLabel: string;
  durationSeconds: string;
  songTitle: string;
  artist: string;
  caption: string;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function required(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${label} est obligatoire.`);
  return trimmed;
}

export function buildVendorRecipePayload(draft: VendorRecipeDraft) {
  const title = required(draft.title, 'The title');
  const musicTrackRefId = required(draft.musicTrackRefId, 'The music track');
  const brandStoryAnchor = required(draft.brandStoryAnchor, "The brand story");
  const moodLabel = required(draft.moodLabel, "L'ambiance");
  const songTitle = required(draft.songTitle, 'The music title');
  const artist = required(draft.artist, "L'artiste");
  const caption = required(draft.caption, 'La legende');
  const productVariantIds = draft.productVariantIds.split(',').map((value) => value.trim()).filter(Boolean);
  const durationSeconds = Number(draft.durationSeconds);

  if (!uuidPattern.test(musicTrackRefId)) throw new Error("L'ID de piste musicale est invalide.");
  if (!productVariantIds.length) throw new Error('Au moins une variante produit est obligatoire.');
  if (productVariantIds.some((id) => !uuidPattern.test(id)))
    throw new Error('Un ID de variante produit est invalide.');
  if (!Number.isInteger(durationSeconds) || durationSeconds < 5 || durationSeconds > 180)
    throw new Error('La duree doit etre un nombre entier entre 5 et 180 secondes.');

  const durationMs = durationSeconds * 1000;
  const firstEnd = Math.floor(durationMs / 3);
  const secondEnd = Math.floor((durationMs * 2) / 3);
  const captions = [caption, `${caption} Decouvrez Kin Marche.`, `${caption} Commandez maintenant.`];

  return {
    title,
    musicTrackRefId,
    context: {
      productVariantIds,
      categoryIds: [],
      brandStoryAnchor,
      moodLabel,
      targetAudience: {
        primaryAgeBucket: '18-44',
        primaryRegions: ['Kinshasa'],
        primaryGenderTilt: 'balanced',
        interestThemes: ['produits locaux', 'qualite', 'vie quotidienne'],
      },
      intendedDurationSeconds: durationSeconds,
    },
    segment: { songTitle, artist, startMs: 0, endMs: durationMs, segmentCharacter: moodLabel, listenLinks: [] },
    beats: [
      {
        order: 0, reelTimeStartMs: 0, reelTimeEndMs: firstEnd,
        songTimeStartMs: 0, songTimeEndMs: firstEnd, kind: 1,
        label: 'Accroche', direction: "Presenter le besoin quotidien et capter l'attention.",
        shotHints: ['Plan humain', 'Produit en contexte'], captionOverlay: 'Un besoin, une solution',
        productFocus: brandStoryAnchor, emphasisScore: 0.9,
      },
      {
        order: 1, reelTimeStartMs: firstEnd, reelTimeEndMs: secondEnd,
        songTimeStartMs: firstEnd, songTimeEndMs: secondEnd, kind: 2,
        label: 'Story', direction: "Montrer l'utilisation du produit et son benefice concret.",
        shotHints: ['Demonstration', 'Reaction authentique'], captionOverlay: 'Simple, frais, utile',
        productFocus: brandStoryAnchor, emphasisScore: 0.75,
      },
      {
        order: 2, reelTimeStartMs: secondEnd, reelTimeEndMs: durationMs,
        songTimeStartMs: secondEnd, songTimeEndMs: durationMs, kind: 5,
        label: "Appel a l'action", direction: 'Terminer sur le produit et inviter a commander.',
        shotHints: ['Hero shot', 'Logo Kin Marche'], captionOverlay: 'Disponible sur Kin Marche',
        productFocus: brandStoryAnchor, emphasisScore: 1,
      },
    ],
    captionVariants: captions.map((text, index) => ({
      text,
      tone: index === 0 ? 'authentique' : index === 1 ? 'inspirant' : 'direct',
      characterLength: text.length,
      hashtagCount: 3,
      recommendedForPlatform: index === 0 ? 'Instagram' : index === 1 ? 'Facebook' : 'TikTok',
    })),
    platformAdaptations: [
      { platform: 1, findSoundInstructions: 'Search for the track in Instagram Audio', segmentUsageNote: 'Use the full segment', aspectRatio: 1, recommendedDurationSeconds: durationSeconds, hashtagSet: ['KinMarche', 'Kinshasa', 'Stylemint'] },
      { platform: 2, findSoundInstructions: 'Search for the track in TikTok Sounds', segmentUsageNote: 'Sync the cuts to the beat', aspectRatio: 1, recommendedDurationSeconds: durationSeconds, hashtagSet: ['KinMarche', 'TikTokRDC', 'Stylemint'] },
      { platform: 3, findSoundInstructions: 'Search for the track in YouTube Audio', segmentUsageNote: "Keep the final call to action", aspectRatio: 1, recommendedDurationSeconds: durationSeconds, hashtagSet: ['KinMarche', 'Shorts', 'Stylemint'] },
      { platform: 4, findSoundInstructions: 'Search for the track in Facebook Music', segmentUsageNote: 'Show subtitles', aspectRatio: 1, recommendedDurationSeconds: durationSeconds, hashtagSet: ['KinMarche', 'RDC', 'Stylemint'] },
    ],
    reasoning: {
      headlineRationale: 'Structure narrative en trois temps adaptee a une demonstration commerciale Kin Marche.',
      signalsUsed: [
        { featureKey: 'story_hook', contribution: 0.34, plainLanguage: "Une accroche humaine retient l'attention." },
        { featureKey: 'product_use', contribution: 0.33, plainLanguage: 'La demonstration rend la valeur concrete.' },
        { featureKey: 'clear_cta', contribution: 0.33, plainLanguage: 'Un appel clair facilite la conversion.' },
      ],
      dataPoints: [{ metric: 'baseline_story_template', value: 1, baselineValue: 0, context: 'Modele initial cree dans Lead360.' }],
    },
    recipeVersion: 'v1',
  };
}
