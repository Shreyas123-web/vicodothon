const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");

/**
 * Connects to Breeth via MCP remote over STDIO, logs the episode, and disconnects.
 * This is a fire-and-forget function designed to run safely outside the critical path.
 */
async function logEpisodeToBreeth(content, personaName) {
  if (!process.env.BREETH_API_KEY) {
    console.warn("BREETH_API_KEY not found. Skipping Breeth episode logging.");
    return;
  }

  const transport = new StdioClientTransport({
    command: "npx",
    args: [
      "-y",
      "mcp-remote",
      "https://mcp.thebreeth.com/mcp",
      "--header",
      `Authorization: Bearer ${process.env.BREETH_API_KEY}`
    ]
  });

  const client = new Client(
    { name: "vicodothon-agent", version: "1.0.0" },
    { capabilities: {} }
  );

  try {
    console.log(`[Breeth] Connecting to log episode for ${personaName}...`);
    // Aggressive timeout on connection
    await Promise.race([
      client.connect(transport),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Breeth Connection Timeout")), 10000))
    ]);

    // Format group_id to be a clean string without spaces (e.g. "tech_analyst")
    const groupId = personaName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20);

    const result = await client.callTool({
      name: "add_episode",
      arguments: {
        content: content,
        group_id: groupId,
        extract_intent: false
      }
    });

    console.log("[Breeth] Episode logged successfully. Task:", JSON.parse(result.content[0].text).cogram.task_id);

  } catch (error) {
    console.error("[Breeth] Failed to log episode (fallback to data.json preserved):", error.message);
  } finally {
    if (transport) {
      await transport.close();
    }
  }
}

module.exports = { logEpisodeToBreeth };
