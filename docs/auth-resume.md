# Auth resume (OTP email)

Parked for connectivity. Use this checklist when resuming Phase 4 auth.

## Prerequisites

1. Supabase project has Email OTP enabled (Authentication > Providers > Email).
2. `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set in `.env`.
3. Redirect / deep link config in `app.json` matches your Expo scheme if using magic links later. Current flow uses 6-digit OTP on [`src/app/onboarding/verify.tsx`](../src/app/onboarding/verify.tsx).

## Test path

1. Clear app storage / sign out.
2. Splash > Problem > Sign up with a real email you can open.
3. Enter the 6-digit code from the email.
4. Complete Setup (allowance + payday).
5. Confirm Home loads the signed-in profile (not Sipho mock).

## Dev mock

- Mock signed-out data only when `EXPO_PUBLIC_DEV_MOCK=1`.
- Without that flag, signed-out users are redirected to onboarding.

## Common failures

- OTP never arrives: check Supabase Auth email rate limits and spam.
- Profile insert fails on verify: user may already exist; treat as continue-to-setup.
- Session lost after reload: confirm AsyncStorage auth storage on native (`src/lib/supabase.ts`).
