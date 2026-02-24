# OpenAI setup for interview scoring

This app uses OpenAI to generate interview scorecards (Strong Hire / Hire / No Hire, strengths, weaknesses, mistakes). The key is used **only on the server** (API routes), so it is never exposed to the browser.

## 1. Get an API key

1. Go to [OpenAI Platform](https://platform.openai.com).
2. Sign in or create an account.
3. Open [API keys](https://platform.openai.com/api-keys) and click **Create new secret key**.
4. Name it (e.g. `SWEmaxx dev`) and copy the key. You will not see it again.

## 2. Add the key locally

1. In the `frontend` folder, copy the example env file:
   ```bash
   cp .env.local.example .env.local
   ```
2. Open `.env.local` and set:
   ```env
   OPENAI_API_KEY=sk-proj-...your-key...
   ```
3. Do **not** commit `.env.local` (it is gitignored). Do not use `NEXT_PUBLIC_` for this key; it must stay server-only.

## 3. Model and usage

- **Model:** The app uses `gpt-4o-mini` by default for scoring. It is cheap and fast; you can switch to `gpt-4o` or another model later via config (see the LLM adapter in `lib/interview/`).
- **Where it’s used:** `POST /api/interviews/[id]/finish` calls the scorecard adapter, which uses this key to call the OpenAI API.
- **Billing:** Usage appears under your OpenAI account. Set usage limits in the [OpenAI dashboard](https://platform.openai.com/usage) if you want a cap.

## 4. Deploy (Vercel)

Add `OPENAI_API_KEY` as an environment variable in your Vercel project (Settings → Environment variables). Use the same key or a separate production key.
