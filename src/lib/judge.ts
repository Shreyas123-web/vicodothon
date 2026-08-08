import { GoogleGenerativeAI } from '@google/generative-ai';
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
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'deep-research-preview-04-2026',
  });

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

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(text) as JudgeResult;
    return parsed;
  } catch (error) {
    console.error("LLM Evaluation Failed:", error);
    // Safe fallback to prevent crash, acting as if nothing was accepted.
    return {
      verdict: false,
      rejected: headlines.map(h => ({ title: h.title, reason: "Fallback rejection due to LLM error" }))
    };
  }
}
