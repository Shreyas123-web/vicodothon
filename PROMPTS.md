# AI-Usage Log & Prompts

This file fulfills the Vicodothon requirement for an AI-usage log. The project was heavily "vibe-coded" with the assistance of advanced AI coding agents, which guided the architectural decisions, deployment debugging, and LLM integration.

Below is a summary of the core prompts and conversational flows used to architect, debug, and deploy the application.

## 1. Initial Architecture & UI
**Prompt/Intent:**
> "I need to build an autonomous AI agent for a hackathon. It needs a Next.js frontend to display a feed of posts, and a background worker that fetches RSS headlines and uses an LLM to judge which ones are relevant based on a user-defined persona. How should I architect this?"

**AI Contribution:** 
The AI suggested using Next.js App Router and a background polling mechanism. It generated the initial TailwindCSS UI and the structure for the `db.ts` file to handle JSON-based persistence.

## 2. Background Worker Resilience (Moving away from worker.js)
**Prompt/Intent:**
> "I can't get the background worker (`worker.js`) to run continuously on Railway without blocking the main thread or dying when the server restarts. How do I make it autonomous inside Next.js?"

**AI Contribution:** 
The AI recommended discarding the standalone `worker.js` script and instead moving the background loop into Next.js's native `instrumentation.ts`. It wrote the `runCycle()` loop that recursively calls `setTimeout`, ensuring the worker runs completely detached from the UI thread and starts automatically on server boot.

## 3. Resolving Cloud Persistence Issues
**Prompt/Intent:**
> "Every time I redeploy the app on Railway, all my agent's posts are getting wiped out. I have a volume attached, why is it losing data?"

**AI Contribution:** 
Through a deep debugging session, the AI identified that the code was reading/writing to `/opt/render/project/src/data` (a stale Render.com path) instead of `/app/data/data.json` (the Railway volume mount path). It updated `db.ts` to strictly enforce the correct volume path.

## 4. Debugging API Limits & Migrating to Groq
**Prompt/Intent:**
> "The agent is failing to evaluate headlines. The logs show 'LLM Evaluation Attempt Failed'. We were using Gemini 1.5 Flash. Here is my API key, what is going wrong?"

**AI Contribution:** 
The AI ran local test scripts using the provided API key and discovered that the Gemini API was returning a 429 Rate Limit error because the free-tier quota (20 requests per day) was instantly exhausted by manual testing. 

**Follow-up Prompt:**
> "It's better to switch from Gemini to Groq now! We should fix this, otherwise our whole hackathon will be ruined."

**AI Contribution:** 
The AI swapped `@google/generative-ai` for `groq-sdk`. It migrated the `judge.ts` script to use Groq's `llama-3.3-70b-versatile` model, implemented strict `json_object` formatting to maintain schema integrity, and rewrote the retry-logic to handle Groq's rate limits. 

## 5. JSON Schema Enforcement
**Prompt/Intent:**
> "Make sure the JSON output shape from Groq exactly matches the spec we had for Gemini."

**AI Contribution:** 
The AI ran a local terminal test with the new Groq API key, diffed the output against the `JudgeResult` interface, and confirmed that the Groq LLM produced a pristine JSON object without any markdown artifacts.

## Evaluation Notes
By utilizing this architecture, the application is a **true proactive agent**. It runs independently on a server, fetches live data, uses an LLM to exercise strict editorial judgment (logging both acceptances and rejections), and remembers what it published to avoid the "Groundhog Day" effect.
