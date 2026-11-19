# Receipt scan v1 spec

Goal: photo of a till slip becomes a pre-filled expense the user confirms in one tap. Code does the reading and the math. The AI only tidies messy text into fields.

## Flow
1. User taps "Scan receipt" (Log Expense and Home).
2. Camera or gallery picker returns one image.
3. On-device OCR turns the image into plain text. The image never leaves the phone.
4. Local parser tries to find store, date and total with regex. If it finds all three with good confidence, skip to step 6.
5. Otherwise send the text (not the image) to the Edge Function `parse-receipt`, which returns structured JSON.
6. Review screen shows store, date, total, category and line items, all editable.
7. Save writes one row to `transactions`. Discard throws everything away. Nothing is stored from the scan except that row.

## On-device OCR
- Use an ML Kit based text recognition package for Expo. Pick the currently maintained one, and ask before adding the dependency (AGENTS.md rule).
- This does NOT run in Expo Go. It needs a development build: `eas build -p android --profile development`, install the APK, then run `npx expo start --dev-client`. Plan for this, it changes the dev loop.
- Downscale the image before OCR (about 1600px on the long edge). Delete the temp image file after OCR finishes.
- If OCR returns almost no text, show: "Couldn't read that one. Try better light, or enter it by hand." with a button to Log Expense.

## Local parser (no AI, no cost)
South African slips: look for lines containing TOTAL, BALANCE DUE, AMOUNT DUE, CASH, CARD. Prefer TOTAL over CASH or CARD (those can include change). Amounts may use a comma or dot decimal ("R 123,45" or "123.45"). Dates are usually dd/mm/yyyy, dd-mm-yyyy or yyyy/mm/dd. Store is usually the first non-empty line or matches a known chain (Checkers, Shoprite, Pick n Pay, Woolworths, Spar, Boxer, Clicks, Dis-Chem, Mr Price, Pep).
Return `{ store, date, total, confidence }`. Confidence is high only if all three are found and total is a plausible amount (more than R0 and under R50 000).

## Category suggestion (code, not AI)
Map store keywords to a category: grocery chains to Food, Clicks and Dis-Chem to Health, fuel brands to Transport, and so on. Default to the user's last used category. The user can always change it.

## Edge Function: `parse-receipt`
Path: `supabase/functions/parse-receipt/index.ts`
- Require a valid user JWT. Reject anonymous calls.
- Input: `{ text: string }`. Reject over 4000 characters.
- Before anything leaves the function's inputs: strip any run of 13 to 19 digits (card numbers), and anything that looks like an email or phone number.
- Daily cap per user (start at 15 scans a day, 5 for free users later). Track in table `ai_usage(user_id, day, count)`. Over the cap returns a clear error the app shows as a friendly message.
- Provider call lives in ONE function `callModel(prompt)` so the provider can be swapped. API key is stored with `supabase secrets set`, never in the app.
- Provider requirement: a paid API tier whose terms say inputs are not used for training. Free consumer tiers may train on inputs, which is a POPIA problem. Receipts are cheap, a few cents per hundred scans.
- Ask for strict JSON only: `{ store, date (YYYY-MM-DD), total, currency: "ZAR", items: [{ name, qty, price }] }`. Validate the reply with a schema. If it fails validation, return an error, do not guess.
- Sanity check in code: if items exist and their sum differs from total by more than 5 percent, set `needsReview: true`. The review screen highlights the total.
- Return the JSON. Do not log the receipt text.

## Review screen
- Fields: store, date, total (large), category chips, items (collapsed by default).
- Primary button "Save expense". Secondary "Discard".
- If `needsReview`, show a small note: "Check the total, the slip was hard to read."
- Save inserts into `transactions` with note = store. Home and budgets update as normal. Use the snackbar for errors.

## Privacy and copy
- The privacy policy must say: receipt text is processed by an AI provider to read it, images stay on the phone, receipt text is not stored.
- Add one line on the scan screen: "Your photo stays on your phone."

## Build order (one Cursor task each, commit between)
1. Migration for `ai_usage` plus RLS. Contents pasted into Supabase, not the path.
2. Edge Function `parse-receipt`, deployed with `supabase functions deploy parse-receipt`. Test with a sample slip text before touching the app.
3. Local parser and category mapper in `src/lib/receipt.ts` with a few unit-style sample checks.
4. Scan screen with camera, OCR and the flow above (needs the development build).
5. Review screen and save.

## Done when
- A real Checkers or Shoprite slip becomes a saved expense in under 15 seconds.
- Airplane mode shows a friendly manual-entry fallback.
- Over the daily cap shows a friendly message, not an error dump.
- No card digits are ever sent to the provider. Test with a slip that has a masked card line.
