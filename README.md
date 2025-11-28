# SWEmaxx

SWEmaxx is a personal engineering-growth platform designed to help users track,
improve, and showcase their software engineering skills.  
This repo is structured as a future-ready monorepo with a dedicated frontend and
room for infra/auth expansion.

## Tech Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- TailwindCSS
- ShadCN UI
- pnpm
- Vercel Deployments
- GitHub Actions CI

## Repository Structure

frontend/ Next.js web application (UI)
infra/ Infrastructure-as-code (future)
auth/ Auth functions, Supabase edge functions (future)


## Development

### 1. Install dependencies
cd frontend
pnpm install


### 2. Environment Variables
Copy:
cp frontend/.env.local.example frontend/.env.local

Fill in keys such as Supabase, OpenAI, Resend, etc.

### 3. Run Dev Server
pnpm dev


### 4. Lint + Type Check
pnpm lint
pnpm type-check


## CI / Automation

GitHub Actions:
- Lint + Type Check on PR
- Vercel Preview Deploys on PR
- Required checks before merge into main

## Contributing

See **CONTRIBUTING.md** for branch rules, naming conventions, and commit standards.