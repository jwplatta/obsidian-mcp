import { VaultManager } from "../../src/vault-manager.js";
import { ObsidianClient } from "../../src/client.js";
import {
  createMcpTestServer,
  addTestVault,
  setupFetchMock,
  mockFetchResponse,
  type McpTestContext,
} from "../utils/mcpTestServer.js";

describe("Vault Directory Operations", () => {
  let testContext: McpTestContext;
  let vaultManager: VaultManager;
  let obsidianClient: ObsidianClient;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(async () => {
    mockFetch = setupFetchMock();

    testContext = await createMcpTestServer();
    ({ vaultManager, obsidianClient } = testContext);

    await addTestVault(vaultManager);
  });

  afterEach(async () => {
    await testContext.cleanup();
  });

  describe("listDirectory", () => {
    test("should list directory contents", async () => {
      const mockFiles = [
        "README.md",
        "notes/",
        "daily/",
        "templates/",
        "attachments/",
      ];

      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          headers: { "content-type": "application/json" },
          json: mockFiles,
        })
      );

      const result = await obsidianClient.listDirectory();

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/vault//",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            "Authorization": "Bearer test-api-key",
          }),
        })
      );

      expect(result).toEqual(mockFiles);
    });

    test("should list files in specified directory", async () => {
      const mockFiles = [
        "2024-01-01.md",
        "2024-01-02.md",
        "2024-01-03.md",
      ];

      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          headers: { "content-type": "application/json" },
          json: mockFiles,
        })
      );

      const result = await obsidianClient.listDirectory("daily");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/vault/daily/",
        expect.objectContaining({
          method: "GET",
        })
      );

      expect(result).toEqual(mockFiles);
    });

    test("should use specified vault", async () => {
      await addTestVault(vaultManager, "vault2", "vault2-key", "http://localhost:27124", "Vault 2", false);

      const mockFiles = ["vault2-file.md"];
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          headers: { "content-type": "application/json" },
          json: mockFiles,
        })
      );

      await obsidianClient.listDirectory("", "vault2");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27124/vault//",
        expect.objectContaining({
          headers: expect.objectContaining({
            "Authorization": "Bearer vault2-key",
          }),
        })
      );
    });

    test("should handle empty directory", async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          headers: { "content-type": "application/json" },
          json: [],
        })
      );

      const result = await obsidianClient.listDirectory("empty-folder");

      expect(result).toEqual([]);
    });

    test("should handle directory not found", async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          ok: false,
          status: 404,
          statusText: "Not Found",
          headers: { "content-type": "application/json" },
          json: { error: "Directory not found" },
        })
      );

      await expect(obsidianClient.listDirectory("nonexistent")).rejects.toThrow("HTTP 404");
    });

    test("should handle nested directory paths", async () => {
      const mockContents = ["deep-file.md"];

      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          headers: { "content-type": "application/json" },
          json: mockContents,
        })
      );

      await obsidianClient.listDirectory("notes/research/deep");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/vault/notes%2Fresearch%2Fdeep/",
        expect.any(Object)
      );
    });
  });

  describe("error handling", () => {
    test("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(obsidianClient.listDirectory()).rejects.toThrow("Failed to connect to vault");
    });

    test("should handle missing active vault", async () => {
      // Remove all vaults
      await vaultManager.removeVault("test");

      await expect(obsidianClient.listDirectory()).rejects.toThrow("No active vault configured");
    });

    test("should handle invalid vault name", async () => {
      await expect(obsidianClient.listDirectory("", "nonexistent-vault")).rejects.toThrow();
    });
  });
});