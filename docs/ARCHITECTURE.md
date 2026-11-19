# UniSurvival architecture

Last updated 18 Nov 2026. Update this file when something here stops being true.

## What the app is
South African student money and life app. Tagline: "Make it last." Built solo by Kuhle Njongo. Android first (Play Store), iOS deferred to v1.5.

## Stack
- Expo SDK 58, React Native, TypeScript, Expo Router (file-based routing)
- Supabase: Postgres with row-level security, email OTP auth (6-digit code, custom SMTP via Resend)
- Roboto font (300, 400, 500, 700), Ionicons
- No payments yet (PayFast planned), no AI yet (Supabase Edge Functions planned)

## Folder map
```
src/
  app/
    _layout.tsx          Root layout: loads fonts, wraps everything in ThemeProvider
    index.tsx            Session gate: session exists -> /(tabs), otherwise /onboarding/splash
    (tabs)/
      _layout.tsx        Tab bar (pill active state, solid icons, plain Pressable)
      index.tsx          Home: balance, daily budget, category spend, recent transactions
      log.tsx            Log Expense: numpad, categories, note, saves to transactions
      debts.tsx          Debts: I owe / owed to me, add and settle
      grocery.tsx        Grocery: food budget, today's meals, shopping list and pantry cards
      profile.tsx        Profile: user, edit allowance/payday modal, dark mode toggle, sign out
    onboarding/
      splash.tsx  problem.tsx  signup.tsx  verify.tsx  setup.tsx
  lib/supabase.ts        Supabase client (AsyncStorage session persistence)
  theme/
    colors.ts            lightColors and darkColors token sets, ThemeColors type
    ThemeContext.tsx     ThemeProvider, useTheme(), toggle persisted in AsyncStorage
    useTheme.ts          Re-export of useTheme
```

## Theme pattern
Every screen does `const { colors } = useTheme()` and builds styles with `createStyles(colors)` inside `useMemo`. Colors live only in src/theme/colors.ts. Default mode is light. Dark "Obsidian" is selectable in Profile.

## Database (Supabase, RLS on every table)
- profiles: id (= auth user id), name, phone, allowance, payday, created_at
- transactions: id, user_id, amount, category, note, type, date, created_at
- debts: id, user_id, name, amount, direction (i_owe | owed_to_me), detail, settled, created_at
- budgets: id, user_id, month, year, allowance, spent, created_at
- pantry: id, user_id, name, quantity, unit, days_remaining, created_at
- meal_plans: id, user_id, date, slot, meal_name, ingredients, created_at
- shopping_list: id, user_id, name, estimated_price, purchased, created_at
- food_budget: id, user_id, month, year, budget, spent, created_at

Extend `pantry` rather than creating a second pantry table.

## Auth flow
Splash -> Problem -> Signup (name + email, sends OTP) -> Verify (6 digits) -> Setup (allowance + payday) -> tabs. Returning users hit the session gate and skip onboarding. "I already have an account" currently reuses the signup screen; a proper sign-in screen is a later task.

## Dev mode
With no logged-in user, every screen shows mock data (Sipho, R1,500). This is intentional. Do not remove it.

## Environment
- Supabase URL and anon key live in `.env` (gitignored, never commit). Check src/lib/supabase.ts for the exact variable names.
- EAS builds cannot see `.env`. The same variables must be created in EAS environment variables before building.

## Done
- Light and dark themes with Profile toggle, tab bar pill, border cards and 8-pt spacing (Cursor pass)
- Editable allowance and payday (Profile modal)
- Gear icon removed, "I already have an account" wired up
- Brand assets: icon.png, android-icon-foreground.png, android-icon-monochrome.png, splash-icon.png, logo-mark.png

## Open (from the 18 Nov audit)
- Profile: Budget and Preferences rows need card surfaces; settings gear may still be present
- Debts: line ~234 still uses colors.danger (red). Replace with colors.deep or grey
- setup.tsx: budgets insert ignores errors; NaN not validated
- package.json: @react-navigation/elements is unused, remove
- Unused Expo template files: src/constants/theme.ts, src/components/themed-text.tsx, animated-icon.tsx and its css module
- Dead ends: Notifications and Categories rows, Shopping List and Pantry cards, Scan receipt

## Planned features (in order)
1. Grocery shopping calculator: running total per item, balance left after each add, saves one Food expense on done
2. Commitments (subscriptions and debit orders) in a separate section on the Debts tab, subtracted from Home "safe to spend" before the next payday. Do not add them to the debts total.
3. Shopping List and Pantry screens, with a "Used" tap that logs usage events (powers most/least used)
4. Receipt scan v1: on-device OCR, then a Supabase Edge Function that parses text into JSON, then a review screen before saving. Total, store and date prefill Log Expense.
5. Money Tasks, then Money Calendar over the same table
6. AI spending insights (code computes the numbers, the model writes the sentences), Pro only
7. PayFast and Free/Pro

## Rules for the AI features
- Keys live only in Supabase Edge Function secrets
- Receipt scans always go through a review screen
- Send text, not images, where possible, and strip card digits
- Provider must be swappable behind one function
