import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerDataviewExamplesResource } from "./resources/dataview-examples.js";
import { registerTemplaterExamplesResource } from "./resources/templater-examples.js";

export function registerResources(server: McpServer) {
  registerDataviewExamplesResource(server);
  registerTemplaterExamplesResource(server);
}