# notYET — The Archive of Human Persistence

> *Everyone celebrates Chapter 20. We collect Chapters 1–19.*

---

The internet is full of highlight reels — offer letters, funding announcements, promotion posts. But the years of uncertainty, the 100+ rejection emails, the abandoned repositories, and the 3 AM breakdowns that preceded those wins? **They stay hidden.**

**notYET** is a platform that archives exactly that. It is a living, human record of persistence — a place where people document every attempt, every failure, and every pivot that eventually led somewhere meaningful. Not to celebrate suffering, but to show the full picture of what persistence actually looks like.

Because every success is built on a "Not Yet."

---

## What is notYET?

notYET is a **community archive platform** where users write structured, long-form accounts of their journeys through rejection, failure, and eventual breakthroughs. Each "journey" maps a person's real timeline — the specific rejections, the lowest moments, the mistakes made, the pivots taken, and the lessons that changed everything.

It is part documentary, part archive, part solidarity network.

Think of it as the opposite of LinkedIn — not polished, not performative, just honest.

---

## Core Features

### 📖 Journey Archive
Users publish structured journey documents covering:
- What they were trying to achieve
- Every attempt along a mapped timeline (with fail/success/milestone markers)
- Their lowest point and biggest mistake
- The pivots and lessons learned
- Advice for people currently in their "chapter 1–19"

Posting supports **three visibility modes**: fully public, nickname/pseudonym, or completely anonymous — so people can share freely without fear.

### 🤝 Solidarity Reactions
No toxic "likes". Instead, readers react with:
`🤝 Relatable` · `🎒 Been There` · `💡 Learned Something` · `✨ Inspired Me` · `❤️ Needed This` · `✊ Respect`

A support vocabulary built for honest stories, not performative engagement.

### 🗣️ Threaded Comments
Nested comment threads for conversation. Anonymous commenting supported — because sometimes solidarity is easier without a name attached.

### 🏆 Behind The Win
A unique infographic generator where users connect their archive of failures to their eventual win. Import your published journeys directly, arrange the timeline, and export a shareable visual that shows the *full path*, not just the destination.

### 👤 Author Profiles
Public profiles showing all published journeys, rejection stats, and community impact — an honest portfolio of persistence.

### 🔍 Explore & Filter
Browse the archive by category (tech, startups, academics, creative fields, sports, etc.), filter by tags, and discover stories that resonate.

### 🔐 Admin Control Panel
A private, credential-gated dashboard for content moderation, flagged post review, infrastructure cost tracking, and system audit logs. Accessible only via `/admin` with authorized credentials.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Authentication | Clerk (production) / Mock Auth (development) |
| Database | MongoDB Atlas via Mongoose |
| Animations | Framer Motion, GSAP, Three.js |
| Forms | React Hook Form + Zod validation |
| Charts | Recharts |
| Icons | Lucide React |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB Atlas account (or use the built-in local JSON fallback — no setup needed)
- A Clerk account for authentication (optional for local dev)

### Installation

```bash
git clone https://github.com/doSwayamCode/not-yet.git
cd not-yet
npm install
```

### Environment Setup

Copy the example env file:

```bash
cp .env.example .env
```

Fill in your values. The app runs in **mock mode by default** — no external services required for local development. The local JSON file database activates automatically if `MONGODB_URI` is not set.

```env
# Required for production
MONGODB_URI=mongodb+srv://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

In development, use the **simulation tray** (bottom-right drawer) to switch between mock user profiles without needing Clerk configured.

### Build for Production

```bash
npm run build
npm start
```

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Homepage / Hero
│   ├── explore/              # Browse all journeys
│   ├── share/                # Submit a new journey
│   ├── journeys/[id]/        # Journey detail view
│   ├── profile/[username]/   # Author profile page
│   ├── behind-the-win/       # Infographic generator
│   ├── admin/                # Admin control panel (credential-gated)
│   ├── sign-in/ sign-up/     # Clerk auth pages
│   └── api/                  # All API routes
│       ├── journeys/         # CRUD + reactions + comments
│       ├── admin/            # Analytics + moderation endpoints
│       ├── profile/          # Public profile data
│       └── stats/            # Global counters
├── components/
│   ├── SignatureAnimation.tsx # Three.js particle hero animation
│   ├── GlobalCounter.tsx      # Live community stat counters
│   └── MockAuthSwitcher.tsx   # Dev-mode user simulation tray
├── lib/
│   ├── auth-server.ts         # Server-side session handling
│   ├── auth-wrapper.tsx       # Client auth context (Clerk/Mock)
│   └── db.ts                  # MongoDB + local JSON fallback
└── models/                    # Mongoose schemas
```

---

## Security Notes

- Admin credentials are validated server-side via cookie token — the `/admin` route is inaccessible without matching credentials
- API routes strip raw error messages in production — no stack traces or DB details are exposed in responses
- All admin endpoints are guarded by `requireAdmin()` which validates the session server-side
- `.env` is excluded from version control via `.gitignore`

---

## Philosophy

Most persistence platforms tell you to "embrace failure." notYET doesn't preach — it witnesses.

We believe the most powerful thing you can do for someone in the middle of Chapter 7 is show them what Chapter 7 looked like for someone who eventually reached Chapter 20. Not to promise them the same outcome. Just to make the road feel less lonely.

**notYET is not a motivation platform. It is an archive of real people, keeping going.**

---

## License

MIT — build on it, learn from it, fork it.

---

*Built with persistence by [Swayam Gupta](https://github.com/doSwayamCode)*