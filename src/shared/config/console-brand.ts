import { isStyleMintConsole } from './env';

/**
 * The words the signed-out operator reads on the way in.
 *
 * One codebase ships two consoles (see `env.ts`), and the difference an
 * operator actually notices is the wording: what the product is called, what it
 * claims to do, and whether the screen is selling them something. Lead360's
 * auth screens are a SaaS front door — a looping chatbot demo, channel counts,
 * "50+ teams already building". A StyleMint operator did not sign up for
 * anything; someone gave them the console because they run a shop's orders.
 *
 * Keeping the strings here rather than inline in each page means the two builds
 * cannot drift apart a phrase at a time: every screen reads the same record, so
 * adding a third console is one object, not a hunt through JSX.
 *
 * Only operator-visible copy belongs in here. Storage keys, API paths and type
 * names stay exactly as they are — an operator never sees `omniflow_token`, and
 * renaming it would sign everyone out.
 */
export interface ConsoleBrand {
  /** What the operator calls the product. */
  name: string;
  /** The line under the name in the auth header — what the console is for. */
  tagline: string;
  /**
   * The wordmark shown beside the name, or `null` when this console has no mark
   * of its own yet and should show the name alone. Never point a build at
   * another product's logo: a StyleMint operator seeing the Lead360 mark is the
   * same bug as reading the Lead360 name.
   */
  logoSrc: string | null;
  /** Alt text for `logoSrc`. Unused when there is no mark. */
  logoAlt: string;
  signIn: { heading: string; subheading: string };
  register: { heading: string; subheading: string };
  /** The footer on the sign-in page that points at registration. */
  noAccount: { prompt: string; action: string };
  /**
   * Whether the auth screens show the chatbot product demo and the growth
   * numbers beside the form. False for a console an operator was handed rather
   * than bought.
   */
  showsProductMarketing: boolean;
}

const lead360: ConsoleBrand = {
  name: 'Lead360',
  tagline: 'CRM & automation',
  logoSrc: '/Lead360logo/1.png',
  logoAlt: 'Lead360',
  signIn: { heading: 'Welcome back', subheading: 'Sign in to your workspace' },
  register: {
    heading: 'Create your account',
    subheading: 'Create your account to get started',
  },
  noAccount: { prompt: 'No account?', action: 'Create one free' },
  showsProductMarketing: true,
};

const stylemint: ConsoleBrand = {
  name: 'StyleMint',
  tagline: 'Commerce operations',
  // ── STYLEMINT WORDMARK GOES HERE ──────────────────────────────────────────
  // Deliberately null: there is no StyleMint mark in `public/` and inventing
  // one is a design decision, not a code one. Until design supplies a file,
  // the auth header shows the name set in type, which is honest. To finish it,
  // drop the asset in `public/brand/stylemint/` and set this to its path (and
  // see `consoleHtmlPlugin` in `vite.config.ts` for the browser-tab icon).
  logoSrc: null,
  logoAlt: 'StyleMint',
  signIn: {
    heading: 'Sign in',
    // An operator recognises the shop they run, not a "workspace".
    subheading: 'StyleMint commerce operations',
  },
  register: {
    heading: 'Create your operator account',
    subheading: 'Set up the sign-in you will use for the StyleMint console.',
  },
  noAccount: { prompt: 'No sign-in yet?', action: 'Create an operator account' },
  showsProductMarketing: false,
};

export const consoleBrand: ConsoleBrand = isStyleMintConsole ? stylemint : lead360;
