import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ObsidianClient } from "../client.js";
import { z } from "zod";

/**
 * Register navigation tools
 */
export function registerNavigationTools(
  server: McpServer,
  obsidianClient: ObsidianClient
) {
  server.tool(
    "open_file",
    "Open a specific file in the Obsidian interface",
    {
      path: z.string().min(1).describe("Path to the file to open relative to vault root"),
      newLeaf: z.boolean().optional().default(false).describe("Whether to open the file in a new leaf/tab (defaults to false)"),
      vault: z.string().optional().describe("Optional vault name to use (defaults to active vault)"),
    },
    async ({ path, newLeaf, vault }) => {
      try {
        await obsidianClient.openFile(path, newLeaf, vault);
        return {
          content: [
            {
              type: "text",
              text: `Successfully opened file: ${path}${newLeaf ? " in new leaf" : ""}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error opening file: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}