import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import fs from "fs/promises";
import path from "path";
import { logger } from "../logger.js";

export function registerDataviewExamplesResource(server: McpServer) {
  logger.debug("Registering dataview-query-examples resource...");
  
  server.resource(
    "dataview-query-examples",
    "file://dataview-query-examples/",
    {
      name: "Dataview Query Examples",
      description: "Comprehensive examples of Dataview queries for the search_vault tool",
      mimeType: "text/markdown"
    },
    async () => {
      logger.debug("Resource read callback called for dataview-query-examples");
      
      try {
        // The file should be in the build/resources directory after build
        const currentDir = path.dirname(new URL(import.meta.url).pathname);
        const examplesPath = path.join(currentDir, "dataview-query-examples.md");
        
        logger.debug(`Looking for dataview examples at: ${examplesPath}`);
        
        const content = await fs.readFile(examplesPath, "utf-8");
        
        logger.debug(`Successfully read dataview examples, content length: ${content.length}`);
        
        return {
          contents: [
            {
              uri: "file://dataview-query-examples/",
              text: content,
              mimeType: "text/markdown"
            },
          ],
        };
      } catch (error) {
        logger.error("Error reading dataview examples", { error: error instanceof Error ? error.message : String(error) });
        
        return {
          contents: [
            {
              uri: "file://dataview-query-examples/",
              text: `Error reading Dataview examples: ${error instanceof Error ? error.message : String(error)}`,
              mimeType: "text/plain"
            },
          ],
        };
      }
    }
  );
  
  logger.debug("Dataview-query-examples resource registered successfully");
}