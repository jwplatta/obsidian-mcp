import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { VaultManager } from "../vault-manager.js";
import { ObsidianClient } from "../client.js";
import { z } from "zod";

/**
 * Register vault file management tools
 */
export function registerVaultFileTools(
  server: McpServer,
  vaultManager: VaultManager,
  obsidianClient: ObsidianClient
) {
  server.tool(
    "get_file",
    "Retrieve content of a specific file from the vault by path",
    {
      path: z.string().min(1).describe("Path to the file relative to vault root"),
      vault: z.string().optional().describe("Optional vault name to use (defaults to active vault)"),
    },
    async ({ path, vault }) => {
      try {
        const content = await obsidianClient.getFile(path, vault);
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
              text: `Error getting file: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "create_file",
    "Create a new file with specified content (or replace existing)",
    {
      path: z.string().min(1).describe("Path where the file should be created"),
      content: z.string().describe("Content to write to the file"),
      vault: z.string().optional().describe("Optional vault name to use (defaults to active vault)"),
    },
    async ({ path, content, vault }) => {
      try {
        await obsidianClient.createFile(path, content, vault);
        return {
          content: [
            {
              type: "text",
              text: `Successfully created file: ${path}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error creating file: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "append_to_file",
    "Append content to an existing file",
    {
      path: z.string().min(1).describe("Path to the file to append to"),
      content: z.string().min(1).describe("Content to append to the file"),
      vault: z.string().optional().describe("Optional vault name to use (defaults to active vault)"),
    },
    async ({ path, content, vault }) => {
      try {
        await obsidianClient.appendToFile(path, content, vault);
        return {
          content: [
            {
              type: "text",
              text: `Successfully appended content to file: ${path}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error appending to file: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "replace_file",
    "Replace entire content of an existing file",
    {
      path: z.string().min(1).describe("Path to the file to replace"),
      content: z.string().describe("New content for the file"),
      vault: z.string().optional().describe("Optional vault name to use (defaults to active vault)"),
    },
    async ({ path, content, vault }) => {
      try {
        await obsidianClient.createFile(path, content, vault);
        return {
          content: [
            {
              type: "text",
              text: `Successfully replaced content in file: ${path}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error replacing file content: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "patch_file",
    "Apply specific line-based modifications to a file",
    {
      path: z.string().min(1).describe("Path to the file to patch"),
      insertions: z.array(z.object({
        line: z.number().int().min(0).describe("Line number to insert at (0-based)"),
        content: z.string().describe("Content to insert"),
      })).optional().describe("Array of line insertions"),
      deletions: z.array(z.object({
        startLine: z.number().int().min(0).describe("Start line to delete (0-based, inclusive)"),
        endLine: z.number().int().min(0).describe("End line to delete (0-based, inclusive)"),
      })).optional().describe("Array of line deletions"),
      replacements: z.array(z.object({
        startLine: z.number().int().min(0).describe("Start line to replace (0-based, inclusive)"),
        endLine: z.number().int().min(0).describe("End line to replace (0-based, inclusive)"),
        content: z.string().describe("New content for the lines"),
      })).optional().describe("Array of line replacements"),
      vault: z.string().optional().describe("Optional vault name to use (defaults to active vault)"),
    },
    async ({ path, insertions, deletions, replacements, vault }) => {
      try {
        const currentContent = await obsidianClient.getFile(path, vault);
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
        await obsidianClient.createFile(path, newContent, vault);

        return {
          content: [
            {
              type: "text",
              text: `Successfully patched file: ${path}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error patching file: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "delete_file",
    "Delete a specific file from the vault",
    {
      path: z.string().min(1).describe("Path to the file to delete"),
      vault: z.string().optional().describe("Optional vault name to use (defaults to active vault)"),
    },
    async ({ path, vault }) => {
      try {
        await obsidianClient.deleteFile(path, vault);
        return {
          content: [
            {
              type: "text",
              text: `Successfully deleted file: ${path}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error deleting file: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}