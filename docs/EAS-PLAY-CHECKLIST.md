# EAS build and Google Play closed test checklist

Goal: a build on your phone, then a production build in the Play closed test, so the 14-day clock starts.

## A. Play Console (start first, verification can take days)
- [ ] Create a Google Play developer account (one-time registration fee) and finish identity verification
- [ ] Create the app: name UniSurvival, default language, free, app (not game)
- [ ] Note: a new personal account needs a closed test with at least 12 testers opted in for 14 continuous days before applying for production

## B. Things Play needs before you can roll out
- [ ] Privacy policy at a public URL (ask Claude to draft it; host on a free page)
- [ ] Data safety form (collects: email, name, financial info such as spending; data encrypted in transit; deletion on request)
- [ ] Content rating questionnaire
- [ ] Target audience (do not target children)
- [ ] Store listing: short description, full description, 512x512 icon, 1024x500 feature graphic, at least 2 phone screenshots

## C. EAS setup (PowerShell, project root)
1. `npm install -g eas-cli`
2. `eas login`
3. `eas build:configure` (creates eas.json)
4. In eas.json, make sure you have a `preview` profile that builds an APK for installing directly, and a `production` profile that builds an AAB (the default for Android):
```json
{
  "build": {
    "preview": { "distribution": "internal", "android": { "buildType": "apk" } },
    "production": { "autoIncrement": true }
  }
}
```
5. Copy your Supabase variables into EAS (names must match what src/lib/supabase.ts reads; run `eas env:create --help` for the exact flags on your CLI version). `.env` is not uploaded.
6. `eas build -p android --profile preview` then install the APK on your phone
7. Test: sign in, log an expense, Home updates, Debts add/settle, Profile edit, dark toggle
8. Fix what breaks, then `eas build -p android --profile production`

## D. Upload and start the clock
- [ ] The first upload must be done by hand: download the AAB from EAS and upload it in Play Console under Testing, Closed testing
- [ ] Add testers by email list (their Gmail addresses) or a Google Group, and share the opt-in link
- [ ] Confirm at least 12 testers have opted in. Aim for about 20 for a buffer
- [ ] Do not pause the closed track while the 14 days run. New builds mid-test are fine.

## E. During the 14 days
- [ ] Ship updates through the same closed track
- [ ] Ask testers to open the app on several days and log real expenses
- [ ] On day 14, apply for production access in Play Console

## Gotchas
- Expo Go does not show your icon or splash. They appear only in a real build.
- EAS cannot read `.env`. A build without Supabase variables installs and then has no backend.
- Keep the same Google account for Play Console and your tester list owner.
