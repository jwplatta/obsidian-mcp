import { ObsidianClient, ObsidianAPIError, VaultConnectionError } from "../src/client.js";
import { VaultManager } from "../src/vault-manager.js";
import { Config } from "../src/config.js";
import fs from "fs/promises";
import path from "path";
import { tmpdir } from "os";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("ObsidianClient", () => {
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

  describe("request method", () => {
    test("should make successful request to active vault", async () => {
      const mockResponse = { content: "test content" };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        headers: {
          get: jest.fn().mockReturnValue("application/json"),
        },
      });

      const result = await client.request("/test-endpoint");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/test-endpoint",
        {
          method: "GET",
          headers: {
            "Authorization": "Bearer test-api-key",
            "Content-Type": "application/json",
          },
        }
      );
      expect(result).toEqual(mockResponse);
    });

    test("should make request to specific vault", async () => {
      await vaultManager.addVault("other", "other-api-key", "http://localhost:27124");
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
        headers: new Map([["content-type", "application/json"]]),
      });

      await client.request("/test", { vault: "other" });

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27124/test",
        expect.objectContaining({
          headers: expect.objectContaining({
            "Authorization": "Bearer other-api-key",
          }),
        })
      );
    });

    test("should handle POST requests with body", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve("success"),
        headers: new Map([["content-type", "text/plain"]]),
      });

      const testData = { message: "test" };
      await client.request("/api/endpoint", {
        method: "POST",
        body: testData,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/api/endpoint",
        {
          method: "POST",
          headers: {
            "Authorization": "Bearer test-api-key",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(testData),
        }
      );
    });

    test("should handle string body", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve("success"),
        headers: new Map([["content-type", "text/plain"]]),
      });

      await client.request("/api/endpoint", {
        method: "PUT",
        body: "plain text content",
        headers: { "Content-Type": "text/plain" },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/api/endpoint",
        {
          method: "PUT",
          headers: {
            "Authorization": "Bearer test-api-key",
            "Content-Type": "text/plain",
          },
          body: "plain text content",
        }
      );
    });

    test("should handle non-JSON responses", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve("plain text response"),
        headers: new Map([["content-type", "text/plain"]]),
      });

      const result = await client.request("/api/text");

      expect(result).toBe("plain text response");
    });

    test("should throw ObsidianAPIError for HTTP errors", async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: () => Promise.resolve({ error: "File not found" }),
        headers: {
          get: jest.fn().mockReturnValue("application/json"),
        },
      };
      
      mockFetch.mockResolvedValue(mockResponse);

      await expect(client.request("/nonexistent")).rejects.toThrow(ObsidianAPIError);
      await expect(client.request("/nonexistent")).rejects.toThrow("HTTP 404: Not Found");
    });

    test("should throw VaultConnectionError for network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(client.request("/test")).rejects.toThrow(VaultConnectionError);
      await expect(client.request("/test")).rejects.toThrow("Failed to connect to vault");
    });

    test("should throw error when no active vault configured", async () => {
      // Remove all vaults
      await vaultManager.removeVault("test");

      await expect(client.request("/test")).rejects.toThrow(
        "No active vault configured"
      );
    });

    test("should normalize URL paths correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve("success"),
        headers: new Map(),
      });

      await client.request("endpoint-without-slash");
      
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/endpoint-without-slash",
        expect.any(Object)
      );
    });
  });

  describe("convenience methods", () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("success"),
        json: () => Promise.resolve({}),
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      });
    });

    test("testConnection should return true for successful connection", async () => {
      const result = await client.testConnection();
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/",
        expect.any(Object)
      );
    });

    test("testConnection should return false for failed connection", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Connection failed"));
      
      const result = await client.testConnection();
      expect(result).toBe(false);
    });

    test("getActiveFile should make GET request to /active/", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve("file content"),
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      });

      const result = await client.getActiveFile();
      
      expect(result).toBe("file content");
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/active/",
        expect.objectContaining({ method: "GET" })
      );
    });

    test("appendToActiveFile should make POST request with text content", async () => {
      await client.appendToActiveFile("new content");
      
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/active/",
        expect.objectContaining({
          method: "POST",
          body: "new content",
          headers: expect.objectContaining({
            "Content-Type": "text/plain",
          }),
        })
      );
    });

    test("createFile should encode file path", async () => {
      await client.createFile("folder/file with spaces.md", "content");
      
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/vault/folder%2Ffile%20with%20spaces.md",
        expect.objectContaining({
          method: "PUT",
          body: "content",
        })
      );
    });

    test("deleteFile should make DELETE request", async () => {
      await client.deleteFile("test.md");
      
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/vault/test.md",
        expect.objectContaining({ method: "DELETE" })
      );
    });

    test("listDirectory should handle empty path", async () => {
      await client.listDirectory();
      
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/vault//",
        expect.any(Object)
      );
    });

    test("listDirectory should encode directory path", async () => {
      await client.listDirectory("folder with spaces");
      
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/vault/folder%20with%20spaces/",
        expect.any(Object)
      );
    });

    test("searchVault should make POST request with query", async () => {
      const query = { search: "test" };
      await client.searchVault(query);
      
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/search/",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(query),
        })
      );
    });

    test("simpleSearch should make POST request to simple search endpoint", async () => {
      await client.simpleSearch("test query");
      
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/search/simple/?query=test+query",
        expect.objectContaining({
          method: "POST",
          body: "",
          headers: expect.objectContaining({
            "Content-Type": "text/plain",
          }),
        })
      );
    });

    test("openFile should make POST request to open endpoint", async () => {
      await client.openFile("note.md");
      
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/open/note.md",
        expect.objectContaining({ method: "POST" })
      );
    });

    test("executeCommand should encode command ID", async () => {
      await client.executeCommand("app:reload");
      
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/commands/app%3Areload/",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  describe("vault parameter handling", () => {
    beforeEach(async () => {
      await vaultManager.addVault("specific", "specific-key", "http://localhost:27124");
      
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("success"),
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      });
    });

    test("should use specified vault when vault parameter provided", async () => {
      await client.getActiveFile("specific");
      
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27124/active/",
        expect.objectContaining({
          headers: expect.objectContaining({
            "Authorization": "Bearer specific-key",
          }),
        })
      );
    });

    test("should use active vault when no vault parameter provided", async () => {
      await client.getActiveFile();
      
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/active/",
        expect.objectContaining({
          headers: expect.objectContaining({
            "Authorization": "Bearer test-api-key",
          }),
        })
      );
    });
  });
});