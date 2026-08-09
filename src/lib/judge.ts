import Groq from 'groq-sdk';
import { Persona } from './db';

export interface Headline {
  title: string;
  link: string;
}

export interface JudgeResult {
  verdict: boolean;
  accepted?: {
    title: string;
    rationale: string;
    link: string;
  };
  rejected: {
    title: string;
    reason: string;
  }[];
}

export async function evaluateHeadlines(persona: Persona, headlines: Headline[], pastTopics: string[]): Promise<JudgeResult> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set.");
  }
  
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const prompt = `
You are an editorial judge for an AI agent. The agent's persona is:
Name: ${persona.name}
Domain: ${persona.domain}

Your job is to review a list of recent headlines and select EXACTLY ONE (or none) that is highly relevant to this persona and worthy of publishing.
You must exercise strict editorial judgment. Reject generic news, irrelevant topics, or topics we have already published about.

Past topics we have already published (DO NOT REPEAT THESE):
${pastTopics.length > 0 ? pastTopics.map(t => '- ' + t).join('\n') : 'None yet.'}

Recent Headlines:
${headlines.map((h, i) => `[${i}] ${h.title} (URL: ${h.link})`).join('\n')}

Output a strict JSON object with this exact schema (DO NOT WRAP IN BACKTICKS):
{
  "verdict": boolean, // true if you selected a headline, false if you rejected all of them
  "accepted": { // omit if verdict is false
    "title": "exact title of selected headline",
    "rationale": "A 2-3 sentence explanation of why this topic was selected, why it is relevant now, and why it was chosen over the others.",
    "link": "exact url of selected headline"
  },
  "rejected": [ // list all headlines that were NOT selected
    {
      "title": "exact title",
      "reason": "1 sentence harsh critique of why this was rejected by the persona (e.g. 'Too generic', 'Already covered', 'Irrelevant to domain')."
    }
  ]
}
`;

  let retries = 3;
  while (retries > 0) {
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama3-70b-8192',
        response_format: { type: 'json_object' }
      });
      
      let text = chatCompletion.choices[0]?.message?.content || '{}';
      text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(text) as JudgeResult;
      return parsed;
    } catch (error: any) {
      console.error(`LLM Evaluation Attempt Failed (${retries} retries left):`, error.message || error);
      if (error.message?.includes('429') || error.message?.includes('rate limit') || error.status === 429) {
        retries--;
        if (retries > 0) {
          console.log(`Rate limited by Groq. Retrying in 15 seconds...`);
          await new Promise(res => setTimeout(res, 15000));
          continue;
        }
      }
      
      // Safe fallback after retries exhausted or non-429 error
      return {
        verdict: false,
        rejected: headlines.map(h => ({ title: h.title, reason: "Skipped this cycle: API temporarily unavailable" }))
      };
    }
  }

  return {
    verdict: false,
    rejected: headlines.map(h => ({ title: h.title, reason: "Skipped this cycle: API temporarily unavailable" }))
  };
}
