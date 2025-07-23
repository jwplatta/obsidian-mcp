import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { VaultManager } from "../vault-manager.js";
import { ObsidianClient } from "../client.js";
import { z } from "zod";

/**
 * Register vault directory management tools
 */
export function registerVaultDirectoryTools(
  server: McpServer,
  vaultManager: VaultManager,
  obsidianClient: ObsidianClient
) {
  server.tool(
    "list_vault_files",
    "List files in the vault root or a specific directory path",
    {
      path: z.string().optional().default("").describe("Directory path to list (defaults to vault root)"),
      vault: z.string().optional().describe("Optional vault name to use (defaults to active vault)"),
    },
    async ({ path, vault }) => {
      try {
        const files = await obsidianClient.listDirectory(path, vault);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                path: path || "/",
                files: files,
                count: files.length,
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error listing vault files: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "list_directory",
    "List contents of a specific directory in the vault",
    {
      path: z.string().optional().default("").describe("Directory path to list (defaults to vault root)"),
      vault: z.string().optional().describe("Optional vault name to use (defaults to active vault)"),
    },
    async ({ path, vault }) => {
      try {
        const files = await obsidianClient.listDirectory(path, vault);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                directory: path || "/",
                contents: files,
                count: files.length,
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error listing directory: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}