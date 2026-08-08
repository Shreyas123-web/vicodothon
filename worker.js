// worker.js
// This script runs autonomously. Run it with: node worker.js
const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');

// We use ts-node dynamically or just run compiled code, 
// but since we want to run this in dev without pre-compiling all Next.js TS files, 
// we will load the TS files using ts-node/register, or just require the functions.
require('dotenv').config({ path: '.env.local' });

require('ts-node').register({
  compilerOptions: { module: 'commonjs' }
});

const { getAgentData, savePost, saveRejections } = require('./src/lib/db.ts');
const { evaluateHeadlines } = require('./src/lib/judge.ts');
const { generatePostText } = require('./src/lib/voice.ts');

const parser = new Parser();
const RSS_URL = 'https://techcrunch.com/feed/';

async function runCycle() {
  console.log(`[${new Date().toISOString()}] Starting autonomous cycle...`);
  
  const data = getAgentData();
  if (!data || !data.persona) {
    console.log("No persona initialized yet. Sleeping...");
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


  } catch (error) {
    console.error("Cycle failed:", error);
  }
}

// Run immediately once
runCycle();

// Then run every 2 hours (7200000 ms) 
// (For hackathon testing purposes, you might want to lower this to 5 minutes: 300000)
const INTERVAL_MS = 2 * 60 * 60 * 1000;
console.log(`Worker started. Running every ${INTERVAL_MS / 1000 / 60} minutes.`);
setInterval(runCycle, INTERVAL_MS);
