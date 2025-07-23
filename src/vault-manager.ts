import fs from "fs/promises";
import path from "path";
import { VaultConfig, VaultCollection, VaultCollectionSchema, VaultInfoResponse } from "./schemas.js";
import { Config } from "./config.js";

export class VaultNotFoundError extends Error {
  constructor(vaultName: string) {
    super(`Vault '${vaultName}' not found`);
    this.name = "VaultNotFoundError";
  }
}

export class VaultAlreadyExistsError extends Error {
  constructor(vaultName: string) {
    super(`Vault '${vaultName}' already exists`);
    this.name = "VaultAlreadyExistsError";
  }
}

export class VaultManager {
  private config: Config;
  private vaultCollection: VaultCollection;
  private initialized = false;

  get configPath(): string {
    return this.config.configFile;
  }

  constructor() {
    this.config = Config.getInstance();
    this.vaultCollection = {
      vaults: {},
      defaultVault: undefined,
      activeVault: undefined,
    };
  }

  /**
   * Initialize the vault manager by loading existing configuration
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Load existing configuration if it exists
    await this.loadConfiguration();

    this.initialized = true;
  }

  /**
   * Load vault configuration from JSON file
   */
  private async loadConfiguration(): Promise<void> {
    try {
      const configContent = await fs.readFile(this.config.configFile, "utf-8");
      const parsed = JSON.parse(configContent);

      if (parsed.vaults) {
        for (const vault of Object.values(parsed.vaults) as any[]) {
          if (vault.lastUsed) {
            vault.lastUsed = new Date(vault.lastUsed);
          }
        }
      }

      this.vaultCollection = VaultCollectionSchema.parse(parsed);
    } catch (error) {
      if ((error as any).code === "ENOENT") {
        // File doesn't exist, start with empty configuration
        this.vaultCollection = {
          vaults: {},
          defaultVault: undefined,
          activeVault: undefined,
        };
      } else {
        console.warn("Warning: Failed to load vault configuration:", error);
        this.vaultCollection = {
          vaults: {},
          defaultVault: undefined,
          activeVault: undefined,
        };
      }
    }
  }

  /**
   * Save vault configuration to JSON file
   */
  private async saveConfiguration(): Promise<void> {
    try {
      // Ensure config directory exists
      await fs.mkdir(this.config.configDir, { recursive: true });

      const configContent = JSON.stringify(this.vaultCollection, null, 2);
      await fs.writeFile(this.config.configFile, configContent, "utf-8");
    } catch (error) {
      console.error("Error saving vault configuration:", error);
      throw new Error(`Failed to save vault configuration: ${error}`);
    }
  }

  /**
   * List all configured vaults
   */
  async listVaults(): Promise<VaultInfoResponse[]> {
    await this.initialize();

    return Object.entries(this.vaultCollection.vaults).map(([name, vault]) => ({
      name,
      displayName: vault.name,
      baseUrl: vault.baseUrl,
      isActive: vault.isActive || false,
      lastUsed: vault.lastUsed,
      status: "disconnected" as const, // TODO: Implement connection checking
    }));
  }

  /**
   * Get information about a specific vault
   */
  async getVaultInfo(name: string): Promise<VaultInfoResponse> {
    await this.initialize();

    const vault = this.vaultCollection.vaults[name];
    if (!vault) {
      throw new VaultNotFoundError(name);
    }

    return {
      name,
      displayName: vault.name,
      baseUrl: vault.baseUrl,
      isActive: vault.isActive || false,
      lastUsed: vault.lastUsed,
      status: "disconnected", // TODO: Implement connection checking
    };
  }

  /**
   * Add a new vault configuration
   */
  async addVault(
    name: string,
    apiKey: string,
    baseUrl: string = "http://localhost:27123",
    displayName?: string,
    setAsActive: boolean = false
  ): Promise<void> {
    await this.initialize();

    if (this.vaultCollection.vaults[name]) {
      throw new VaultAlreadyExistsError(name);
    }

    const vault: VaultConfig = {
      apiKey,
      baseUrl,
      name: displayName || name,
      port: new URL(baseUrl).port ? parseInt(new URL(baseUrl).port) : 27123,
      isActive: setAsActive,
      lastUsed: undefined,
    };

    this.vaultCollection.vaults[name] = vault;

    // Set as active vault if requested
    if (setAsActive) {
      await this.setActiveVault(name);
    }

    // Set as default vault if it's the first one
    if (!this.vaultCollection.defaultVault) {
      this.vaultCollection.defaultVault = name;
    }

    await this.saveConfiguration();
  }

  /**
   * Remove a vault configuration
   */
  async removeVault(name: string): Promise<void> {
    await this.initialize();

    if (!this.vaultCollection.vaults[name]) {
      throw new VaultNotFoundError(name);
    }

    delete this.vaultCollection.vaults[name];

    // Update default vault if removed
    if (this.vaultCollection.defaultVault === name) {
      const remainingVaults = Object.keys(this.vaultCollection.vaults);
      this.vaultCollection.defaultVault = remainingVaults.length > 0 ? remainingVaults[0] : undefined;
    }

    // Update active vault if removed
    if (this.vaultCollection.activeVault === name) {
      this.vaultCollection.activeVault = this.vaultCollection.defaultVault;
      if (this.vaultCollection.activeVault) {
        this.vaultCollection.vaults[this.vaultCollection.activeVault].isActive = true;
      }
    }

    await this.saveConfiguration();
  }

  /**
   * Set the active vault
   */
  async setActiveVault(name: string): Promise<void> {
    await this.initialize();

    if (!this.vaultCollection.vaults[name]) {
      throw new VaultNotFoundError(name);
    }

    // Mark previous active vault as inactive
    if (this.vaultCollection.activeVault) {
      this.vaultCollection.vaults[this.vaultCollection.activeVault].isActive = false;
    }

    // Set new active vault
    this.vaultCollection.activeVault = name;
    this.vaultCollection.vaults[name].isActive = true;
    this.vaultCollection.vaults[name].lastUsed = new Date();

    await this.saveConfiguration();
  }

  /**
   * Get the active vault configuration
   */
  async getActiveVault(): Promise<VaultConfig | null> {
    await this.initialize();

    if (!this.vaultCollection.activeVault) {
      return null;
    }

    return this.vaultCollection.vaults[this.vaultCollection.activeVault] || null;
  }

  /**
   * Get a specific vault configuration
   */
  async getVault(name: string): Promise<VaultConfig> {
    await this.initialize();

    const vault = this.vaultCollection.vaults[name];
    if (!vault) {
      throw new VaultNotFoundError(name);
    }

    return vault;
  }

  /**
   * Get the current vault collection
   */
  async getVaultCollection(): Promise<VaultCollection> {
    await this.initialize();
    return { ...this.vaultCollection };
  }
}