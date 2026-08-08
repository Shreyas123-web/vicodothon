const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");

async function testBreeth() {
  const apiKey = 'ck_live_dsmMNIVP-eKxvOVPITjIjA28hRFvb_orCL3zLkukHEU';
  
  const transport = new StdioClientTransport({
    command: "npx",
    args: [
      "-y",
      "mcp-remote",
      "https://mcp.thebreeth.com/mcp",
      "--header",
      `Authorization: Bearer ${apiKey}`
    ]
  });

  const client = new Client(
    { name: "vicodothon-agent", version: "1.0.0" },
    { capabilities: {} }
  );

  try {
    console.log("Connecting to Breeth MCP over STDIO...");
    await client.connect(transport);
    console.log("Connected successfully!");

    console.log("Testing add_episode...");
    const result = await client.callTool({
      name: "add_episode",
      arguments: {
        content: "Vicodothon agent successfully established STDIO connection to Breeth API.",
        group_id: "vicodothon_test",
        extract_intent: false
      }
    });

    console.log("Result:", JSON.stringify(result, null, 2));

  } catch (error) {
    console.error("Breeth MCP Error:", error);
  } finally {
    // Graceful disconnect
    if (transport) {
      await transport.close();
    }
    process.exit(0);
  }
}

testBreeth();
