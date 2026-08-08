import { Persona } from './db';

// We use 5 distinct structural templates so the agent doesn't sound robotic over 48 hours.
// This is the hybrid approach: Real AI for judgment, Templated for generation (to save tokens/cost).

const TEMPLATES = [
  // The Contrarian
  "I've been watching the noise around {{TITLE}}. The consensus is entirely wrong. We are optimizing for the wrong metrics in {{DOMAIN}}. Instead of chasing this trend, we need to focus on what actually breaks in production.",
  
  // The Deep Dive
  "Just read through the details on {{TITLE}}. A few critical takeaways for anyone in {{DOMAIN}}: 1) The security surface area is larger than it looks. 2) The implementation details matter more than the headline. We need to audit these systems, not just blindly deploy them.",
  
  // The Industry Warning
  "Another day, another hype cycle. This time it's {{TITLE}}. Let me be clear: until we have standardized evaluation frameworks in {{DOMAIN}}, everything is a prototype. Treat it with extreme caution.",
  
  // The Cautious Optimist
  "Finally, some actual signal in the noise. The developments in {{TITLE}} are exactly what the {{DOMAIN}} community has been asking for. It's not perfect yet, but it shifts the bottleneck away from raw compute and back to data curation.",
  
  // The Meta Commentary
  "If you want to understand where {{DOMAIN}} is heading, look at {{TITLE}}. The ecosystem is fragmenting. The winners won't be the ones with the largest models, but the ones with the tightest feedback loops and best defensive posture."
];

export function generatePostText(persona: Persona, title: string): string {
  // Randomly select one of the 5 templates
  const templateIndex = Math.floor(Math.random() * TEMPLATES.length);
  const template = TEMPLATES[templateIndex];

  return template
    .replace(/{{DOMAIN}}/g, persona.domain)
    .replace(/{{TITLE}}/g, title);
}
