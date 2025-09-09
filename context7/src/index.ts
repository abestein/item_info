#!/usr/bin/env node

import dotenv from "dotenv";
dotenv.config();

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { searchLibraries, fetchLibraryDocumentation } from "./lib/api.js";
import { formatSearchResults } from "./lib/utils.js";
import { SearchResponse, ConversationMessage } from "./lib/types.js";
import { ConversationMemory } from "./lib/conversationMemory.js";
import { createServer } from "http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { Command } from "commander";
import { IncomingMessage } from "http";

/** Minimum allowed tokens for documentation retrieval */
const MINIMUM_TOKENS = 1000;
/** Default tokens when none specified */
const DEFAULT_TOKENS = 5000;
/** Default HTTP server port */
const DEFAULT_PORT = 3000;

// Parse CLI arguments using commander
const program = new Command()
  .option("--transport <stdio|http>", "transport type", "stdio")
  .option("--port <number>", "port for HTTP transport", DEFAULT_PORT.toString())
  .option("--api-key <key>", "API key for authentication")
  .allowUnknownOption() // let MCP Inspector / other wrappers pass through extra flags
  .parse(process.argv);

const cliOptions = program.opts<{
  transport: string;
  port: string;
  apiKey?: string;
}>();

// Validate transport option
const allowedTransports = ["stdio", "http"];
if (!allowedTransports.includes(cliOptions.transport)) {
  console.error(
    `Invalid --transport value: '${cliOptions.transport}'. Must be one of: stdio, http.`
  );
  process.exit(1);
}

// Transport configuration
const TRANSPORT_TYPE = (cliOptions.transport || "stdio") as "stdio" | "http";

// Disallow incompatible flags based on transport
const passedPortFlag = process.argv.includes("--port");
const passedApiKeyFlag = process.argv.includes("--api-key");

if (TRANSPORT_TYPE === "http" && passedApiKeyFlag) {
  console.error(
    "The --api-key flag is not allowed when using --transport http. Use header-based auth at the HTTP layer instead."
  );
  process.exit(1);
}

if (TRANSPORT_TYPE === "stdio" && passedPortFlag) {
  console.error("The --port flag is not allowed when using --transport stdio.");
  process.exit(1);
}

// HTTP port configuration
const CLI_PORT = (() => {
  const parsed = parseInt(cliOptions.port, 10);
  return isNaN(parsed) ? undefined : parsed;
})();

// Store SSE transports by session ID
const sseTransports: Record<string, SSEServerTransport> = {};

function getClientIp(req: IncomingMessage): string | undefined {
  // Check both possible header casings
  const forwardedFor = req.headers["x-forwarded-for"] || req.headers["X-Forwarded-For"];

  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    const ipList = ips.split(",").map((ip) => ip.trim());

    // Find the first public IP address
    for (const ip of ipList) {
      const plainIp = ip.replace(/^::ffff:/, "");
      if (
        !plainIp.startsWith("10.") &&
        !plainIp.startsWith("192.168.") &&
        !/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(plainIp)
      ) {
        return plainIp;
      }
    }
    // If all are private, use the first one
    return ipList[0].replace(/^::ffff:/, "");
  }

  // Fallback: use remote address, strip IPv6-mapped IPv4
  if (req.socket?.remoteAddress) {
    return req.socket.remoteAddress.replace(/^::ffff:/, "");
  }
  return undefined;
}

