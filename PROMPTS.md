# AI-Usage Log

This file fulfills the Vicodothon requirement for an AI-usage log.

## Architectural Prompts

**Prompt 1: Real Autonomous Engine Setup**
> We are building the real autonomous agent. We need a background worker (`worker.js`) that runs constantly via `setInterval` for deployments on Render/Railway. It must autonomously fetch the live Hacker News RSS feed.

**Prompt 2: The Judge LLM Pass**
> We must prove editorial judgment and save API costs. Given 5 fresh RSS headlines, write a Gemini 1.5 Flash structured-output prompt that evaluates them against the persona. The LLM must output exactly one selected topic (with rationale) and list the other 4 as rejected (with a harsh critique reason). Save the rejections to `data/memory.json` to prove the agent makes decisions.

**Prompt 3: Multi-Template Voice Engine**
> We need to avoid persona drift without incurring massive LLM costs for generation. Build a multi-template voice engine in `src/lib/voice.ts` containing 5 distinct stylistic templates (e.g., "The Contrarian", "The Deep Dive"). The worker will randomly select a template and inject the LLM-selected headline and domain.

## Evaluation Notes
By utilizing this architecture, the application is a **true proactive agent**. It runs independently on a server, fetches live data, uses an LLM to exercise strict editorial judgment (logging both acceptances and rejections), and remembers what it published to avoid the "Groundhog Day" effect.
