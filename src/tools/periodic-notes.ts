import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ObsidianClient } from "../client.js";
import { z } from "zod";

/**
 * Register periodic notes tools with the MCP server
 */
export function registerPeriodicNotesTools(
  server: McpServer,
  obsidianClient: ObsidianClient
) {
  server.tool(
    "get_periodic_note",
    "Retrieve content from a daily, weekly, monthly, quarterly, or yearly note",
    {
      period: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]).describe("The period type for the note"),
      date: z.string().optional().describe("Specific date for the note (ISO 8601 format YYYY-MM-DD). If not provided, uses current date"),
      vault: z.string().optional().describe("Name of the vault to use. If not provided, uses the active vault"),
    },
    async ({ period, date, vault }) => {
      try {
        const content = await obsidianClient.getPeriodicNote(period, date, vault);
        return {
          content: [
            {
              type: "text",
              text: `Successfully retrieved ${period} note${date ? ` for ${date}` : ''}:\n\n${content}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to retrieve ${period} note: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "append_to_periodic_note",
    "Append content to a daily, weekly, monthly, quarterly, or yearly note",
    {
      period: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]).describe("The period type for the note"),
      content: z.string().describe("Content to append to the periodic note"),
      date: z.string().optional().describe("Specific date for the note (ISO 8601 format YYYY-MM-DD). If not provided, uses current date"),
      vault: z.string().optional().describe("Name of the vault to use. If not provided, uses the active vault"),
    },
    async ({ period, content, date, vault }) => {
      try {
        await obsidianClient.appendToPeriodicNote(period, content, date, vault);
        return {
          content: [
            {
              type: "text",
              text: `Successfully appended content to ${period} note${date ? ` for ${date}` : ''}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to append to ${period} note: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "replace_periodic_note",
    "Replace entire content of a daily, weekly, monthly, quarterly, or yearly note",
    {
      period: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]).describe("The period type for the note"),
      content: z.string().describe("New content to replace the entire periodic note with"),
      date: z.string().optional().describe("Specific date for the note (ISO 8601 format YYYY-MM-DD). If not provided, uses current date"),
      vault: z.string().optional().describe("Name of the vault to use. If not provided, uses the active vault"),
    },
    async ({ period, content, date, vault }) => {
      try {
        await obsidianClient.replacePeriodicNote(period, content, date, vault);
        return {
          content: [
            {
              type: "text",
              text: `Successfully replaced ${period} note content${date ? ` for ${date}` : ''}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to replace ${period} note: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "patch_periodic_note",
    "Modify specific sections of a daily, weekly, monthly, quarterly, or yearly note using line-based operations",
    {
      period: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]).describe("The period type for the note"),
      operation: z.enum(["insert", "replace", "delete"]).describe("Type of patch operation to perform"),
      startLine: z.number().optional().describe("Starting line number for the operation (0-based)"),
      endLine: z.number().optional().describe("Ending line number for replace/delete operations (0-based, exclusive)"),
      content: z.string().optional().describe("Content to insert or replace with (required for insert/replace operations)"),
      date: z.string().optional().describe("Specific date for the note (ISO 8601 format YYYY-MM-DD). If not provided, uses current date"),
      vault: z.string().optional().describe("Name of the vault to use. If not provided, uses the active vault"),
    },
    async ({ period, operation, startLine, endLine, content, date, vault }) => {
      const patchData = {
        operation,
        startLine,
        endLine,
        content,
      };
      
      try {
        await obsidianClient.patchPeriodicNote(period, patchData, date, vault);
        return {
          content: [
            {
              type: "text",
              text: `Successfully patched ${period} note${date ? ` for ${date}` : ''} with ${operation} operation`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to patch ${period} note: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "delete_periodic_note",
    "Delete a daily, weekly, monthly, quarterly, or yearly note",
    {
      period: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]).describe("The period type for the note"),
      date: z.string().optional().describe("Specific date for the note (ISO 8601 format YYYY-MM-DD). If not provided, uses current date"),
      vault: z.string().optional().describe("Name of the vault to use. If not provided, uses the active vault"),
    },
    async ({ period, date, vault }) => {
      try {
        await obsidianClient.deletePeriodicNote(period, date, vault);
        return {
          content: [
            {
              type: "text",
              text: `Successfully deleted ${period} note${date ? ` for ${date}` : ''}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to delete ${period} note: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}