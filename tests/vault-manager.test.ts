import { VaultManager, VaultNotFoundError, VaultAlreadyExistsError } from "../src/vault-manager.js";
import { Config } from "../src/config.js";
import fs from "fs/promises";
import path from "path";
import { tmpdir } from "os";

describe("VaultManager", () => {
  let vaultManager: VaultManager;
  let tempConfigFile: string;
  let tempConfigDir: string;

  beforeEach(async () => {
    // Create temporary directory for test configuration
    tempConfigDir = await fs.mkdtemp(path.join(tmpdir(), "obsidian-mcp-test-"));
    tempConfigFile = path.join(tempConfigDir, "vaults.json");
    
    // Create new VaultManager instance
    vaultManager = new VaultManager();
    
    // Override config file path for testing
    const config = Config.getInstance();
    config.setConfigFile(tempConfigFile);

    // No environment variable cleanup needed - config-file-only approach
  });

  afterEach(async () => {
    // Clean up temporary files
    try {
      await fs.rm(tempConfigDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe("initialization", () => {
    test("should initialize with empty configuration when no config file exists", async () => {
      await vaultManager.initialize();
      const vaults = await vaultManager.listVaults();
      expect(vaults).toHaveLength(0);
    });


    test("should load existing configuration from file", async () => {
      // Create existing config file
      const existingConfig = {
        vaults: {
          existing: {
            apiKey: "existing-key",
            baseUrl: "http://localhost:27125",
            name: "Existing Vault",
            port: 27125,
            isActive: true,
            lastUsed: "2024-01-01T00:00:00.000Z"
          }
        },
        defaultVault: "existing",
        activeVault: "existing"
      };

      await fs.writeFile(tempConfigFile, JSON.stringify(existingConfig));
      await vaultManager.initialize();

      const vaults = await vaultManager.listVaults();
      expect(vaults).toHaveLength(1);
      expect(vaults[0].name).toBe("existing");
      expect(vaults[0].isActive).toBe(true);
    });
  });

  describe("vault operations", () => {
    beforeEach(async () => {
      await vaultManager.initialize();
    });

    test("should add a new vault", async () => {
      await vaultManager.addVault("test", "test-api-key", "http://localhost:27123", "Test Vault");
      
      const vaults = await vaultManager.listVaults();
      expect(vaults).toHaveLength(1);
      expect(vaults[0].name).toBe("test");
      expect(vaults[0].displayName).toBe("Test Vault");
    });

    test("should set first vault as default", async () => {
      await vaultManager.addVault("first", "api-key", "http://localhost:27123");
      
      const collection = await vaultManager.getVaultCollection();
      expect(collection.defaultVault).toBe("first");
    });

    test("should set vault as active when requested", async () => {
      await vaultManager.addVault("test", "test-api-key", "http://localhost:27123", "Test", true);
      
      const activeVault = await vaultManager.getActiveVault();
      expect(activeVault?.name).toBe("Test");
      
      const collection = await vaultManager.getVaultCollection();
      expect(collection.activeVault).toBe("test");
    });

    test("should throw error when adding duplicate vault", async () => {
      await vaultManager.addVault("test", "api-key");
      
      await expect(
        vaultManager.addVault("test", "another-key")
      ).rejects.toThrow(VaultAlreadyExistsError);
    });

    test("should get vault info", async () => {
      await vaultManager.addVault("test", "test-api-key", "http://localhost:27123", "Test Vault");
      
      const info = await vaultManager.getVaultInfo("test");
      expect(info.name).toBe("test");
      expect(info.displayName).toBe("Test Vault");
      expect(info.baseUrl).toBe("http://localhost:27123");
    });

    test("should throw error when getting non-existent vault", async () => {
      await expect(
        vaultManager.getVaultInfo("nonexistent")
      ).rejects.toThrow(VaultNotFoundError);
    });

    test("should set active vault", async () => {
      await vaultManager.addVault("vault1", "key1");
      await vaultManager.addVault("vault2", "key2");
      
      await vaultManager.setActiveVault("vault2");
      
      const activeVault = await vaultManager.getActiveVault();
      expect(activeVault?.name).toBe("vault2");
      
      const vaults = await vaultManager.listVaults();
      const vault1 = vaults.find(v => v.name === "vault1");
      const vault2 = vaults.find(v => v.name === "vault2");
      
      expect(vault1?.isActive).toBe(false);
      expect(vault2?.isActive).toBe(true);
    });

    test("should update lastUsed when setting active vault", async () => {
      await vaultManager.addVault("test", "api-key");
      
      const beforeTime = new Date();
      await vaultManager.setActiveVault("test");
      const afterTime = new Date();
      
      const vault = await vaultManager.getVault("test");
      expect(vault.lastUsed).toBeDefined();
      expect(vault.lastUsed!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(vault.lastUsed!.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    test("should remove vault", async () => {
      await vaultManager.addVault("test", "api-key");
      expect((await vaultManager.listVaults())).toHaveLength(1);
      
      await vaultManager.removeVault("test");
      expect((await vaultManager.listVaults())).toHaveLength(0);
    });

    test("should update default vault when removing default", async () => {
      await vaultManager.addVault("vault1", "key1");
      await vaultManager.addVault("vault2", "key2");
      
      const collection = await vaultManager.getVaultCollection();
      expect(collection.defaultVault).toBe("vault1");
      
      await vaultManager.removeVault("vault1");
      
      const updatedCollection = await vaultManager.getVaultCollection();
      expect(updatedCollection.defaultVault).toBe("vault2");
    });

    test("should update active vault when removing active vault", async () => {
      await vaultManager.addVault("vault1", "key1", undefined, undefined, true);
      await vaultManager.addVault("vault2", "key2");
      
      expect((await vaultManager.getActiveVault())?.name).toBe("vault1");
      
      await vaultManager.removeVault("vault1");
      
      const activeVault = await vaultManager.getActiveVault();
      expect(activeVault?.name).toBe("vault2");
    });

    test("should throw error when removing non-existent vault", async () => {
      await expect(
        vaultManager.removeVault("nonexistent")
      ).rejects.toThrow(VaultNotFoundError);
    });
  });

  describe("persistence", () => {
    test("should persist vault configuration to file", async () => {
      await vaultManager.initialize();
      await vaultManager.addVault("test", "api-key", "http://localhost:27123", "Test Vault");
      
      // Create new manager instance to test loading
      const newManager = new VaultManager();
      await newManager.initialize();
      
      const vaults = await newManager.listVaults();
      expect(vaults).toHaveLength(1);
      expect(vaults[0].name).toBe("test");
      expect(vaults[0].displayName).toBe("Test Vault");
    });

    test("should preserve date objects when saving and loading", async () => {
      await vaultManager.initialize();
      await vaultManager.addVault("test", "api-key", undefined, undefined, true);
      
      // Set active vault to update lastUsed
      await vaultManager.setActiveVault("test");
      const originalVault = await vaultManager.getVault("test");
      
      // Create new manager instance
      const newManager = new VaultManager();
      await newManager.initialize();
      
      const loadedVault = await newManager.getVault("test");
      expect(loadedVault.lastUsed).toBeInstanceOf(Date);
      expect(loadedVault.lastUsed?.getTime()).toBe(originalVault.lastUsed?.getTime());
    });
  });

  // Environment variable discovery removed - using config-file-only approach
});