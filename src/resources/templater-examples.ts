import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import fs from "fs/promises";
import path from "path";
import { logger } from "../logger.js";

export function registerTemplaterExamplesResource(server: McpServer) {
  logger.debug("Registering templater-examples resource...");
  
  server.resource(
    "templater-examples",
    "file://templater-examples/",
    {
      name: "Templater Quick Reference",
      description: "Comprehensive quick reference and examples for the Obsidian Templater plugin",
      mimeType: "text/markdown"
    },
    async () => {
      logger.debug("Resource read callback called for templater-examples");
      
      try {
        // The file should be in the build/resources directory after build
        const currentDir = path.dirname(new URL(import.meta.url).pathname);
        const examplesPath = path.join(currentDir, "templater-examples.md");
        
        logger.debug(`Looking for templater examples at: ${examplesPath}`);
        
        const content = await fs.readFile(examplesPath, "utf-8");
        
        logger.debug(`Successfully read templater examples, content length: ${content.length}`);
        
        return {
          contents: [
            {
              uri: "file://templater-examples/",
              text: content,
              mimeType: "text/markdown"
            },
          ],
        };
      } catch (error) {
        logger.error("Error reading templater examples", { error: error instanceof Error ? error.message : String(error) });
        
        return {
          contents: [
            {
              uri: "file://templater-examples/",
              text: `Error reading Templater examples: ${error instanceof Error ? error.message : String(error)}`,
              mimeType: "text/plain"
            },
          ],
        };
      }
    }
  );
  
  logger.debug("Templater-examples resource registered successfully");
}