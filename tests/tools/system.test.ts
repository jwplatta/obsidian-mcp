import { ObsidianClient, ObsidianAPIError, VaultConnectionError } from "../../src/client.js";
import { VaultManager } from "../../src/vault-manager.js";
import { Config } from "../../src/config.js";
import fs from "fs/promises";
import path from "path";
import { tmpdir } from "os";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("System Tools - ObsidianClient methods", () => {
  let client: ObsidianClient;
  let vaultManager: VaultManager;
  let tempConfigFile: string;
  let tempConfigDir: string;

  beforeEach(async () => {
    // Setup temporary config
    tempConfigDir = await fs.mkdtemp(path.join(tmpdir(), "obsidian-mcp-test-"));
    tempConfigFile = path.join(tempConfigDir, "vaults.json");
    
    vaultManager = new VaultManager();
    const config = Config.getInstance();
    config.setConfigFile(tempConfigFile);
    
    client = new ObsidianClient(vaultManager);

    // Clear environment
    const envVars = Object.keys(process.env).filter(key => 
      key.includes("_OBSIDIAN_API_KEY") || key.includes("_OBSIDIAN_BASE_URL")
    );
    for (const key of envVars) {
      delete process.env[key];
    }

    // Setup test vault
    await vaultManager.initialize();
    await vaultManager.addVault("test", "test-api-key", "http://localhost:27123", "Test Vault", true);

    // Reset mock
    mockFetch.mockReset();
  });

  afterEach(async () => {
    try {
      await fs.rm(tempConfigDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe("getServerInfo", () => {
    test("should get server info from active vault", async () => {
      const mockServerInfo = {
        authenticated: true,
        ok: true,
        service: "Obsidian Local REST API",
        version: "1.0.0"
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockServerInfo),
        headers: {
          get: jest.fn().mockReturnValue("application/json"),
        },
      });

      const result = await client.getServerInfo();

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/",
        {
          method: "GET",
          headers: {
            "Authorization": "Bearer test-api-key",
            "Content-Type": "application/json",
          },
        }
      );
      expect(result).toEqual(mockServerInfo);
    });

    test("should get server info from specific vault", async () => {
      await vaultManager.addVault("other", "other-api-key", "http://localhost:27124");
      
      const mockServerInfo = {
        authenticated: true,
        ok: true,
        service: "Obsidian Local REST API",
        version: "1.2.0"
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockServerInfo),
        headers: {
          get: jest.fn().mockReturnValue("application/json"),
        },
      });

      const result = await client.getServerInfo("other");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27124/",
        expect.objectContaining({
          headers: expect.objectContaining({
            "Authorization": "Bearer other-api-key",
          }),
        })
      );
      expect(result).toEqual(mockServerInfo);
    });

    test("should handle network errors for server info", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(client.getServerInfo()).rejects.toThrow(VaultConnectionError);
      await expect(client.getServerInfo()).rejects.toThrow("Failed to connect to vault");
    });
  });

  describe("API certificate endpoint", () => {
    test("should get certificate from active vault", async () => {
      const mockCertificate = "-----BEGIN CERTIFICATE-----\nMIIC...certificatedata...\n-----END CERTIFICATE-----";
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockCertificate),
        headers: {
          get: jest.fn().mockReturnValue("text/plain"),
        },
      });

      const result = await client.request("/obsidian-local-rest-api.crt");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/obsidian-local-rest-api.crt",
        {
          method: "GET",
          headers: {
            "Authorization": "Bearer test-api-key",
            "Content-Type": "application/json",
          },
        }
      );
      expect(result).toBe(mockCertificate);
    });

    test("should get certificate from specific vault", async () => {
      await vaultManager.addVault("secure", "secure-api-key", "https://localhost:27125");
      
      const mockCertificate = "-----BEGIN CERTIFICATE-----\nMIIC...differentcert...\n-----END CERTIFICATE-----";
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockCertificate),
        headers: {
          get: jest.fn().mockReturnValue("text/plain"),
        },
      });

      const result = await client.request("/obsidian-local-rest-api.crt", { vault: "secure" });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://localhost:27125/obsidian-local-rest-api.crt",
        expect.objectContaining({
          headers: expect.objectContaining({
            "Authorization": "Bearer secure-api-key",
          }),
        })
      );
      expect(result).toBe(mockCertificate);
    });

    test("should handle network errors for certificate", async () => {
      mockFetch.mockRejectedValueOnce(new Error("SSL connection failed"));

      await expect(client.request("/obsidian-local-rest-api.crt")).rejects.toThrow(VaultConnectionError);
      await expect(client.request("/obsidian-local-rest-api.crt")).rejects.toThrow("Failed to connect to vault");
    });
  });

  describe("vault parameter handling", () => {
    beforeEach(async () => {
      await vaultManager.addVault("system", "system-key", "http://localhost:27126");
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: "ok" }),
        headers: {
          get: jest.fn().mockReturnValue("application/json"),
        },
      });
    });

    test("should use specified vault for server info", async () => {
      await client.getServerInfo("system");
      
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27126/",
        expect.objectContaining({
          headers: expect.objectContaining({
            "Authorization": "Bearer system-key",
          }),
        })
      );
    });

    test("should use active vault when no vault parameter provided", async () => {
      await client.getServerInfo();
      
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/",
        expect.objectContaining({
          headers: expect.objectContaining({
            "Authorization": "Bearer test-api-key",
          }),
        })
      );
    });
  });
});