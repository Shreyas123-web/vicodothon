export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      // Dynamically import dependencies inside the Node.js block
      // to prevent Next.js from failing the Edge runtime compilation step
      const { getAgentData, savePost, saveRejections, updateHeartbeat } = await import('@/lib/db');
      const { evaluateHeadlines } = await import('@/lib/judge');
      const { generatePostText } = await import('@/lib/voice');
      const Parser = (await import('rss-parser')).default;

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
          console.log("Fetching live headlines...");
          const feed = await parser.parseURL(RSS_URL);
          
          const headlines = feed.items.slice(0, 5).map((item: any) => ({
            title: item.title || 'Unknown Title',
            link: item.link || 'https://news.ycombinator.com'
          }));

          const pastTopics = data.posts.map((p: any) => p.text);

          console.log("Judging headlines...");
          const judgeResult = await evaluateHeadlines(data.persona, headlines, pastTopics);

          if (judgeResult.rejected && judgeResult.rejected.length > 0) {
            const rejections = judgeResult.rejected.map((r: any) => ({
              title: r.title,
              reason: r.reason,
              rejectedAt: new Date().toISOString()
            }));
            saveRejections(rejections);
            console.log(`Logged ${rejections.length} rejected topics.`);
          }

          if (judgeResult.verdict && judgeResult.accepted) {
            // Programmatic Backstop: Ensure the LLM didn't hallucinate a duplicate acceptance
            const alreadyPublishedUrls = data.posts.flatMap((p: any) => p.sources || []);
            
            if (alreadyPublishedUrls.includes(judgeResult.accepted.link)) {
              console.log(`[BACKSTOP] LLM hallucinated a duplicate acceptance for: ${judgeResult.accepted.title}. Force-rejecting programmatically.`);
              const forcedRejection = {
                title: judgeResult.accepted.title,
                reason: "Programmatic Backstop: Already published this URL in a previous cycle.",
                rejectedAt: new Date().toISOString()
              };
              saveRejections([forcedRejection]);
            } else {
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
            }
          } else {
            console.log("No topics met the editorial bar this cycle. Agent is waiting.");
          }

          updateHeartbeat();

        } catch (error) {
          console.error("Cycle failed:", error);
          updateHeartbeat();
        }

        const INTERVAL_MS = 3 * 60 * 60 * 1000;
        console.log(`Cycle complete. Sleeping for ${INTERVAL_MS / 1000 / 60} minutes.`);
        setTimeout(runCycle, INTERVAL_MS);
      }

      console.log("Next.js Instrumentation: Booting background autonomous loop...");
      runCycle();
    } catch (e) {
      console.error("Next.js Instrumentation crashed during boot:", e);
    }
  }
}
