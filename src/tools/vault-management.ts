import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { VaultManager, VaultNotFoundError, VaultAlreadyExistsError } from "../vault-manager.js";
import { ObsidianClient } from "../client.js";
import { z } from "zod";

/**
 * Register vault management tools with the MCP server
 */
export function registerVaultManagementTools(
  server: McpServer,
  vaultManager: VaultManager,
  client: ObsidianClient
): void {

  server.tool(
    "list_vaults",
    "List all configured Obsidian vaults with their status and details",
    {},
    async () => {
      try {
        const vaults = await vaultManager.listVaults();
        const collection = await vaultManager.getVaultCollection();
        const vaultsWithStatus = await Promise.all(
          vaults.map(async (vault) => {
            try {
              const isConnected = await client.testConnection(vault.name);
              return {
                ...vault,
                status: isConnected ? "connected" as const : "disconnected" as const,
              };
            } catch (error) {
              return {
                ...vault,
                status: "error" as const,
              };
            }
          })
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                vaults: vaultsWithStatus,
                activeVault: collection.activeVault,
                defaultVault: collection.defaultVault,
                totalVaults: vaultsWithStatus.length,
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error listing vaults: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    "get_vault_info",
    "Get detailed information about a specific vault including connection status",
    {
      vault: z.string().describe("Name of the vault to get information about"),
    },
    async ({ vault }) => {
      try {
        const vaultInfo = await vaultManager.getVaultInfo(vault);
        const isConnected = await client.testConnection(vault);
        const status = isConnected ? "connected" : "disconnected";

        let serverInfo = null;
        if (isConnected) {
          try {
            serverInfo = await client.getServerInfo(vault);
          } catch (error) {
            // Server info is optional
          }
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                ...vaultInfo,
                status,
                serverInfo,
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        if (error instanceof VaultNotFoundError) {
          return {
            content: [
              {
                type: "text",
                text: `Vault '${vault}' not found. Use list_vaults to see available vaults.`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Error getting vault info: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    "set_active_vault",
    "Switch to a different vault for subsequent operations",
    {
      vault: z.string().describe("Name of the vault to set as active"),
    },
    async ({ vault }) => {
      try {
        await vaultManager.setActiveVault(vault);

        const isConnected = await client.testConnection(vault);
        const connectionStatus = isConnected ? "connected" : "disconnected";

        return {
          content: [
            {
              type: "text",
              text: `Successfully switched to vault '${vault}'. Connection status: ${connectionStatus}`,
            },
          ],
        };
      } catch (error) {
        if (error instanceof VaultNotFoundError) {
          return {
            content: [
              {
                type: "text",
                text: `Vault '${vault}' not found. Use list_vaults to see available vaults.`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Error setting active vault: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    "add_vault",
    "Add a new Obsidian vault configuration with API key and connection details",
    {
      name: z.string().describe("Unique name for the vault"),
      apiKey: z.string().describe("API key for the Obsidian Local REST API"),
      baseUrl: z.string().optional().describe("Base URL for the vault API (default: http://localhost:27123)"),
      displayName: z.string().optional().describe("Display name for the vault"),
      setAsActive: z.boolean().optional().describe("Set this vault as the active vault (default: false)"),
    },
    async ({ name, apiKey, baseUrl, displayName, setAsActive }) => {
      try {
        await vaultManager.addVault(
          name,
          apiKey,
          baseUrl || "http://localhost:27123",
          displayName,
          setAsActive
        );

        let connectionStatus = "unknown";
        try {
          const isConnected = await client.testConnection(name);
          connectionStatus = isConnected ? "connected" : "disconnected";
        } catch (error) {
          connectionStatus = "error";
        }

        const activeMessage = setAsActive ? " and set as active vault" : "";

        return {
          content: [
            {
              type: "text",
              text: `Successfully added vault '${name}'${activeMessage}. Connection status: ${connectionStatus}`,
            },
          ],
        };
      } catch (error) {
        if (error instanceof VaultAlreadyExistsError) {
          return {
            content: [
              {
                type: "text",
                text: `Vault '${name}' already exists. Use remove_vault first if you want to replace it.`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Error adding vault: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    "remove_vault",
    "Remove a vault configuration from the system",
    {
      vault: z.string().describe("Name of the vault to remove"),
    },
    async ({ vault }) => {
      try {
        const vaultInfo = await vaultManager.getVaultInfo(vault);
        await vaultManager.removeVault(vault);

        const wasActive = vaultInfo.isActive;
        const newActiveVault = await vaultManager.getActiveVault();

        let message = `Successfully removed vault '${vault}'`;
        if (wasActive && newActiveVault) {
          message += `. Active vault switched to '${newActiveVault.name}'`;
        } else if (wasActive && !newActiveVault) {
          message += `. No active vault remaining`;
        }

        return {
          content: [
            {
              type: "text",
              text: message,
            },
          ],
        };
      } catch (error) {
        if (error instanceof VaultNotFoundError) {
          return {
            content: [
              {
                type: "text",
                text: `Vault '${vault}' not found. Use list_vaults to see available vaults.`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Error removing vault: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );

  // Get current active vault
  server.tool(
    "get_active_vault",
    "Get information about the currently active vault",
    {},
    async () => {
      try {
        const activeVault = await vaultManager.getActiveVault();

        if (!activeVault) {
          return {
            content: [
              {
                type: "text",
                text: "No active vault configured. Use set_active_vault or add_vault with setAsActive=true.",
              },
            ],
          };
        }

        // Test connection
        const isConnected = await client.testConnection();
        const status = isConnected ? "connected" : "disconnected";

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                name: activeVault.name,
                displayName: activeVault.name,
                baseUrl: activeVault.baseUrl,
                status,
                lastUsed: activeVault.lastUsed,
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting active vault: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );
}