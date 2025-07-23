import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { VaultManager } from "./vault-manager.js";
import { ObsidianClient } from "./client.js";
import { registerVaultManagementTools } from "./tools/vault-management.js";

const server = new McpServer({
  name: "obsidian-mcp",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Initialize vault management system
const vaultManager = new VaultManager();
const obsidianClient = new ObsidianClient(vaultManager);

async function main() {
  try {
    // Initialize vault manager and register tools
    await vaultManager.initialize();
    registerVaultManagementTools(server, vaultManager, obsidianClient);
    
    // Start the server
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Obsidian MCP Server running on stdio");
    console.error(`Vault configuration: ${vaultManager.configPath}`);
    
    // Log available vaults
    const vaults = await vaultManager.listVaults();
    if (vaults.length > 0) {
      console.error(`Configured vaults: ${vaults.map(v => v.name).join(", ")}`);
      const activeVault = await vaultManager.getActiveVault();
      if (activeVault) {
        console.error(`Active vault: ${activeVault.name}`);
      }
    } else {
      console.error("No vaults configured. Use add_vault tool to add vault configurations.");
    }
  } catch (error) {
    console.error("Error during server initialization:", error);
    throw error;
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
