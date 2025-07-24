import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ObsidianClient } from "../client.js";
import { z } from "zod";

/**
 * Register system tools with the MCP server
 */
export function registerSystemTools(
  server: McpServer,
  obsidianClient: ObsidianClient
): void {
  
  server.tool(
    "get_server_info",
    "Get basic server status and details from the Obsidian Local REST API",
    {
      vault: z.string().optional().describe("Optional vault name. Uses active vault if not specified."),
    },
    async ({ vault }) => {
      try {
        const serverInfo = await obsidianClient.getServerInfo(vault);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                serverInfo,
                vault,
                timestamp: new Date().toISOString(),
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting server info: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "get_api_certificate",
    "Retrieve the API certificate from the Obsidian Local REST API server",
    {
      vault: z.string().optional().describe("Optional vault name. Uses active vault if not specified."),
    },
    async ({ vault }) => {
      try {
        const certificate = await obsidianClient.request("/obsidian-local-rest-api.crt", { vault });
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                certificate,
                vault,
                timestamp: new Date().toISOString(),
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting API certificate: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}