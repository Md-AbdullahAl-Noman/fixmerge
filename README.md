# CodeSentry

A lightweight, self-hosted PR quality gate built with **Next.js**. Automatically analyzes merged pull requests for bugs, security issues, code complexity, and quality problems.

## What It Does

When a PR is merged on GitHub, CodeSentry:

1. **Receives a webhook** from GitHub
2. **Fetches the changed files** and their full content via GitHub API
3. **Runs 4 analyzers** on the code:
   - **Bug Detector** — bare excepts, eval, hardcoded secrets, mutable defaults, async-in-forEach, debugger statements (14 rules)
   - **Security Analyzer** — SQL injection, XSS, command injection, unsafe deserialization, disabled SSL, .env files (14 rules)
   - **Complexity Analyzer** — function length, cyclomatic complexity, nesting depth, file size
   - **Quality Analyzer** — linter suppressions, empty catch blocks, wildcard imports, PR size (7+ rules)
4. **Scores the PR** from 0–100 and assigns a grade (A–F)
5. **Posts a comment** on the PR with a summary of findings
6. **Displays everything** on a dark-themed web dashboard

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your GITHUB_TOKEN

# Set up database
npx prisma migrate dev

# Run development server
npm run dev
```

Open http://localhost:3000 to see the dashboard.

## Set Up GitHub Webhook

In your GitHub repo → Settings → Webhooks → Add webhook:

- **Payload URL:** `https://your-server.com/api/webhook/github`
- **Content type:** `application/json`
- **Secret:** same as `GITHUB_WEBHOOK_SECRET` in `.env`
- **Events:** Select "Pull requests"

For local development, use [ngrok](https://ngrok.com) to expose localhost.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/webhook/github` | GitHub webhook receiver |
| `GET` | `/api/analyses` | List all analyses (JSON) |
| `GET` | `/api/analyses/:id` | Get analysis details with issues (JSON) |
| `GET` | `/api/health` | Health check |
| `GET` | `/` | Web dashboard |
| `GET` | `/report/:id` | Detailed report page |

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **Prisma** with SQLite
- **GitHub API** for PR data

## Project Structure

```
src/
├── app/
│   ├── page.tsx                      # Dashboard
│   ├── report/[id]/page.tsx          # PR report page
│   ├── api/
│   │   ├── webhook/github/route.ts   # Webhook receiver
│   │   ├── analyses/route.ts         # List analyses
│   │   ├── analyses/[id]/route.ts    # Analysis detail
│   │   └── health/route.ts           # Health check
│   ├── layout.tsx
│   └── globals.css
├── lib/
│   ├── db.ts                         # Prisma client
│   ├── github.ts                     # GitHub API client
│   ├── engine.ts                     # Analysis orchestrator
│   ├── types.ts                      # Shared types
│   └── analyzers/
│       ├── bug-detector.ts           # 14 bug-pattern rules
│       ├── security.ts               # 14 security rules
│       ├── complexity.ts             # Complexity metrics
│       ├── quality.ts                # Code quality checks
│       ├── utils.ts                  # Diff parsing utilities
│       └── index.ts
├── components/
│   ├── grade-badge.tsx
│   ├── severity-pill.tsx
│   └── issue-card.tsx
└── generated/prisma/                 # Prisma generated client
```
