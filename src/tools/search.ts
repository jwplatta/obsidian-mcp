import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { VaultManager } from "../vault-manager.js";
import { ObsidianClient } from "../client.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";

export function registerSearchTools(
  server: McpServer,
  vaultManager: VaultManager,
  obsidianClient: ObsidianClient
) {
  server.tool(
    "search_vault",
    "Advanced search using Dataview DQL or JsonLogic queries. Supports 'dataview' for TABLE-type Dataview queries, and 'jsonlogic' for JsonLogic queries with operators like 'glob' and 'regexp'.",
    {
      query: z.string().describe("The search query. For Dataview, use TABLE-type syntax. Refer to the dataview-examples resource for examples on how to write TABLE queries. For JsonLogic, use JSON string with operators."),
      queryType: z.enum(["dataview", "jsonlogic"]).optional().default("dataview").describe("Type of query: 'dataview' for Dataview DQL queries, 'jsonlogic' for JsonLogic queries"),
      vault: z.string().optional().describe("Optional vault name. Uses active vault if not specified."),
    },
    async ({ query, queryType = "dataview", vault }) => {
      try {
        let requestBody: Object | string;
        let contentType: string;

        if (queryType === "dataview") {
          requestBody = query;
          contentType = "application/vnd.olrapi.dataview.dql+txt";
        } else {
          try {
            requestBody = JSON.parse(query);
          } catch (error) {
            throw new Error(`Invalid JSON in JsonLogic query: ${error instanceof Error ? error.message : String(error)}`);
          }
          contentType = "application/vnd.olrapi.jsonlogic+json";
        }

        const results = await obsidianClient.request("/search/", {
          method: "POST",
          body: queryType === "dataview" ? requestBody : JSON.stringify(requestBody),
          headers: {
            "Content-Type": contentType
          },
          vault: vault,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                results,
                queryType,
                vault,
                resultCount: Array.isArray(results) ? results.length : "unknown"
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error executing search: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "simple_search",
    "Basic text search across all files in the vault. Searches file content and returns matching files with context.",
    {
      query: z.string().describe("The search term or phrase to find in vault files"),
      contextLength: z.number().int().min(0).optional().describe("Number of characters of context to include around matches (default determined by server)"),
      vault: z.string().optional().describe("Optional vault name. Uses active vault if not specified."),
    },
    async ({ query, contextLength, vault }) => {
      try {
        const results = await obsidianClient.simpleSearch(query, contextLength, vault);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                results,
                query,
                contextLength,
                vault,
                resultCount: Array.isArray(results) ? results.length : "unknown"
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error executing simple search: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}