/**
 * Which product this build is the console for.
 *
 * One codebase, two outputs. `lead360` is the original chatbot CRM console and
 * stays the default, so an existing build is byte-for-byte unaffected by this
 * flag existing. `stylemint` is the commerce operator console: it drops the
 * chatbot marketing landing page, hides the bot/CRM navigation, and wears
 * StyleMint's own identity rather than Lead360's.
 *
 * A build flag rather than a runtime role check, deliberately: the auth model
 * has only Owner/Admin/Agent/Manager and carries no signal for which product an
 * operator belongs to, so there is nothing to branch on at runtime today.
 * Adding one would mean changing Identity. If a single person ever needs both
 * products in one session, that is the moment to pay for it — until then this
 * keeps the two apart without touching auth.
 */
export type ConsoleProduct = 'lead360' | 'stylemint';

const product = (import.meta.env.VITE_CONSOLE_PRODUCT as string | undefined) ??
  'lead360';

export const env = {
  /** Never widen this without updating `isStyleMintConsole` below. */
  consoleProduct: (product === 'stylemint' ? 'stylemint' : 'lead360') as ConsoleProduct,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL as string,
  wsUrl: import.meta.env.VITE_WS_URL as string,
  enableMsw: import.meta.env.VITE_ENABLE_MSW === 'true',
  sentryDsn: import.meta.env.VITE_SENTRY_DSN as string | undefined,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const;

/**
 * True in the StyleMint commerce console build.
 *
 * Read this rather than comparing `env.consoleProduct` at call sites, so the
 * whole app asks the question one way and a third product later has one place
 * to change.
 */
export const isStyleMintConsole = env.consoleProduct === 'stylemint';
