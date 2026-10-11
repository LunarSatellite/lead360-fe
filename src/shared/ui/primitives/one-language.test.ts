import { describe, expect, it } from 'vitest';

/**
 * The admin speaks one language.
 *
 * It was two. The nav, the breadcrumbs, every page title and every
 * primitive were English; 80 strings inside the Stylemint console were
 * French — and not consistently, so a refund dialog read:
 *
 *   "Je confirme le remboursement de 45 000 CDF for order KM-1182.
 *    Cette operation financiere sera auditee."
 *
 * One sentence, both languages, on the control that moves money. Elsewhere
 * a heading was French over an English subtitle ("Origine du trafic" /
 * "Contribution by platform"), and two buttons sat side by side reading
 * "Save package seal" and "Confirmer la remise au transporteur".
 *
 * This is not an argument that English is the right language for a
 * Kinshasa marketplace — it may well not be. It is that a product cannot
 * pick per string. If this console should be French, that is an i18n
 * project (there is no i18n library here at all, and every number is
 * formatted `en-US`), and this check should be deleted as part of it.
 * Until then, one language.
 *
 * The vocabulary below is narrow on purpose: only words that are French
 * and are not also English words or plausible identifiers. `operation`,
 * `diffusion`, `structure`, `evolution` and `programmer` were all in the
 * strings this replaced, and all are dropped, because a scanner cannot
 * tell them from English and a reviewer reading a diff cannot either.
 * Catching most of it with no false alarms beats catching all of it with
 * a few, because a check that cries wolf gets switched off.
 */

const SOURCES = import.meta.glob('/src/**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const FRENCH = [
  'actualiser', 'actualisez', 'ajoutez', 'jeton', 'operateur', 'opérateur',
  'securisee', 'sécurisée', 'donnees', 'données', 'reelles', 'réelles',
  'vendeur', 'legende', 'legendes', 'légende', 'montant', 'montants',
  'journaliers', 'jours', 'revenu', 'origine', 'trafic', 'commande',
  'commandes', 'transporteur', 'rejeter', 'annuler', 'acces', 'accès',
  'seule', 'seul', 'scelle', 'scellé', 'remboursement', 'remboursable',
  'rembourser', 'paiement', 'verifier', 'vérifier', 'possede', 'possède',
  'financiere', 'financière', 'auditee', 'auditée', 'suspendre', 'reactiver',
  'réactiver', 'proprietaire', 'propriétaire', 'reservees', 'réservées',
  'consulter', 'administrateur', 'publier', 'publiez', 'genere', 'génère',
  'necessaires', 'nécessaires', 'verrouillage', 'entrez', 'identifiants',
  'souhaite', 'souhaité', 'souhaitez', 'separes', 'séparés', 'virgules',
  'bordereaux', 'generer', 'générer', 'ouvrir', 'activez', 'uniquement',
  'blocs', 'remplacer', 'remplacement', 'visuels', 'livraison', 'parcours',
  'apres', 'après', 'etapes', 'étapes', 'ajustez', 'programmez', 'aucune',
  'attribuee', 'attribuees', 'attribuées', 'periode', 'période', 'cette',
  'une', 'des', 'dans', 'pour', 'avec', 'vous', 'sont', 'sera', 'puis',
  'ensuite', 'les', 'aux', 'votre', 'ainsi', 'quatre', 'trois', 'cinq',
  'remise', 'inspirant', 'authentique', 'adaptee', 'adaptée', 'commerciale',
  'tableau', 'artiste', 'duree', 'durée', 'sujet', 'frais', 'utile',
  'precedente', 'précédente', 'reparation', 'réparation', 'conseil',
  'selectionnee', 'sélectionnée', 'absente', 'envoi', 'ville', 'mensuel',
  'produit', 'prix', 'suivi', 'automatiquement',
];

const VOCABULARY = new RegExp(`(?<![\\w-])(${FRENCH.join('|')})(?![\\w-])`, 'gi');

/**
 * A comment that explains a French string would keep this red forever
 * after the string itself is gone — this very file is the proof, since it
 * quotes the sentence it exists to prevent.
 */
function withoutComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, '');
}

function frenchIn(source: string): string[] {
  const found: string[] = [];
  withoutComments(source)
    .split('\n')
    .forEach((line, index) => {
      if (/^\s*import\s/.test(line) || line.includes("from '")) return;
      const words = [...new Set([...line.matchAll(VOCABULARY)].map((m) => m[1].toLowerCase()))];
      if (words.length) found.push(`line ${index + 1} [${words.join(', ')}]: ${line.trim().slice(0, 90)}`);
    });
  return found;
}

describe('the admin speaks one language', () => {
  it('is actually reading the source tree', () => {
    /**
     * Without this the suite passes when the glob matches nothing — a
     * green test that checked zero files, which is the quietest way for
     * this whole check to stop meaning anything.
     */
    expect(Object.keys(SOURCES).length).toBeGreaterThan(500);
  });

  it('has no French left in any source file', () => {
    const offenders: string[] = [];
    for (const [path, source] of Object.entries(SOURCES)) {
      if (path.endsWith('one-language.test.ts')) continue;
      frenchIn(source).forEach((hit) => offenders.push(`${path} ${hit}`));
    }
    expect(offenders).toEqual([]);
  });

  it('catches French when it is reintroduced', () => {
    /**
     * Without this, a typo in the vocabulary or the regex would leave a
     * permanently green test, which reads as evidence and is worse than
     * no test at all.
     */
    expect(frenchIn('<p>Ajoutez le jeton operateur, puis actualisez.</p>')).toHaveLength(1);
    expect(frenchIn("  <Button>Confirmer le remboursement</Button>")).toHaveLength(1);
  });

  it('does not fire on English, on code, or on comments', () => {
    expect(frenchIn('<p>Add the Stylemint operator token, then refresh.</p>')).toEqual([]);
    expect(frenchIn('const onesWithRole = rows.filter((row) => row.role === 3);')).toEqual([]);
    expect(frenchIn('// Ajoutez le jeton operateur Stylemint, puis actualisez.')).toEqual([]);
    expect(frenchIn('/* Confirmer le remboursement */')).toEqual([]);
  });
});
