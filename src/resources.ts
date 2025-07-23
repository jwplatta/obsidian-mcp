import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerDataviewExamplesResource } from "./resources/dataview-examples.js";

export function registerResources(server: McpServer) {
  registerDataviewExamplesResource(server);
}