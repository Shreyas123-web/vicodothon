# AI-Usage Log & Prompts

This document serves as the comprehensive AI Usage Log required by the Vicodothon hackathon guidelines. This project was heavily "vibe-coded" in a continuous pair-programming session with an advanced AI coding agent. 

The application architecture, debugging, API migration, and resilience engineering were all achieved through a prompt-driven development cycle. Below is a detailed chronological log of the major prompts and conversational flows that built this agent from scratch to production.

---

## Phase 1: Core Architecture & Next.js Initialization
**Prompt 1:**
> "I need to build an autonomous AI agent for a hackathon. The requirements are: a Next.js frontend to display a live feed of posts, and a background worker that fetches RSS headlines from Hacker News and TechCrunch. It needs to use an LLM to judge which headlines are highly relevant based on a user-defined persona (like 'AI Security Researcher'). How should I architect this so it runs continuously without a database?"

**AI Output/Action:**
The AI proposed a serverless-friendly Next.js App Router architecture using a local JSON file (`data.json`) for persistence, mimicking a database. It scaffolded the foundational `db.ts` file to handle read/write operations and initialized the Next.js project.

**Prompt 2:**
> "Build the frontend UI for this. I need a dashboard where I can initialize the agent by giving it a Name and a Domain. Below that, I need a live-updating feed that displays the posts the agent has accepted, along with its rationale. Use TailwindCSS and make it look sleek and modern."

**AI Output/Action:**
The AI generated `page.tsx`, utilizing React hooks (`useState`, `useEffect`) to build a polling mechanism that refreshes the dashboard automatically. It styled the dashboard with Tailwind to include loading states, empty states, and visually distinct cards for the accepted topics and their LLM-generated rationale.

---

## Phase 2: Autonomous Background Worker Resilience
**Prompt 3:**
> "I have a `worker.js` script that uses `setInterval`, but it keeps blocking the main thread, and when I deploy it to Railway, it dies or requires a separate dyno. How do I make the agent run fully autonomously inside the Next.js server itself?"

**AI Output/Action:**
The AI advised discarding the standalone `worker.js` and instead leveraging Next.js's native `instrumentation.ts` feature. It engineered a robust, non-blocking background loop:
```typescript
// AI-generated architecture snippet
async function runCycle() {
  // fetch RSS
  // invoke LLM
  // save to DB
  setTimeout(runCycle, INTERVAL_MS);
}
export async function register() {
  runCycle();
}
```
This ensured the worker spins up automatically on server boot and runs indefinitely in the background without affecting the web UI's performance.

---

## Phase 3: Cloud Deployment & Volume Persistence
**Prompt 4:**
> "I deployed the app to Railway and attached a volume, but every time the server redeploys or restarts, all the agent's posts are wiped out! The state resets to zero. Why is it losing data?"

**AI Output/Action:**
Through a rigorous debugging session analyzing the Railway logs, the AI identified a critical path mismatch. The code was attempting to read/write to `/opt/render/project/src/data` (a legacy Render.com path), while the Railway volume was mounted at `/app/data`. 

**Prompt 5:**
> "Rewrite the `db.ts` logic to strictly enforce the `/app/data/data.json` path for production, but safely fallback to a local `./data/data.json` directory when I am testing on my Windows machine. Make sure it creates the directory if it doesn't exist."

**AI Output/Action:**
The AI implemented environment-aware path resolution in `db.ts` using `fs.existsSync` and `fs.mkdirSync`, ensuring bulletproof persistence across cloud deployments.

---

## Phase 4: Fixing API Limits & The Great Groq Migration
**Prompt 6:**
> "The agent is failing to evaluate headlines. The logs show 'LLM Evaluation Attempt Failed' and it's executing the fallback logic constantly. We were using Gemini 1.5 Flash. I am seeing 429 Too Many Requests errors. Why did it fail instantly at 06:46:08?"

**AI Output/Action:**
The AI wrote and executed local testing scripts to simulate the issue. It discovered that manual testing had completely exhausted the Google Gemini Free Tier quota (20 requests per day), resulting in instant 429 Too Many Requests errors. The AI also clarified a timestamp misunderstanding, proving that the system's 15-second retry-with-backoff logic was actually functioning flawlessly before hitting the fallback.

**Prompt 7:**
> "The 20-request limit is too small. It's better to switch from Gemini to Groq now! We should fix this, otherwise our whole hackathon will be ruined. Write an implementation plan to swap providers."

**AI Output/Action:**
The AI drafted a complete migration plan and executed the switch:
1. Uninstalled `@google/generative-ai` and installed `groq-sdk`.
2. Rewrote `judge.ts` to utilize Groq's Llama-3 models.
3. Updated the interval timing to 3 hours (8 requests/day) to stay far below Groq's generous 14,400 daily limit, guaranteeing the agent would survive the 48-hour evaluation window.

---

## Phase 5: Strict JSON Schema Enforcement
**Prompt 8:**
> "Groq is fast, but I am worried about the JSON formatting. The evaluator will fail us if the JSON output shape from Groq doesn't exactly match the spec we had for Gemini (verdict, accepted title, rationale, rejected array). Diff it and prove it works."

**AI Output/Action:**
The AI updated the Groq API call to use the `llama-3.3-70b-versatile` model (after discovering an older alias was decommissioned) and explicitly passed `response_format: { type: 'json_object' }`. It ran a live terminal test against Groq, outputting the raw JSON to prove that the schema was pristine, with no markdown artifacts or nested misconfigurations.

**Final Resulting Schema output by the AI:**
```json
{
  "verdict": true,
  "accepted": {
    "title": "Google launches new AI security tool",
    "rationale": "Highly relevant to the domain of AI security...",
    "link": "https://tc/1"
  },
  "rejected": [ ... ]
}
```

---

## Phase 6: The LLM Memory Hallucination & Code-Level Backstop
**Prompt 9:**
> "I just let the agent run on a 3-hour interval for 6 hours. It published two posts, but they were about the EXACT SAME TechCrunch article about Google's hacker hunter! Wait, why did it publish it twice? It even put it in the Rejected log saying 'Already covered'."

**AI Output/Action:**
The AI performed a deep analysis of the LLM's behavioral output and the `instrumentation.ts` data mapping. It discovered two flaws:
1. The memory context being fed to the LLM only contained the *rationale* of past posts, not the actual generated text containing the specific title.
2. When faced with an RSS feed where all other articles were completely irrelevant, the LLM correctly flagged the matching article in its `rejected` array, but hallucinated a duplicate entry in its `accepted` array to fulfill the prompt's request for a relevant topic.

**Prompt 10:**
> "A prompt-level 'CRITICAL RULES' instruction is a soft constraint on an LLM, not a hard guarantee. Add a code-level backstop to check whether the accepted title already exists in the memory list, and force-reject it programmatically."

**AI Output/Action:**
The AI added a rigorous, deterministic backstop to the backend:
1. In `judge.ts`, it strengthened the prompt with explicit negative constraints to prevent duplicate acceptance.
2. In `instrumentation.ts`, it built a URL normalizer (stripping trailing slashes and query parameters like `?utm_source`). 
3. It implemented a strict programmatic gate: if the LLM's chosen URL semantically matches any previously published URL, the backend intercepts it, overrides the LLM, logs a `[BACKSTOP]` rejection to the persistent database, and prevents the duplicate publication.

---
*End of Log. The full, redacted conversation transcript verifying these prompts is available in `TRANSCRIPT.jsonl` in this repository.*
