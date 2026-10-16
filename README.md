# 🔥 WordStreak

**WordStreak** is a private, full-stack vocabulary learning platform designed specifically for two friends — **Vinuu** and **Bhuu** — who build their English vocabulary together through a shared daily challenge.

---

## ✨ Key Features

1. **Dual Personalized Login Experiences**:
   - Dedicated sign-in for **Vinuu** (violet / purple gradient theme `💜`).
   - Dedicated sign-in for **Bhuu** (amber / orange gradient theme `🧡`).
   - Shared account selector at `/login`.

2. **Unified Command Dashboard (`/dashboard`)**:
   - **Central Streak Display**: Dynamic glowing flame visual, 7-day completion calendar dots, all-time record streak, and total unique words learned.
   - **Side-by-Side Dual User Progress**: Real-time status for both Vinuu and Bhuu:
     - Daily words reviewed (`X / 10`) with animated progress bar
     - Quiz accuracy and score breakdown
     - Lock-In status (Locked In 🔒 / In Progress ⏳ / Not Started)
     - XP & Level badges
   - **Today's 10 Words Hub**: Preview today's batch, pronounce words with Web Speech API audio, and review status.
   - **Interactive Analytics**: Visual charts for vocabulary growth over time, mutual quiz accuracy comparison, and streak momentum.
   - **Unlocked Badges Showcase**: Live display of recently unlocked achievements.

3. **10-Word Daily Submission with Global Duplicate Prevention (`/submit`)**:
   - Real-time client and server validation as you type.
   - Live badge indicator:
     - ✅ **Unique**: Available to register.
     - ❌ **Duplicate**: Clear alert indicating who submitted it and on what date.
     - ⚠️ **Intra-batch duplicate**: Alerts if repeated within the same 10-word list.
   - **Quick Fill Sample Words**: One-click button to populate 10 curated high-yield vocabulary words for rapid testing or study.
   - Auto-publish directly to today's learning deck.

4. **Interactive 3D Flip Card Learning (`/learn`)**:
   - 3D card flip animation on click or by pressing <kbd>Space</kbd>.
   - Card Front: Target word, phonetic pronunciation guide, audio pronunciation speaker button, part of speech pill, and difficulty badge.
   - Card Back: Clear definition, contextual example sentence with the word in action, and "Save to Vault" button.
   - Keyboard navigation (<kbd>←</kbd> and <kbd>→</kbd> arrows).
   - "Word 4 of 10" progress tracker with quick-jump pills.
   - Automated review tracking: Unlocks the **Lock-In Today** button once all 10 words are studied.
   - **AI Context Story Generator**: Generates an adventure story featuring all 10 daily words using Google Gemini / OpenAI (with a built-in rich offline fallback).

5. **Dynamic Vocabulary Quiz (`/quiz`)**:
   - Automatically generated from today's 10 words.
   - Varied question types:
     - *Meaning to Word* (Which word means...)
     - *Word to Meaning* (What is the definition of...)
     - *Sentence Fill-in-the-Blank* (Complete the sentence: "The morning mist was _________...")
     - *Part of Speech Recognition*
   - Immediate answer grading, celebratory confetti, XP earnings, and full question explanations.

6. **Spaced-Repetition Word Vault (`/vault`)**:
   - Private personal vocabulary bank for each user.
   - Search across saved words and definitions in real-time.
   - Filter by mastery level (Level 0 New to Level 5 Mastered ⭐).
   - Personal memory hooks and private notes per word with inline editing.
   - Practice button to level up mastery.

7. **Global Word Archive (`/history`)**:
   - Search every unique word ever registered.
   - Filter by contributor (Vinuu or Bhuu), difficulty, and part of speech.
   - Switch between **Words View** and **Days View** (past 10-word daily sets).
   - Instant audio pronunciation and Vault bookmarking.

8. **Achievements & Gamification (`/achievements`)**:
   - 14 distinct achievements across Streak, Vocabulary, Quiz, and Co-op categories.
   - Mutual unlock status: see which badges you and your partner have earned.
   - XP system: level up from Scholar to Word Legend.

9. **Streak Freeze Tokens**:
   - Protect your streak if either user is traveling or busy.
   - Earned automatically on milestone streaks (e.g., 7 days, 30 days).

---

## 🛠️ Technology Stack

- **Framework**: Next.js 15+ (App Router, React 19, TypeScript)
- **Styling**: Tailwind CSS + Custom Design Tokens (Glassmorphism, glow effects, 3D card transforms)
- **Authentication**: Auth.js v5 (NextAuth) with Credentials Provider & bcrypt password hashing
- **Database**: SQLite (local development) / PostgreSQL (production) via Prisma ORM
- **Visualizations**: Recharts
- **Celebrations**: Canvas-Confetti
- **Validation**: Zod
- **Audio**: Web Speech Synthesis API
- **Testing**: Jest + ts-jest

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
The `.env` file is already preconfigured for local development:
```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="wordstreak-development-secret-key-32-chars-long!"
NEXTAUTH_URL="http://localhost:3000"
APP_TIMEZONE="Asia/Kolkata"
DAILY_DEADLINE_HOUR=23

# Initial Seed Passwords
SEED_VINUU_PASSWORD="password123"
SEED_BHUU_PASSWORD="password123"
```

### 3. Initialize & Seed Database
```bash
# Run initial migration
npm run db:migrate

# Seed Vinuu & Bhuu accounts, shared streak singleton, and achievement catalog
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👤 Login Credentials

| User | Username | Default Password | Theme | Direct Link |
| :--- | :--- | :--- | :--- | :--- |
| **Vinuu** | `vinuu` | `password123` | Purple Gradient `💜` | [http://localhost:3000/login/vinuu](http://localhost:3000/login/vinuu) |
| **Bhuu** | `bhuu` | `password123` | Amber Gradient `🧡` | [http://localhost:3000/login/bhuu](http://localhost:3000/login/bhuu) |

---

## 🧪 Running Tests

WordStreak includes comprehensive unit tests covering word normalization, zero-duplicate detection, date logic, and progression utilities:

```bash
npm test
```

To run with coverage:
```bash
npm run test:coverage
```

---

## 📦 Production Build

Validate and build the production bundle:
```bash
npm run build
```

To run the production server:
```bash
npm start
```

---

## ☁️ Deployment Guide

### Deploying to Vercel with PostgreSQL

1. **Create a PostgreSQL Database**:
   - Provision a free database on [Neon](https://neon.tech) or [Supabase](https://supabase.com).
2. **Configure Prisma for PostgreSQL**:
   - In `prisma/schema.prisma`, update the datasource provider:
     ```prisma
     datasource db {
       provider = "postgresql"
       url      = env("DATABASE_URL")
     }
     ```
3. **Set Environment Variables on Vercel**:
   - `DATABASE_URL`: Connection string from Neon/Supabase.
   - `AUTH_SECRET`: Random 32+ character string (`openssl rand -base64 32`).
   - `NEXTAUTH_URL`: Your Vercel production domain (e.g., `https://wordstreak.vercel.app`).
   - `APP_TIMEZONE`: `Asia/Kolkata`
   - `SEED_VINUU_PASSWORD`: Strong password for Vinuu.
   - `SEED_BHUU_PASSWORD`: Strong password for Bhuu.
4. **Deploy**:
   - Push to GitHub and import the repository into Vercel.
   - In Vercel build settings, use `npm run build`.
   - Run initial seed: `npm run db:seed` via Vercel CLI or direct node runner.

---

*Private platform built with ❤️ for Vinuu & Bhuu.*
