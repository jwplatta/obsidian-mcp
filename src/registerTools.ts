import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ObsidianClient } from "./client.js";
import { registerVaultManagementTools } from "./tools/vault-management.js";
import { registerActiveFileTools } from "./tools/active-file.js";
import { registerVaultFileTools } from "./tools/vault-files.js";
import { registerVaultDirectoryTools } from "./tools/vault-directories.js";
import { registerSearchTools } from "./tools/search.js";

export function registerTools(server: McpServer, obsidianClient: ObsidianClient) {
  registerVaultManagementTools(server, vaultManager, obsidianClient);
  registerActiveFileTools(server, vaultManager, obsidianClient);
  registerVaultFileTools(server, vaultManager, obsidianClient);
  registerVaultDirectoryTools(server, vaultManager, obsidianClient);
  registerSearchTools(server, vaultManager, obsidianClient);
}