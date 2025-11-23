#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { initializeDocs } from "./docs.js";

const server = new McpServer({
  name: "Appwrite ORM mcp server",
  version: "0.0.1",
});

// Initialize documentation tools
initializeDocs(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Appwrite ORM Documentation MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});