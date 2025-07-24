import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ObsidianClient } from "../client.js";
import { z } from "zod";

export function registerActiveFileTools(
  server: McpServer,
  obsidianClient: ObsidianClient
) {
  server.tool(
    "get_active_file",
    "Retrieve the content of the currently active file in Obsidian",
    {
      vault: z.string().optional().describe("Optional vault name. Uses active vault if not specified."),
    },
    async ({ vault }) => {
      try {
        const content = await obsidianClient.getActiveFile(vault);
        return {
          content: [
            {
              type: "text",
              text: content,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error retrieving active file: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "append_to_active_file",
    "Append content to the currently active file in Obsidian",
    {
      content: z.string().describe("Content to append to the active file"),
      vault: z.string().optional().describe("Optional vault name. Uses active vault if not specified."),
    },
    async ({ content, vault }) => {
      try {
        await obsidianClient.appendToActiveFile(content, vault);
        return {
          content: [
            {
              type: "text",
              text: "Content successfully appended to active file",
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error appending to active file: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "replace_active_file",
    "Replace the entire content of the currently active file in Obsidian",
    {
      content: z.string().describe("New content for the active file"),
      vault: z.string().optional().describe("Optional vault name. Uses active vault if not specified."),
    },
    async ({ content, vault }) => {
      try {
        await obsidianClient.replaceActiveFile(content, vault);
        return {
          content: [
            {
              type: "text",
              text: "Active file content successfully replaced",
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error replacing active file: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "patch_active_file",
    "Apply selective modifications to the currently active file (insertions, deletions, replacements)",
    {
      insertions: z.array(z.object({
        line: z.number().int().min(0).describe("Line number to insert at (0-based)"),
        content: z.string().describe("Content to insert"),
      })).optional().describe("Lines to insert at specific positions"),
      deletions: z.array(z.object({
        startLine: z.number().int().min(0).describe("Start line (0-based, inclusive)"),
        endLine: z.number().int().min(0).describe("End line (0-based, inclusive)"),
      })).optional().describe("Line ranges to delete"),
      replacements: z.array(z.object({
        startLine: z.number().int().min(0).describe("Start line (0-based, inclusive)"),
        endLine: z.number().int().min(0).describe("End line (0-based, inclusive)"),
        content: z.string().describe("Replacement content"),
      })).optional().describe("Line ranges to replace with new content"),
      vault: z.string().optional().describe("Optional vault name. Uses active vault if not specified."),
    },
    async ({ insertions, deletions, replacements, vault }) => {
      try {
        const currentContent = await obsidianClient.getActiveFile(vault);
        const lines = currentContent.split('\n');

        // Apply operations in order: deletions, replacements, insertions
        if (deletions) {
          deletions.sort((a, b) => b.startLine - a.startLine);
          for (const deletion of deletions) {
            lines.splice(deletion.startLine, deletion.endLine - deletion.startLine + 1);
          }
        }

        if (replacements) {
          replacements.sort((a, b) => b.startLine - a.startLine);
          for (const replacement of replacements) {
            const replacementLines = replacement.content.split('\n');
            lines.splice(replacement.startLine, replacement.endLine - replacement.startLine + 1, ...replacementLines);
          }
        }

        if (insertions) {
          insertions.sort((a, b) => b.line - a.line);
          for (const insertion of insertions) {
            const insertionLines = insertion.content.split('\n');
            lines.splice(insertion.line, 0, ...insertionLines);
          }
        }

        const newContent = lines.join('\n');
        await obsidianClient.replaceActiveFile(newContent, vault);

        return {
          content: [
            {
              type: "text",
              text: "Active file successfully patched",
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error patching active file: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "delete_active_file",
    "Delete the currently active file in Obsidian",
    {
      vault: z.string().optional().describe("Optional vault name. Uses active vault if not specified."),
    },
    async ({ vault }) => {
      try {
        await obsidianClient.deleteActiveFile(vault);
        return {
          content: [
            {
              type: "text",
              text: "Active file successfully deleted",
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error deleting active file: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}