// Function to create a new server instance with all tools registered
function createServerInstance(clientIp?: string, apiKey?: string) {
  const server = new McpServer(
    {
      name: "Context7",
      version: "1.0.13",
    },
    {
      instructions:
        "Use this server to retrieve up-to-date documentation and code examples for any library. This server also supports conversation memory - it can remember and reference previous conversations to provide better context-aware responses.",
    }
  );

  // Initialize conversation memory (with error handling)
  let conversationMemory: ConversationMemory | null = null;
  try {
    conversationMemory = new ConversationMemory();
  } catch (error) {
    console.warn("Conversation memory disabled - Upstash credentials not configured:", error);
  }

  // Register Context7 tools
  server.registerTool(
    "resolve-library-id",
    {
      title: "Resolve Context7 Library ID",
      description: `Resolves a package/product name to a Context7-compatible library ID and returns a list of matching libraries.

You MUST call this function before 'get-library-docs' to obtain a valid Context7-compatible library ID UNLESS the user explicitly provides a library ID in the format '/org/project' or '/org/project/version' in their query.

Selection Process:
1. Analyze the query to understand what library/package the user is looking for
2. Return the most relevant match based on:
- Name similarity to the query (exact matches prioritized)
- Description relevance to the query's intent
- Documentation coverage (prioritize libraries with higher Code Snippet counts)
- Trust score (consider libraries with scores of 7-10 more authoritative)

Response Format:
- Return the selected library ID in a clearly marked section
- Provide a brief explanation for why this library was chosen
- If multiple good matches exist, acknowledge this but proceed with the most relevant one
- If no good matches exist, clearly state this and suggest query refinements

For ambiguous queries, request clarification before proceeding with a best-guess match.`,
      inputSchema: {
        libraryName: z
          .string()
          .describe("Library name to search for and retrieve a Context7-compatible library ID."),
        sessionId: z
          .string()
          .optional()
          .describe("Optional session ID to include conversation context in the search."),
      },
    },
    async ({ libraryName, sessionId }) => {
      // Get conversation context if sessionId is provided
      let conversationContext = "";
      if (sessionId && conversationMemory) {
        try {
          conversationContext = await conversationMemory.getRecentContext(sessionId, 5);
        } catch (error) {
          console.warn("Failed to retrieve conversation context:", error);
        }
      }

      const searchResponse: SearchResponse = await searchLibraries(libraryName, clientIp, apiKey);

      if (!searchResponse.results || searchResponse.results.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: searchResponse.error
                ? searchResponse.error
                : "Failed to retrieve library documentation data from Context7",
            },
          ],
        };
      }

      const resultsText = formatSearchResults(searchResponse);

      return {
        content: [
          {
            type: "text",
            text: `${conversationContext}Available Libraries (top matches):

Each result includes:
- Library ID: Context7-compatible identifier (format: /org/project)
- Name: Library or package name
- Description: Short summary
- Code Snippets: Number of available code examples
- Trust Score: Authority indicator
- Versions: List of versions if available. Use one of those versions if and only if the user explicitly provides a version in their query.

For best results, select libraries based on name match, trust score, snippet coverage, and relevance to your use case.

----------

${resultsText}`,
          },
        ],
      };
    }
  );

  server.registerTool(
    "get-library-docs",
    {
      title: "Get Library Docs",
      description:
        "Fetches up-to-date documentation for a library. You must call 'resolve-library-id' first to obtain the exact Context7-compatible library ID required to use this tool, UNLESS the user explicitly provides a library ID in the format '/org/project' or '/org/project/version' in their query.",
      inputSchema: {
        context7CompatibleLibraryID: z
          .string()
          .describe(
            "Exact Context7-compatible library ID (e.g., '/mongodb/docs', '/vercel/next.js', '/supabase/supabase', '/vercel/next.js/v14.3.0-canary.87') retrieved from 'resolve-library-id' or directly from user query in the format '/org/project' or '/org/project/version'."
          ),
        topic: z
          .string()
          .optional()
          .describe("Topic to focus documentation on (e.g., 'hooks', 'routing')."),
        tokens: z
          .preprocess((val) => (typeof val === "string" ? Number(val) : val), z.number())
          .transform((val) => (val < MINIMUM_TOKENS ? MINIMUM_TOKENS : val))
          .optional()
          .describe(
            `Maximum number of tokens of documentation to retrieve (default: ${DEFAULT_TOKENS}). Higher values provide more context but consume more tokens.`
          ),
        sessionId: z
          .string()
          .optional()
          .describe("Optional session ID to include conversation context in the documentation."),
      },
    },
    async ({ context7CompatibleLibraryID, tokens = DEFAULT_TOKENS, topic = "", sessionId }) => {
      // Get conversation context if sessionId is provided
      let conversationContext = "";
      if (sessionId && conversationMemory) {
        try {
          conversationContext = await conversationMemory.getRecentContext(sessionId, 8);
        } catch (error) {
          console.warn("Failed to retrieve conversation context:", error);
        }
      }
      const fetchDocsResponse = await fetchLibraryDocumentation(
        context7CompatibleLibraryID,
        {
          tokens,
          topic,
        },
        clientIp,
        apiKey
      );

      if (!fetchDocsResponse) {
        return {
          content: [
            {
              type: "text",
              text: "Documentation not found or not finalized for this library. This might have happened because you used an invalid Context7-compatible library ID. To get a valid Context7-compatible library ID, use the 'resolve-library-id' with the package name you wish to retrieve documentation for.",
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `${conversationContext}${fetchDocsResponse}`,
          },
        ],
      };
    }
  );

  // Add conversation memory tools (only if conversation memory is available)
  if (conversationMemory) {
    server.registerTool(
      "save-conversation",
      {
        title: "Save Conversation",
        description: "Save a conversation message to memory for future reference and context-aware responses.",
        inputSchema: {
          sessionId: z
            .string()
            .describe("Session ID to identify the conversation."),
          message: z
            .object({
              role: z.enum(["user", "assistant", "system"]).describe("The role of the message sender."),
              content: z.string().describe("The content of the message."),
            })
            .describe("The message to save."),
          metadata: z
            .object({
              userId: z.string().optional(),
              projectContext: z.string().optional(),
              tags: z.array(z.string()).optional(),
            })
            .optional()
            .describe("Optional metadata to associate with the conversation."),
        },
      },
      async ({ sessionId, message, metadata }) => {
        try {
          const conversationMessage: ConversationMessage = {
            role: message.role,
            content: message.content,
            timestamp: Date.now(),
          };

          await conversationMemory!.addMessage(sessionId, conversationMessage, metadata);
          
          return {
            content: [
              {
                type: "text",
                text: `Successfully saved message to conversation session: ${sessionId}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Failed to save conversation: ${error}`,
              },
            ],
          };
        }
      }
    );

    server.registerTool(
      "get-conversation-history",
      {
        title: "Get Conversation History",
        description: "Retrieve conversation history for a specific session.",
        inputSchema: {
          sessionId: z
            .string()
            .describe("Session ID to retrieve conversation history for."),
          maxMessages: z
            .number()
            .optional()
            .default(20)
            .describe("Maximum number of recent messages to retrieve (default: 20)."),
        },
      },
      async ({ sessionId, maxMessages = 20 }) => {
        try {
          const session = await conversationMemory!.getConversation(sessionId);
          
          if (!session) {
            return {
              content: [
                {
                  type: "text",
                  text: `No conversation found for session: ${sessionId}`,
                },
              ],
            };
          }

          const recentMessages = session.messages.slice(-maxMessages);
          const formattedHistory = recentMessages
            .map(msg => {
              const timestamp = new Date(msg.timestamp).toISOString();
              return `[${timestamp}] ${msg.role}: ${msg.content}`;
            })
            .join('\n');

          return {
            content: [
              {
                type: "text",
                text: `Conversation History for session ${sessionId}:
Total messages: ${session.messages.length}
Last updated: ${new Date(session.lastUpdated).toISOString()}

Recent Messages (${recentMessages.length}):
${formattedHistory}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Failed to retrieve conversation history: ${error}`,
              },
            ],
          };
        }
      }
    );

    server.registerTool(
      "search-conversation",
      {
        title: "Search Conversation",
        description: "Search through conversation history for specific content.",
        inputSchema: {
          sessionId: z
            .string()
            .describe("Session ID to search within."),
          searchTerm: z
            .string()
            .describe("Term to search for in conversation content."),
        },
      },
      async ({ sessionId, searchTerm }) => {
        try {
          const matches = await conversationMemory!.searchConversations(sessionId, searchTerm);
          
          if (matches.length === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: `No messages found containing "${searchTerm}" in session: ${sessionId}`,
                },
              ],
            };
          }

          const formattedMatches = matches
            .map(msg => {
              const timestamp = new Date(msg.timestamp).toISOString();
              return `[${timestamp}] ${msg.role}: ${msg.content}`;
            })
            .join('\n\n');

          return {
            content: [
              {
                type: "text",
                text: `Found ${matches.length} messages containing "${searchTerm}":

${formattedMatches}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Failed to search conversation: ${error}`,
              },
            ],
          };
        }
      }
    );

    server.registerTool(
      "get-conversation-stats",
      {
        title: "Get Conversation Stats",
        description: "Get statistics about a conversation session.",
        inputSchema: {
          sessionId: z
            .string()
            .describe("Session ID to get statistics for."),
        },
      },
      async ({ sessionId }) => {
        try {
          const stats = await conversationMemory!.getConversationStats(sessionId);
          
          if (!stats) {
            return {
              content: [
                {
                  type: "text",
                  text: `No conversation found for session: ${sessionId}`,
                },
              ],
            };
          }

          const sessionAgeHours = Math.round(stats.sessionAge / (1000 * 60 * 60));
          const lastActivityHours = Math.round((Date.now() - stats.lastActivity) / (1000 * 60 * 60));

          return {
            content: [
              {
                type: "text",
                text: `Conversation Statistics for session ${sessionId}:
- Total messages: ${stats.messageCount}
- Session age: ${sessionAgeHours} hours
- Last activity: ${lastActivityHours} hours ago
- Last updated: ${new Date(stats.lastActivity).toISOString()}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Failed to get conversation stats: ${error}`,
              },
            ],
          };
        }
      }
    );
  }

  return server;
}

