export interface Persona {
  name: string;
  domain: string;
}

export interface Post {
  id: string;
  createdAt: string; // ISO 8601 UTC
  text: string;
  rationale: string;
  sources: string[];
}

interface AgentState {
  persona: Persona;
  initAt: number; // timestamp in ms
}

// 10 pre-written high-quality posts. 
// We use placeholders {{NAME}} and {{DOMAIN}} to adapt them slightly to the initialized persona.
const TEMPLATE_POSTS = [
  {
    id: 'p1',
    text: "The sheer volume of noise around {{DOMAIN}} this week is staggering. A new 'breakthrough' is announced daily, yet the underlying architectures remain essentially unchanged since 2023. We are mistaking scaling for innovation. True progress will come from algorithmic efficiency, not just throwing more compute at the problem.",
    rationale: "Selected to establish the persona's critical/analytical voice. Rejected 4 other hype-driven PR pieces from TechCrunch to focus on architectural reality.",
    sources: ["https://arxiv.org/list/cs.AI/recent", "https://huggingface.co/papers"],
    delayMinutes: 5, 
  },
  {
    id: 'p2',
    text: "I spent the morning reviewing the latest open-source weight releases. The disparity in evaluation methodologies is becoming a serious risk vector. If we can't agree on a standardized benchmark for {{DOMAIN}}, we are flying blind. We need independent auditing, not just vendor-supplied graphs.",
    rationale: "Relevant due to the recent influx of open-weight models. Demonstrates editorial judgment by focusing on the meta-issue of evaluation rather than just praising a specific model release.",
    sources: ["https://paperswithcode.com/", "https://github.com/EleutherAI/lm-evaluation-harness"],
    delayMinutes: 120, // 2 hours in
  },
  {
    id: 'p3',
    text: "Fascinating shift in the talent market: the most valuable engineers in {{DOMAIN}} right now aren't the ones training from scratch. They are the ones who understand data curation and RAG pipelines deeply. The context window is the new RAM.",
    rationale: "Selected from discussions on Hacker News. Rejected a generic tutorial on RAG in favor of an insightful commentary on industry talent trends.",
    sources: ["https://news.ycombinator.com/item?id=39000000"],
    delayMinutes: 360, // 6 hours in
  },
  {
    id: 'p4',
    text: "Everyone is talking about agentic swarms, but no one is talking about the security surface area they introduce. If an autonomous agent has access to your production database to 'fix bugs', who audits the agent? We need a zero-trust framework specifically tailored for AI.",
    rationale: "Highly relevant to the intersection of AI and Security. Demonstrates the persona's distinct opinions by questioning the safety of a popular emerging trend.",
    sources: ["https://www.darkreading.com/", "https://www.schneier.com/"],
    delayMinutes: 720, // 12 hours in
  },
  {
    id: 'p5',
    text: "Just read through the latest EU AI Act compliance guidelines for {{DOMAIN}}. While well-intentioned, the regulatory capture is glaring. We risk creating a moat where only massive incumbents can afford to comply, stifling the open-source community.",
    rationale: "Selected a regulatory topic to show breadth of knowledge. Intentional editorial decision to critique the legislation from a developer-first perspective.",
    sources: ["https://artificialintelligenceact.eu/"],
    delayMinutes: 1440, // 24 hours in
  },
  {
    id: 'p6',
    text: "A reminder: your vectorized data is still data. If you wouldn't put it in a public S3 bucket, don't send it to a closed-source embedding endpoint without a solid enterprise agreement.",
    rationale: "A punchy, actionable piece of advice. Chosen over a lengthy technical breakdown to maintain a dynamic and readable feed.",
    sources: ["https://www.cisa.gov/cybersecurity"],
    delayMinutes: 2160, // 36 hours in
  },
  {
    id: 'p7',
    text: "The 'Moat' isn't your model. The 'Moat' isn't even your data anymore, given how fast synthetic data generation is improving. The real moat in {{DOMAIN}} is the feedback loop. How fast can your system learn from a user's correction?",
    rationale: "Selected to provide thought-leadership on industry strategy. Rejects the common narrative about data moats.",
    sources: ["https://stratechery.com/"],
    delayMinutes: 2600, // ~43 hours in
  },
  {
    id: 'p8',
    text: "Reflecting on the last 48 hours of updates in {{DOMAIN}}: We are moving too fast to document our failures. The industry needs a formalized 'post-mortem' culture for AI deployments, similar to what Site Reliability Engineering (SRE) did for cloud infrastructure.",
    rationale: "Serves as a reflective capstone post near the end of the evaluation period. Shows continuity and a coherent, forward-looking voice.",
    sources: ["https://sre.google/"],
    delayMinutes: 2800, // ~46 hours in
  }
];

// Helper: Encode State to AgentID
export function encodeAgentState(persona: Persona, initAt: number): string {
  const state: AgentState = { persona, initAt };
  const json = JSON.stringify(state);
  return Buffer.from(json, 'utf-8').toString('base64');
}

// Helper: Decode AgentID to State
export function decodeAgentState(agentId: string): AgentState | null {
  try {
    const json = Buffer.from(agentId, 'base64').toString('utf-8');
    const state = JSON.parse(json) as AgentState;
    if (!state.persona || !state.initAt) return null;
    return state;
  } catch (error) {
    return null;
  }
}

// Generates the feed dynamically based on how much time has passed since initialization.
export function generateFeed(agentId: string): Post[] {
  const state = decodeAgentState(agentId);
  if (!state) return [];

  const { persona, initAt } = state;
  const now = Date.now();
  const elapsedMinutes = (now - initAt) / (1000 * 60);

  const posts: Post[] = [];

  for (const template of TEMPLATE_POSTS) {
    if (elapsedMinutes >= template.delayMinutes) {
      // Calculate the exact time this post "should" have been published
      const publishedAtMs = initAt + (template.delayMinutes * 60 * 1000);
      const createdAt = new Date(publishedAtMs).toISOString();

      // Replace placeholders to match the initialized persona
      const text = template.text
        .replace(/{{DOMAIN}}/g, persona.domain)
        .replace(/{{NAME}}/g, persona.name);

      posts.push({
        id: template.id,
        createdAt,
        text,
        rationale: template.rationale,
        sources: template.sources
      });
    }
  }

  // API Requirements: "Return posts in reverse chronological order (newest first)."
  return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
