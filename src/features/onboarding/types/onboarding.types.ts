export interface OnboardingProgress {
  currentStep: number;
  completedSteps: number[];
  startedAt: string;
  lastVisitedAt: string;
}

export const ONBOARDING_STEPS = [
  { number: 1, title: 'Connect API', description: 'Upload your OpenAPI spec', icon: '🔌' },
  { number: 2, title: 'Define Intents', description: 'Set up what your bot understands', icon: '🧠' },
  { number: 3, title: 'Sync Catalog', description: 'Connect your product catalog', icon: '📦' },
  { number: 4, title: 'Design Flows', description: 'Build conversation flows with AI', icon: '✨' },
  { number: 5, title: 'Connect Channels', description: 'Link WhatsApp, Telegram, SMS', icon: '📱' },
  { number: 6, title: 'Go Live', description: 'Review checklist and activate', icon: '🚀' },
] as const;
