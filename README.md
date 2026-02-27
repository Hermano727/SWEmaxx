# SWEmaxx

SWEmaxx is a personal engineering-growth platform designed to help users track,
improve, and showcase their software engineering skills.  
This repo is structured as a future-ready monorepo with a dedicated frontend and
room for infra/auth expansion.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- TailwindCSS
- ShadCN UI
- npm
- Vercel Deployments
- GitHub Actions CI

## Repository Structure

frontend/ Next.js web application (UI)
infra/ Infrastructure-as-code (future)
auth/ Auth functions, Supabase edge functions (future)


## Development

### 1. Install dependencies
cd frontend
npm install


### 2. Environment Variables
In the `frontend/` directory, create a file named `.env.local` and add the required environment variables (Firebase, OpenAI, etc.). For **OpenAI** (interview scorecard), see [frontend/docs/OPENAI_SETUP.md](frontend/docs/OPENAI_SETUP.md).

### 3. Run Dev Server
npm run dev


### 4. Lint and type check
```bash
npm run lint
npm run type-check
```


## CI / Automation

GitHub Actions:
- Lint + Type Check on PR
- Vercel Preview Deploys on PR
- Required checks before merge into main

## Contributing

See **CONTRIBUTING.md** for branch rules, naming conventions, and commit standards.