import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const BASE_URL = "https://appwrite-orm.readthedocs.io/en/latest/";

async function fetchDocumentation(url: string): Promise<string> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            return `Failed to fetch documentation: ${response.status} ${response.statusText}`;
        }
        const html = await response.text();
        
        // Extract text content from HTML (basic extraction)
        // Remove script and style tags
        let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
        
        // Remove HTML tags
        text = text.replace(/<[^>]+>/g, ' ');
        
        // Decode HTML entities
        text = text.replace(/&nbsp;/g, ' ')
                   .replace(/&amp;/g, '&')
                   .replace(/&lt;/g, '<')
                   .replace(/&gt;/g, '>')
                   .replace(/&quot;/g, '"')
                   .replace(/&#39;/g, "'");
        
        // Clean up whitespace
        text = text.replace(/\s+/g, ' ').trim();
        
        return text;
    } catch (error) {
        return `Error fetching documentation: ${error instanceof Error ? error.message : String(error)}`;
    }
}

const serverDocs = {
    "setup": {route: "/server/setup/", description: "Setup the Appwrite ORM on the server side"},
    "CRUD": {route: "/server/crud-operations/", description: "CRUD operations (Create, Read, Update, Delete)"},
    "joins": {route: "/server/joins/", description: "Join requests (like SQL JOIN)"},
    "queries": {route: "/server/queries/", description: "Querying the database"},
    "bulk": {route: "/server/bulk-operations/", description: "Operating on multiple documents at once"},
    "migrations": {route: "/server/migrations/", description: "Migrations for SQL, Firebase, Text"},
    "listeners": {route: "/server/listeners/", description: "Listening to changes in the database"},
    "caching": {route: "/server/caching/", description: "Explaining the built in caching"}
}

const webDocs = {
    "setup": {route: "/web/setup/", description: "Setup the Appwrite ORM on the web/client side"},
    "CRUD": {route: "/web/crud-operations/", description: "CRUD operations (Create, Read, Update, Delete)"},
    "queries": {route: "/web/queries/", description: "Querying the database"},
    "caching": {route: "/web/caching/", description: "Explaining the built in caching"},
    "listeners": {route: "/web/listeners/", description: "Listening to changes in the database"},
    "development": {route: "/web/development-mode/", description: "Development mode - a local mode to save costs when developing"}
}

export function initializeDocs(server: McpServer){
    // Tool to list all available documentation routes
    server.tool(
        "list-docs",
        "List all available Appwrite ORM documentation routes",
        {},
        async () => {
            const allDocs = {
                baseUrl: BASE_URL,
                server: Object.entries(serverDocs).map(([key, value]) => ({
                    name: key,
                    url: BASE_URL + value.route,
                    description: value.description
                })),
                web: Object.entries(webDocs).map(([key, value]) => ({
                    name: key,
                    url: BASE_URL + value.route,
                    description: value.description
                }))
            };
            
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(allDocs, null, 2)
                    }
                ]
            };
        }
    );

    // Server documentation tools
    Object.entries(serverDocs).forEach(([key, value]) => {
        server.tool(
            `server-${key}`,
            value.description,
            {},
            async () => {
                const url = BASE_URL + value.route;
                const docContent = await fetchDocumentation(url);
                return {
                    content: [
                        {
                            type: "text",
                            text: `Documentation for Server ${key}:\n\nURL: ${url}\n\nDescription: ${value.description}\n\n--- DOCUMENTATION CONTENT ---\n\n${docContent}`
                        }
                    ]
                };
            }
        );
    });

    // Web documentation tools
    Object.entries(webDocs).forEach(([key, value]) => {
        server.tool(
            `web-${key}`,
            value.description,
            {},
            async () => {
                const url = BASE_URL + value.route;
                const docContent = await fetchDocumentation(url);
                return {
                    content: [
                        {
                            type: "text",
                            text: `Documentation for Web ${key}:\n\nURL: ${url}\n\nDescription: ${value.description}\n\n--- DOCUMENTATION CONTENT ---\n\n${docContent}`
                        }
                    ]
                };
            }
        );
    });

    // Tool to get documentation by category
    server.tool(
        "get-docs",
        "Get documentation URL for a specific category",
        {
            category: z.enum(["server", "web"]).describe("The category (server or web)"),
            topic: z.string().describe("The topic name (e.g., setup, CRUD, queries, etc.)")
        },
        async ({ category, topic }) => {
            const docs = category === "server" ? serverDocs : webDocs;
            const docEntry = docs[topic as keyof typeof docs];
            
            if (!docEntry) {
                const availableTopics = Object.keys(docs).join(", ");
                return {
                    content: [
                        {
                            type: "text",
                            text: `Topic "${topic}" not found in ${category} documentation.\n\nAvailable topics: ${availableTopics}`
                        }
                    ]
                };
            }
            
            const url = BASE_URL + docEntry.route;
            const docContent = await fetchDocumentation(url);
            return {
                content: [
                    {
                        type: "text",
                        text: `Documentation for ${category} ${topic}:\n\nURL: ${url}\n\nDescription: ${docEntry.description}\n\n--- DOCUMENTATION CONTENT ---\n\n${docContent}`
                    }
                ]
            };
        }
    );
}