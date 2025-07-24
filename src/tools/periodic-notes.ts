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
    "Modify specific sections of a daily, weekly, monthly, quarterly, or yearly note using heading, block reference, or frontmatter operations",
    {
      period: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]).describe("The period type for the note"),
      operation: z.enum(["append", "prepend", "replace"]).describe("Type of patch operation to perform"),
      targetType: z.enum(["heading", "block", "frontmatter"]).describe("Type of target (heading, block reference, or frontmatter field)"),
      target: z.string().describe("Target identifier (heading name, block reference ID, or frontmatter field name)"),
      content: z.string().describe("Content to append, prepend, or replace with"),
      createTargetIfMissing: z.boolean().optional().describe("Create the target if it doesn't exist (useful for frontmatter fields)"),
      date: z.string().optional().describe("Specific date for the note (ISO 8601 format YYYY-MM-DD). If not provided, uses current date"),
      vault: z.string().optional().describe("Name of the vault to use. If not provided, uses the active vault"),
    },
    async ({ period, operation, targetType, target, content, createTargetIfMissing, date, vault }) => {
      const patchData = {
        operation,
        targetType,
        target,
        content,
        createTargetIfMissing,
      };
      
      try {
        await obsidianClient.patchPeriodicNote(period, patchData, date, vault);
        return {
          content: [
            {
              type: "text",
              text: `Successfully patched ${period} note${date ? ` for ${date}` : ''} with ${operation} operation on ${targetType} "${target}"`,
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