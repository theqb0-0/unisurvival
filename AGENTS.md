# UniSurvival agent rules

Student money and life app for South Africa. Expo SDK 58, React Native, TypeScript, Expo Router, Supabase. Android first. Read docs/ARCHITECTURE.md for how things fit together.

## Code rules
- Screens: `const { colors } = useTheme(); const styles = useMemo(() => createStyles(colors), [colors]);`. Never hardcode hex in screens. Add new tokens to src/theme/colors.ts for both light and dark.
- Never import from `@react-navigation/*`. Use `expo-router` and `react-native`.
- Always handle the Supabase `{ error }` and show it to the user. No silent failures.
- Signed-out mock data (Sipho, R1,500) is intentional dev mode. Keep it.
- Money values are rand. Show as `R` plus a whole number unless cents matter.
- No API keys in app code. AI calls go through Supabase Edge Functions. Never put a service_role key in the app.
- Never commit `.env`.

## Design rules
- Default theme is LIGHT. Dark "Obsidian" (canvas #041202, card #0A1C08) is available through the Profile toggle.
- Cards use a 1px low-opacity border, no shadows. Radius 12 or 16. 8-pt spacing grid.
- Green is #76B900 for accents and positive money. Never use red for debts.
- Font is Roboto 300, 400, 500, 700 only.
- No em dashes in app copy. Voice is aspirational and direct, not remedial.
- Match the button and card style of the existing screens.

## Working rules
- One feature per task. Touch only the files named.
- After editing, run `npx tsc --noEmit` and report the errors. Do not run `expo start`.
- Ask before adding a new dependency.
- Do not redo things already marked done in docs/ARCHITECTURE.md.
- When a task is finished, update the Done and Open lists in docs/ARCHITECTURE.md (and the folder map or tables if they changed). Keep each change to one line.
