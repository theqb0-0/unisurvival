/**
 * When true and there is no Supabase session, screens may show mock data.
 * Set EXPO_PUBLIC_DEV_MOCK=1 in .env for local UI work without signing in.
 * Default is false: signed-out users are sent to onboarding.
 */
export const DEV_MOCK =
  process.env.EXPO_PUBLIC_DEV_MOCK === '1' ||
  process.env.EXPO_PUBLIC_DEV_MOCK === 'true';