async function main() {
  const transportType = TRANSPORT_TYPE;

  if (transportType === "http") {
    // Get initial port from environment or use default
    const initialPort = CLI_PORT ?? DEFAULT_PORT;
    // Keep track of which port we end up using
    let actualPort = initialPort;
    const httpServer = createServer(async (req, res) => {
      const url = new URL(req.url || "", `http://${req.headers.host}`).pathname;

      // Set CORS headers for all responses
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS,DELETE");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, MCP-Session-Id, MCP-Protocol-Version, X-Context7-API-Key, Context7-API-Key, X-API-Key, Authorization"
      );
      res.setHeader("Access-Control-Expose-Headers", "MCP-Session-Id");

      // Handle preflight OPTIONS requests
      if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
      }

      // Function to extract header value safely, handling both string and string[] cases
      const extractHeaderValue = (value: string | string[] | undefined): string | undefined => {
        if (!value) return undefined;
        return typeof value === "string" ? value : value[0];
      };

      // Extract Authorization header and remove Bearer prefix if present
      const extractBearerToken = (
        authHeader: string | string[] | undefined
      ): string | undefined => {
        const header = extractHeaderValue(authHeader);
        if (!header) return undefined;

        // If it starts with 'Bearer ', remove that prefix
        if (header.startsWith("Bearer ")) {
          return header.substring(7).trim();
        }

        // Otherwise return the raw value
        return header;
      };

      // Check headers in order of preference
      const apiKey =
        extractBearerToken(req.headers.authorization) ||
        extractHeaderValue(req.headers["Context7-API-Key"]) ||
        extractHeaderValue(req.headers["X-API-Key"]) ||
        extractHeaderValue(req.headers["context7-api-key"]) ||
        extractHeaderValue(req.headers["x-api-key"]) ||
        extractHeaderValue(req.headers["Context7_API_Key"]) ||
        extractHeaderValue(req.headers["X_API_Key"]) ||
        extractHeaderValue(req.headers["context7_api_key"]) ||
        extractHeaderValue(req.headers["x_api_key"]);

      try {
        // Extract client IP address using socket remote address (most reliable)
        const clientIp = getClientIp(req);

        // Create new server instance for each request
        const requestServer = createServerInstance(clientIp, apiKey);

        if (url === "/mcp") {
          const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
          });
          await requestServer.connect(transport);
          await transport.handleRequest(req, res);
        } else if (url === "/sse" && req.method === "GET") {
          // Create new SSE transport for GET request
          const sseTransport = new SSEServerTransport("/messages", res);
          // Store the transport by session ID
          sseTransports[sseTransport.sessionId] = sseTransport;
          // Clean up transport when connection closes
          res.on("close", () => {
            delete sseTransports[sseTransport.sessionId];
          });
          await requestServer.connect(sseTransport);
        } else if (url === "/messages" && req.method === "POST") {
          // Get session ID from query parameters
          const sessionId =
            new URL(req.url || "", `http://${req.headers.host}`).searchParams.get("sessionId") ??
            "";

          if (!sessionId) {
            res.writeHead(400);
            res.end("Missing sessionId parameter");
            return;
          }

          // Get existing transport for this session
          const sseTransport = sseTransports[sessionId];
          if (!sseTransport) {
            res.writeHead(400);
            res.end(`No transport found for sessionId: ${sessionId}`);
            return;
          }

          // Handle the POST message with the existing transport
          await sseTransport.handlePostMessage(req, res);
        } else if (url === "/ping") {
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end("pong");
        } else {
          res.writeHead(404);
          res.end("Not found");
        }
      } catch (error) {
        console.error("Error handling request:", error);
        if (!res.headersSent) {
          res.writeHead(500);
          res.end("Internal Server Error");
        }
      }
    });

    // Function to attempt server listen with port fallback
    const startServer = (port: number, maxAttempts = 10) => {
      httpServer.once("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE" && port < initialPort + maxAttempts) {
          console.warn(`Port ${port} is in use, trying port ${port + 1}...`);
          startServer(port + 1, maxAttempts);
        } else {
          console.error(`Failed to start server: ${err.message}`);
          process.exit(1);
        }
      });

      httpServer.listen(port, () => {
        actualPort = port;
        console.error(
          `Context7 Documentation MCP Server running on ${transportType.toUpperCase()} at http://localhost:${actualPort}/mcp with SSE endpoint at /sse`
        );
      });
    };

    // Start the server with initial port
    startServer(initialPort);
  } else {
    // Stdio transport - this is already stateless by nature
    const server = createServerInstance(undefined, cliOptions.apiKey);
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Context7 Documentation MCP Server running on stdio");
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
