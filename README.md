# Autonomous AI Creator

An autonomous, end-to-end AI agent that acts as a domain-specific editorial curator. It continuously reads live RSS feeds, uses strict LLM editorial judgment to select highly relevant topics based on a custom Persona, and automatically publishes editorial posts to a live dashboard.

## Overview Materials (For Judges)
- **[Audio: Listen to the Project Walkthrough & Architecture Overview](https://drive.google.com/file/d/1R9hJtnfuY4VbcccGeQvO31RNW5Y97LFK/view?usp=drivesdk)**
- **[PDF: View the Complete Project Workflow](https://www.image2url.com/r2/default/documents/1786282395064-42ce9e39-fc36-4fa1-92b4-7090dbfe937b.pdf)**

## Live Demo (For Evaluators)
**[View Live Deployment Here](https://vicodothon-agent-production.up.railway.app)**

**Note to Judges:** You do **not** need to run this project locally! The agent is currently deployed and running autonomously on a scheduled cycle (currently every 3 hours), publishing new posts without manual intervention.

---

## Architecture
- **Frontend/Backend**: Next.js 16+ App Router
- **Autonomous Worker**: Next.js `instrumentation.ts` background loop that runs entirely detached from the UI.
- **AI Integration**: Groq SDK using the `llama-3.3-70b-versatile` model with structured `json_object` response formatting for reliable parsing.
- **Memory**: Persistent JSON file-based database (`/app/data/data.json`) mounted to a cloud volume. Persistent across redeploys, verified via testing.
- **Editorial Deduplication**: A code-level programmatic backstop deduplicates and rejects normalized URLs to prevent republishing, while persistent memory stores a detailed rejection log outlining exactly why the LLM discarded specific topics.

## How to Run Locally (Optional)

This project has been heavily optimized so the web dashboard and the background worker run together seamlessly in a single command.

### 1. Set your Environment Variables
Create a `.env.local` file in the root of the project and add your Groq API Key:
```env
GROQ_API_KEY="your_api_key_here"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Server
Open a terminal and run the server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. You will be prompted to initialize your agent's Persona. Once initialized, the `instrumentation.ts` background worker will instantly wake up, evaluate live headlines, and post to the dashboard automatically every 3 hours.

---

## AI Usage Log

This project was built with the assistance of advanced AI coding agents. Specifically, AI was used for:

1. **System Architecture & Constraints:** Diagnosing edge-case constraints in the Next.js Edge Runtime, bypassing static analyzer restrictions to enable persistent file-system (fs) writing in a standard Node.js container environment.
2. **Resilience Engineering:** Designing the background autonomous loop inside Next.js `instrumentation.ts` rather than relying on external cron jobs, and engineering robust retry-with-backoff logic for API rate limits.
3. **Migration & Provider Swapping:** Writing the `judge.ts` LLM prompt engineering, enforcing strict JSON schemas, and migrating the backend logic from Google Gemini to Groq Llama-3 to resolve hackathon rate-limit bottlenecks.
4. **UI/UX Design:** Assisting with the TailwindCSS structure and React `useEffect` polling logic for the live dashboard's heartbeat monitor.

**Note on Development History:** The bullets above describe the finalized architecture. For the complete, unedited development transcript documenting the rate-limit debugging, key rotation incident, and duplicate-post bugs we overcame, see `PROMPTS.md` and `TRANSCRIPT.jsonl` in this repository.