# Clarity

**An AI-powered accessibility tool that transforms any text into a dyslexia-friendly format — instantly.**

Clarity was built at Hack4Humanity to dismantle the "design wall" that makes reading exhausting for the 780 million people worldwide living with dyslexia. Instead of reading for the user, Clarity re-engineers information to match how their brain naturally processes the world.

---

## What It Does

Point your camera at any text — a textbook page, a restaurant menu, a street sign, a worksheet — and Clarity will:

1. **Extract the text** using OCR
2. **Restructure it** into a simplified, dyslexia-friendly format using AI
3. **Read it aloud** with high-quality text-to-speech synthesis using ElevenLabs' voices
4. **Display it** in the OpenDyslexic font with generous spacing and a calm layout

Users can also upload photos from their camera roll for the same transformation pipeline.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile Frontend | React Native (Expo 54) |
| Authentication & Database | Supabase (with Row Level Security) |
| OCR | OCR.space API |
| AI Simplification | Google Gemini 1.5 Flash |
| Text-to-Speech | ElevenLabs API |
| Typography | OpenDyslexic font |

---

## Getting Started

### Prerequisites

- Node.js (v18 or v20 recommended — **not v24**)
- Expo CLI
- A physical iOS or Android device, or a simulator

### Installation

```bash
git clone https://github.com/s444hi/CLARITY_H4H.git
cd CLARITY_H4H
npm install
```

### Environment Setup

Create a `.env` file (or configure your constants in `src/constants/`) with the following API keys:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_OCR=your_ocr_space_key
EXPO_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

### Running the App

```bash
npx expo start
```

Scan the QR code with the Expo Go app on your device, or press `i` for iOS simulator / `a` for Android emulator. (Make sure to press `s` to use Expo Go instead of Builder Mode)

---

## Key Engineering Decisions

**Expo 54 over 55** — We pinned to Expo 54 to maintain library stability across our AI integrations. Expo 55 introduced breaking changes with several dependencies we relied on.

**Node.js version pinning** — Node 24 caused incompatibilities with our build toolchain. We standardized on Node 18/20 for a stable development environment.

**LLM for augmentation, not automation** — Gemini restructures and simplifies text without replacing the user's reading experience. The goal is to reduce friction, not to read for them.

**OpenDyslexic typography** — Loaded at runtime from a CDN so the app renders in a font specifically designed to reduce letter-confusion patterns common in dyslexia.

---

## What's Next

- **AR Overlay** — Real-time augmented reality that projects dyslexia-friendly text directly over physical book pages
- **Collaborative Study Materials** — A secure platform for students to share "Clarified" documents
- **Multi-language Support** — Expanding Plain Language models to support non-English speakers facing the same structural barriers

---

## The Team

Built by a team of freshman, Saahithya, Neha, and Anannya, with care at Hack4Humanity, our first ever hackathon. 

---

## License

This project is open source. See [LICENSE](LICENSE) for details.
