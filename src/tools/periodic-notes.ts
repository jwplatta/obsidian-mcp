import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ObsidianClient } from "../client.js";
import {
  PeriodicNoteArgsSchema,
  PeriodicNoteContentArgsSchema,
  PeriodicNotePatchArgsSchema,
} from "../schemas.js";

/**
 * Get periodic note content
 */
export function createGetPeriodicNoteTool(client: ObsidianClient): Tool {
  return {
    name: "get_periodic_note",
    description: "Retrieve content from a daily, weekly, monthly, quarterly, or yearly note",
    inputSchema: {
      type: "object",
      properties: {
        period: {
          type: "string",
          enum: ["daily", "weekly", "monthly", "quarterly", "yearly"],
          description: "The period type for the note",
        },
        date: {
          type: "string",
          description: "Specific date for the note (ISO 8601 format YYYY-MM-DD). If not provided, uses current date",
        },
        vault: {
          type: "string",
          description: "Name of the vault to use. If not provided, uses the active vault",
        },
      },
      required: ["period"],
    },
    async handler(args) {
      const parsed = PeriodicNoteArgsSchema.parse(args);

      try {
        const content = await client.getPeriodicNote(parsed.period, parsed.date, parsed.vault);
        return {
          content: [
            {
              type: "text",
              text: `Successfully retrieved ${parsed.period} note${parsed.date ? ` for ${parsed.date}` : ''}:\n\n${content}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to retrieve ${parsed.period} note: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  };
}

/**
 * Append content to periodic note
 */
export function createAppendToPeriodicNoteTool(client: ObsidianClient): Tool {
  return {
    name: "append_to_periodic_note",
    description: "Append content to a daily, weekly, monthly, quarterly, or yearly note",
    inputSchema: {
      type: "object",
      properties: {
        period: {
          type: "string",
          enum: ["daily", "weekly", "monthly", "quarterly", "yearly"],
          description: "The period type for the note",
        },
        content: {
          type: "string",
          description: "Content to append to the periodic note",
        },
        date: {
          type: "string",
          description: "Specific date for the note (ISO 8601 format YYYY-MM-DD). If not provided, uses current date",
        },
        vault: {
          type: "string",
          description: "Name of the vault to use. If not provided, uses the active vault",
        },
      },
      required: ["period", "content"],
    },
    async handler(args) {
      const parsed = PeriodicNoteContentArgsSchema.parse(args);

      try {
        await client.appendToPeriodicNote(parsed.period, parsed.content, parsed.date, parsed.vault);
        return {
          content: [
            {
              type: "text",
              text: `Successfully appended content to ${parsed.period} note${parsed.date ? ` for ${parsed.date}` : ''}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to append to ${parsed.period} note: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  };
}

/**
 * Replace periodic note content
 */
export function createReplacePeriodicNoteTool(client: ObsidianClient): Tool {
  return {
    name: "replace_periodic_note",
    description: "Replace entire content of a daily, weekly, monthly, quarterly, or yearly note",
    inputSchema: {
      type: "object",
      properties: {
        period: {
          type: "string",
          enum: ["daily", "weekly", "monthly", "quarterly", "yearly"],
          description: "The period type for the note",
        },
        content: {
          type: "string",
          description: "New content to replace the entire periodic note with",
        },
        date: {
          type: "string",
          description: "Specific date for the note (ISO 8601 format YYYY-MM-DD). If not provided, uses current date",
        },
        vault: {
          type: "string",
          description: "Name of the vault to use. If not provided, uses the active vault",
        },
      },
      required: ["period", "content"],
    },
    async handler(args) {
      const parsed = PeriodicNoteContentArgsSchema.parse(args);

      try {
        await client.replacePeriodicNote(parsed.period, parsed.content, parsed.date, parsed.vault);
        return {
          content: [
            {
              type: "text",
              text: `Successfully replaced ${parsed.period} note content${parsed.date ? ` for ${parsed.date}` : ''}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to replace ${parsed.period} note: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  };
}

/**
 * Patch periodic note with specific line operations
 */
export function createPatchPeriodicNoteTool(client: ObsidianClient): Tool {
  return {
    name: "patch_periodic_note",
    description: "Modify specific sections of a daily, weekly, monthly, quarterly, or yearly note using line-based operations",
    inputSchema: {
      type: "object",
      properties: {
        period: {
          type: "string",
          enum: ["daily", "weekly", "monthly", "quarterly", "yearly"],
          description: "The period type for the note",
        },
        operation: {
          type: "string",
          enum: ["insert", "replace", "delete"],
          description: "Type of patch operation to perform",
        },
        startLine: {
          type: "number",
          description: "Starting line number for the operation (0-based)",
        },
        endLine: {
          type: "number",
          description: "Ending line number for replace/delete operations (0-based, exclusive)",
        },
        content: {
          type: "string",
          description: "Content to insert or replace with (required for insert/replace operations)",
        },
        date: {
          type: "string",
          description: "Specific date for the note (ISO 8601 format YYYY-MM-DD). If not provided, uses current date",
        },
        vault: {
          type: "string",
          description: "Name of the vault to use. If not provided, uses the active vault",
        },
      },
      required: ["period", "operation"],
    },
    async handler(args) {
      const parsed = PeriodicNotePatchArgsSchema.parse(args);

      const patchData = {
        operation: parsed.operation,
        startLine: parsed.startLine,
        endLine: parsed.endLine,
        content: parsed.content,
      };

      try {
        await client.patchPeriodicNote(parsed.period, patchData, parsed.date, parsed.vault);
        return {
          content: [
            {
              type: "text",
              text: `Successfully patched ${parsed.period} note${parsed.date ? ` for ${parsed.date}` : ''} with ${parsed.operation} operation`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to patch ${parsed.period} note: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  };
}

/**
 * Delete periodic note
 */
export function createDeletePeriodicNoteTool(client: ObsidianClient): Tool {
  return {
    name: "delete_periodic_note",
    description: "Delete a daily, weekly, monthly, quarterly, or yearly note",
    inputSchema: {
      type: "object",
      properties: {
        period: {
          type: "string",
          enum: ["daily", "weekly", "monthly", "quarterly", "yearly"],
          description: "The period type for the note",
        },
        date: {
          type: "string",
          description: "Specific date for the note (ISO 8601 format YYYY-MM-DD). If not provided, uses current date",
        },
        vault: {
          type: "string",
          description: "Name of the vault to use. If not provided, uses the active vault",
        },
      },
      required: ["period"],
    },
    async handler(args) {
      const parsed = PeriodicNoteArgsSchema.parse(args);

      try {
        await client.deletePeriodicNote(parsed.period, parsed.date, parsed.vault);
        return {
          content: [
            {
              type: "text",
              text: `Successfully deleted ${parsed.period} note${parsed.date ? ` for ${parsed.date}` : ''}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to delete ${parsed.period} note: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  };
}

/**
 * Register periodic notes tools with the MCP server
 */
export function registerPeriodicNotesTools(
  server: McpServer,
  client: ObsidianClient
): void {
  const getPeriodicNoteTool = createGetPeriodicNoteTool(client);
  const appendTool = createAppendToPeriodicNoteTool(client);
  const replaceTool = createReplacePeriodicNoteTool(client);
  const patchTool = createPatchPeriodicNoteTool(client);
  const deleteTool = createDeletePeriodicNoteTool(client);

  server.tool(
    getPeriodicNoteTool.name,
    getPeriodicNoteTool.description,
    getPeriodicNoteTool.inputSchema,
    getPeriodicNoteTool.handler
  );

  server.tool(
    appendTool.name,
    appendTool.description,
    appendTool.inputSchema,
    appendTool.handler
  );

  server.tool(
    replaceTool.name,
    replaceTool.description,
    replaceTool.inputSchema,
    replaceTool.handler
  );

  server.tool(
    patchTool.name,
    patchTool.description,
    patchTool.inputSchema,
    patchTool.handler
  );

  server.tool(
    deleteTool.name,
    deleteTool.description,
    deleteTool.inputSchema,
    deleteTool.handler
  );
}