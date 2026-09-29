# UniSurvival

**Make it last.**

A mobile app that helps South African university students stretch
and survive with basics with a monthly allowance. Built solo as an Android-first project.

## The problem

[59% of students run out of money before month end. Add your survey
size and one line on what you found.]

## What it does

- Log expenses with a custom numpad and categories
- Daily budget calculated from allowance, spending and days left
- Track who owes you and who you owe
- Plan meals and manage a food budget
- Email one-time-code sign in (no passwords)

## Screenshots

![Home](docs/screenshots/home.png)
![Log](docs/screenshots/log.png)
![Debts](docs/screenshots/debts.png)

## Tech stack

- React Native with Expo and Expo Router
- TypeScript
- Supabase (PostgreSQL, Auth, row-level security)
- Resend for email delivery

## How it's built

- 8 database tables, each protected by row-level security so users
  only ever see their own rows
- Session gate that routes returning users straight to the app
- Light and dark theme through a shared theme context
- Dev mode with mock data when no user is signed in

## Run it locally

1. Clone the repo and run `npm install`
2. Create your own Supabase project
3. Copy `.env.example` to `.env` and add your own keys
4. Run `npx expo start` and open it in Expo Go

## Status

In development. Next up: AI spending insights, PayFast
subscriptions, beta testing, Play Store launch.

## Author

Kuhle Njongo, BCom Information Systems & Finance, Wits