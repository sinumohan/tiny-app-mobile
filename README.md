# TinyExperiments Mobile

React Native + Expo mobile app for [tinyexperiments.me](https://tinyexperiments.me) — a Structured Founder Validation Platform.

## What is this?

TinyExperiments helps founders validate startup ideas through a two-phase pipeline:

- **Phase 1 — AI Desk Analysis**: 5-layer structured analysis → Theoretical Viability Score (TVS /100)
- **Phase 2 — Tiny Brand Experiment**: Real disposable brand + landing page + campaign → Market Signal Score (MSS /100)
- **CCS = (TVS × 0.35) + (MSS × 0.65)** — Combined Confidence Score

Each idea produces a **Validation Dossier**: a persistent, versioned, shareable artefact.

## Setup

```bash
npm install
cp .env.example .env.local
# Fill in your Supabase credentials
npx expo start
```

## Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Running

```bash
# Start Expo dev server
npx expo start

# iOS simulator
npx expo start --ios

# Android emulator
npx expo start --android
```

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo SDK 55 |
| Navigation | Expo Router (file-based, like Next.js App Router) |
| Backend/Auth | Supabase |
| Session storage | expo-secure-store |
| Fonts | @expo-google-fonts/kalam (Kalam handwritten font) |
| Language | TypeScript |

## App Structure

```
app/
├── _layout.tsx              # Root layout — font loading + auth redirect
├── (auth)/
│   ├── sign-in.tsx          # Sign in screen
│   └── sign-up.tsx          # Sign up screen
├── (app)/
│   ├── _layout.tsx          # Bottom tab navigator
│   ├── index.tsx            # Dossiers list (home)
│   ├── new.tsx              # 6-step intake form
│   ├── dossier/[id].tsx     # Dossier detail + scores
│   ├── phase1/[id].tsx      # Phase 1 AI analysis
│   ├── phase2/[id].tsx      # Phase 2 experiment wizard
│   └── profile.tsx          # Profile + plan
src/
├── lib/
│   ├── supabase.ts          # Supabase client + types
│   ├── colors.ts            # Design system colours
│   └── typography.ts        # Font definitions
├── hooks/
│   ├── useAuth.ts
│   └── useDossiers.ts
└── components/ui/
    ├── SketchPaper.tsx      # Paper card surface
    ├── SketchButton.tsx     # Button (primary/secondary/ghost)
    ├── SketchField.tsx      # Text input with Kalam label
    ├── ScoreRing.tsx        # Circular score display
    ├── AssumptionCard.tsx   # Assumption stack item
    ├── PhaseProgress.tsx    # Phase 1→2→Dossier progress
    └── SectionHeader.tsx    # Section heading with teal underline
```

## Design System

Notebook / scientific sketchbook aesthetic:

- **Background**: `#FCF6E8` warm beige (paper)
- **Primary accent**: `#14645A` teal (scientific rigour)
- **CTA**: `#F4C44E` yellow
- **Risk**: `#C83C32` red
- **Font**: Kalam (handwritten) for headings, system font for body
- **Ruled lines**: `#7EA7D4` blue horizontal rules
- **Margin line**: `#D65A4E` red left border on key cards
