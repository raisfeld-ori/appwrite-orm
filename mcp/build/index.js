#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const docs_js_1 = require("./docs.js");
const server = new mcp_js_1.McpServer({
    name: "Appwrite ORM mcp server",
    version: "0.0.1",
});
// Initialize documentation tools
(0, docs_js_1.initializeDocs)(server);
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error("Appwrite ORM Documentation MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
