import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ObsidianClient } from "../client.js";
import { z } from "zod";

export function registerCommandTools(
  server: McpServer,
  obsidianClient: ObsidianClient
) {
  server.tool(
    "list_commands",
    "List all available Obsidian commands in the vault",
    {
      vault: z.string().optional().describe("Optional vault name. Uses active vault if not specified."),
    },
    async ({ vault }) => {
      try {
        const commands = await obsidianClient.listCommands(vault);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(commands, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error retrieving commands: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "execute_command",
    "Execute a specific Obsidian command by its ID",
    {
      commandId: z.string().describe("The ID of the command to execute (e.g., 'editor:save-file')"),
      vault: z.string().optional().describe("Optional vault name. Uses active vault if not specified."),
    },
    async ({ commandId, vault }) => {
      try {
        const result = await obsidianClient.executeCommand(commandId, vault);
        return {
          content: [
            {
              type: "text",
              text: `Command '${commandId}' executed successfully${result ? `: ${JSON.stringify(result)}` : ''}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error executing command '${commandId}': ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}