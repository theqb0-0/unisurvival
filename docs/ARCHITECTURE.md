# UniSurvival architecture

Last updated 19 Nov 2026 (evening). Update this file when something here stops being true.

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
    _layout.tsx            Root layout: fonts, ThemeProvider, stack routes for tabs + tasks + calendar + grocery
    index.tsx              Session gate: session -> /(tabs), else /onboarding/splash
    tasks/index.tsx        Money tasks: list, add, tick done (open / done)
    calendar/index.tsx     Money calendar: month grid fed by money_tasks
    grocery/
      shopping.tsx         Full shopping list from shopping_list
      pantry.tsx           Full pantry from pantry
    (tabs)/
      _layout.tsx          Tab bar: outline vs filled icons, green active, Pressable, canvas background
      index.tsx            Home: balance, daily budget, money tasks preview, categories, recent txs
      log.tsx              Log Expense: numpad, categories, note -> transactions
      debts.tsx            Debts: I owe / owed to me, add and settle
      grocery.tsx          Food budget, meals, cards to shopping/pantry, receipt stub
      profile.tsx          User, budget card + edit modal, preferences, dark toggle, sign out
    onboarding/
      splash.tsx  problem.tsx  signup.tsx  signin.tsx  verify.tsx  setup.tsx
  components/
    otp-input.tsx          OTP: hidden TextInput + 6 boxes
    snackbar.tsx           Micro-toast (Profile, Grocery, tasks/calendar; not app-wide yet)
  lib/
    supabase.ts            Supabase client (AsyncStorage session persistence)
    auth-helpers.ts        Email validation, auth error mapping, profileNeedsSetup
    dev.ts                 DEV_MOCK flag (EXPO_PUBLIC_DEV_MOCK)
    money-tasks.ts         Types, mocks, formatDueLabel
  theme/
    colors.ts              lightColors + charcoal darkColors, ThemeColors type
    ThemeContext.tsx       ThemeProvider, useTheme(), toggle in AsyncStorage
    useTheme.ts            Re-export
supabase/migrations/
  20261110_money_tasks.sql money_tasks table + RLS (apply in Supabase if missing)
  20261119_shopping_pantry_rls.sql shopping_list + pantry RLS policies (apply if missing)
docs/
  auth-resume.md           OTP test checklist when connectivity allows
  EAS-PLAY-CHECKLIST.md
```

## Theme pattern
Screens use `const { colors } = useTheme()` and `useMemo(() => createStyles(colors), [colors])`. Hex values live only in `src/theme/colors.ts`. **Default mode is light.** Dark mode is **charcoal** (`#121214` canvas), toggled in Profile and persisted. (Obsidian dark was tried and rolled back.)

## Database (Supabase, RLS on every table)
- profiles: id (= auth user id), name, phone, allowance, payday, created_at
- transactions: id, user_id, amount, category, note, type, date, created_at
- debts: id, user_id, name, amount, direction (i_owe | owed_to_me), detail, settled, created_at
- budgets: id, user_id, month, year, allowance, spent, created_at
- money_tasks: id, user_id, title, amount, due_date, type (pay | save | plan), status (open | done), note, timestamps
- pantry: id, user_id, name, quantity, unit, days_remaining, created_at
- meal_plans: id, user_id, date, slot, meal_name, ingredients, created_at
- shopping_list: id, user_id, name, estimated_price, purchased, created_at
- food_budget: id, user_id, month, year, budget, spent, created_at

Extend `pantry` rather than creating a second pantry table.

## Auth flow
New: Splash -> Problem -> Signup (name + email, OTP) -> Verify -> Setup only if allowance/payday unset -> tabs. Returning: Splash "I already have an account" -> **signin** (email, `shouldCreateUser: false`) -> Verify -> tabs if profile complete else Setup. Verify creates a profile row only on first signup (name param), never overwrites. OTP UI: `src/components/otp-input.tsx` (single hidden input + 6 boxes, auto-submit at 6 digits).

## Dev mode
- **Production path:** no session -> redirect to onboarding (no mock data).
- **UI dev path:** set `EXPO_PUBLIC_DEV_MOCK=1` to use Sipho-style mocks on tabs, tasks, grocery, etc. See `src/lib/dev.ts` and `docs/auth-resume.md`.

## Environment
- Supabase URL and anon key in `.env` (gitignored). See `src/lib/supabase.ts` for variable names.
- EAS builds need the same variables in EAS environment settings.

## Done
- Five tab screens + full onboarding flow
- Supabase wiring for profiles, transactions, debts, budgets; Home, Log, Debts, Grocery, Profile use real data when signed in
- Light default + charcoal dark toggle; tab bar outline/filled icons, green active state, canvas-matched bar
- Home: deep daily-budget card, bordered txn cards, money tasks preview, link to calendar
- Money tasks screen (`/tasks`): create, list open/done, toggle status
- Money calendar (`/calendar`): month view over same `money_tasks` rows
- Grocery Shopping List and Pantry screens: add, bought/strike, delete; pantry Used/delete; food budget on shopping
- Profile: Budget and Preferences in `sectionCard`; settings gear removed; edit allowance/payday modal
- Debts UI without red (`colors.danger` removed from debts tab)
- Setup: budgets insert errors surfaced; Problem CTA aspirational copy
- Session gate + optional `DEV_MOCK` instead of always-on mock data
- Snackbar component on several screens (partial adoption)
- Dedicated sign-in screen (`/onboarding/signin`), OTP UX rebuilt, verify routes by profile setup state
- Expo starter template UI removed (`app-tabs`, `themed-*`, `animated-icon`, `constants/theme`, old `hooks/use-theme`); `npx tsc --noEmit` clean
- SQL migration file for `money_tasks` in repo
- `docs/auth-resume.md` for resuming OTP tests

## Open
- **Auth:** OTP email end-to-end verification on device (see `docs/auth-resume.md`; UX ready, confirm on device)
- **Supabase:** Apply `money_tasks` and `shopping_pantry_rls` migrations on the live project if not already run
- **Dead ends / stubs:** Receipt scan (toast only), Notifications and Categories rows labeled "Soon" (no push system yet)
- **setup.tsx:** signed-out path redirects to signin; budget duplicate insert on returning setup not yet upserted
- **Snackbar:** Replace remaining `Alert.alert` usage app-wide (Log, setup, verify, debts modals, etc.)
- **Brand assets:** Referenced in `app.json` under `assets/images/` (icon, splash, adaptive icons); confirm files exist locally and in CI/EAS context

## Planned features (in order)
1. Grocery shopping calculator: running total per item, balance left after each add, saves one Food expense on done
2. Commitments (subscriptions and debit orders) on Debts tab, subtracted from Home "safe to spend" before payday. Not included in debts net total.
3. Pantry usage history / most-used analytics (Used already decrements quantity on Pantry screen)
4. Receipt scan v1: on-device OCR -> Edge Function -> review screen -> Log Expense prefill
5. AI spending insights (code computes numbers, model writes copy), Pro only
6. PayFast and Free/Pro tiers

(Money Tasks and Money Calendar are **shipped** in v1 UI; iterate on UX and calendar interactions rather than greenfield build.)

## Rules for AI features
- Keys only in Supabase Edge Function secrets
- Receipt scans always through a review screen
- Send text, not images, where possible; strip card digits
- Swappable provider behind one function