import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ObsidianClient } from "./client.js";
import { VaultManager } from "./vault-manager.js";
import { registerVaultManagementTools } from "./tools/vault-management.js";
import { registerActiveFileTools } from "./tools/active-file.js";
import { registerVaultFileTools } from "./tools/vault-files.js";
import { registerVaultDirectoryTools } from "./tools/vault-directories.js";
import { registerSearchTools } from "./tools/search.js";
import { registerPeriodicNotesTools } from "./tools/periodic-notes.js";
import { registerCommandTools } from "./tools/commands.js";
import { registerNavigationTools } from "./tools/navigation.js";
import { registerSystemTools } from "./tools/system.js";

export function registerTools(server: McpServer, vaultManager: VaultManager, obsidianClient: ObsidianClient) {
  registerVaultManagementTools(server, vaultManager, obsidianClient);
  registerActiveFileTools(server, obsidianClient);
  registerVaultFileTools(server, obsidianClient);
  registerVaultDirectoryTools(server, obsidianClient);
  registerSearchTools(server, obsidianClient);
  registerPeriodicNotesTools(server, obsidianClient);
  registerCommandTools(server, obsidianClient);
  registerNavigationTools(server, obsidianClient);
  registerSystemTools(server, obsidianClient);
}