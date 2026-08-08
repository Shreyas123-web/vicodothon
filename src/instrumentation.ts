import { getAgentData, savePost, saveRejections, updateHeartbeat } from '@/lib/db';
import { evaluateHeadlines } from '@/lib/judge';
import { generatePostText } from '@/lib/voice';
import Parser from 'rss-parser';

const parser = new Parser();
const RSS_URL = 'https://techcrunch.com/feed/';

async function runCycle() {
  console.log(`[${new Date().toISOString()}] Starting autonomous cycle...`);
  
  const data = getAgentData();
  if (!data || !data.persona) {
    console.log("No persona initialized yet. Checking again in 1 minute...");
    setTimeout(runCycle, 60 * 1000);
    return;
  }

  try {
    // 1. Discovery
    console.log("Fetching live headlines...");
    const feed = await parser.parseURL(RSS_URL);
    
    // Grab the top 5 recent headlines
    const headlines = feed.items.slice(0, 5).map(item => ({
      title: item.title || 'Unknown Title',
      link: item.link || 'https://news.ycombinator.com'
    }));

    // 2. Memory Prep
    const pastTopics = data.posts.map(p => p.rationale); // passing rationales/titles to avoid repeating

    // 3. Editorial Judge
    console.log("Judging headlines...");
    const judgeResult = await evaluateHeadlines(data.persona, headlines, pastTopics);

    // Save rejections
    if (judgeResult.rejected && judgeResult.rejected.length > 0) {
      const rejections = judgeResult.rejected.map(r => ({
        title: r.title,
        reason: r.reason,
        rejectedAt: new Date().toISOString()
      }));
      saveRejections(rejections);
      console.log(`Logged ${rejections.length} rejected topics.`);
    }

    // 4. Voice Generation & Publishing
    if (judgeResult.verdict && judgeResult.accepted) {
      console.log(`Topic accepted: ${judgeResult.accepted.title}`);
      const text = generatePostText(data.persona, judgeResult.accepted.title);
      
      const newPost = {
        id: `post_${Date.now()}`,
        createdAt: new Date().toISOString(),
        text: text,
        rationale: judgeResult.accepted.rationale,
        sources: [judgeResult.accepted.link]
      };

      savePost(newPost);
      console.log("Post published successfully!");
    } else {
      console.log("No topics met the editorial bar this cycle. Agent is waiting.");
    }

    // Update heartbeat to prove worker is alive
    updateHeartbeat();

  } catch (error) {
    console.error("Cycle failed:", error);
    // Still update heartbeat even if cycle fails, to show the loop hasn't crashed
    updateHeartbeat();
  }

  // Schedule next run in 5 minutes
  const INTERVAL_MS = 5 * 60 * 1000;
  console.log(`Cycle complete. Sleeping for ${INTERVAL_MS / 1000 / 60} minutes.`);
  setTimeout(runCycle, INTERVAL_MS);
}

export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Kick off the autonomous loop when the Next.js Node server boots up
    console.log("Next.js Instrumentation: Booting background autonomous loop...");
    runCycle();
  }
}
