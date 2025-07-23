import { VaultManager } from "../../src/vault-manager.js";
import { ObsidianClient } from "../../src/client.js";
import {
  createMcpTestServer,
  addTestVault,
  setupFetchMock,
  mockFetchResponse,
  type McpTestContext,
} from "../utils/mcpTestServer.js";

describe("Search Operations", () => {
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

  describe("searchVault", () => {
    test("should execute search query successfully", async () => {
      const mockResults = [
        { file: "note1.md", title: "Note 1", content: "Some content" },
        { file: "note2.md", title: "Note 2", content: "Other content" }
      ];

      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          headers: { "content-type": "application/json" },
          json: mockResults,
        })
      );

      const query = { "glob": ["*.md", {"var": "file"}] };
      const result = await obsidianClient.searchVault(query);

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/search/",
        {
          method: "POST",
          headers: {
            "Authorization": "Bearer test-api-key",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(query),
        }
      );

      expect(result).toEqual(mockResults);
    });

    test("should use specified vault", async () => {
      await addTestVault(vaultManager, "vault2", "vault2-key", "http://localhost:27124", "Vault 2", false);

      const mockResults = [{ file: "vault2-note.md" }];
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          headers: { "content-type": "application/json" },
          json: mockResults,
        })
      );

      const query = { "glob": ["*.md", {"var": "file"}] };
      await obsidianClient.searchVault(query, "vault2");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27124/search/",
        expect.objectContaining({
          headers: expect.objectContaining({
            "Authorization": "Bearer vault2-key",
          }),
        })
      );
    });

    test("should handle search API errors", async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          ok: false,
          status: 400,
          statusText: "Bad Request",
          headers: { "content-type": "application/json" },
          json: { error: "Invalid query" },
        })
      );

      const query = { "invalid": "query" };
      await expect(obsidianClient.searchVault(query)).rejects.toThrow("HTTP 400");
    });

    test("should handle empty search results", async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          headers: { "content-type": "application/json" },
          json: [],
        })
      );

      const query = { "glob": ["*.nonexistent", {"var": "file"}] };
      const result = await obsidianClient.searchVault(query);

      expect(result).toEqual([]);
    });
  });

  describe("simpleSearch", () => {
    test("should execute simple search successfully", async () => {
      const mockResults = [
        {
          file: "note1.md",
          matches: [
            { line: 1, content: "This is a test note" }
          ]
        },
        {
          file: "note2.md",
          matches: [
            { line: 3, content: "Another test file" }
          ]
        }
      ];

      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          headers: { "content-type": "application/json" },
          json: mockResults,
        })
      );

      const result = await obsidianClient.simpleSearch("test");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/search/simple/?query=test",
        {
          method: "POST",
          headers: {
            "Authorization": "Bearer test-api-key",
            "Content-Type": "text/plain",
          },
          body: "",
        }
      );

      expect(result).toEqual(mockResults);
    });

    test("should use specified vault", async () => {
      await addTestVault(vaultManager, "vault2", "vault2-key", "http://localhost:27124", "Vault 2", false);

      const mockResults = [
        { file: "vault2-search.md", matches: [{ line: 1, content: "search term" }] }
      ];

      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          headers: { "content-type": "application/json" },
          json: mockResults,
        })
      );

      await obsidianClient.simpleSearch("search", undefined, "vault2");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27124/search/simple/?query=search",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Authorization": "Bearer vault2-key",
            "Content-Type": "text/plain",
          }),
          body: "",
        })
      );
    });

    test("should handle empty search results", async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          headers: { "content-type": "application/json" },
          json: [],
        })
      );

      const result = await obsidianClient.simpleSearch("nonexistent");

      expect(result).toEqual([]);
    });

    test("should handle search API errors", async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
          headers: { "content-type": "application/json" },
          json: { error: "Search service unavailable" },
        })
      );

      await expect(obsidianClient.simpleSearch("test")).rejects.toThrow("HTTP 500");
    });

    test("should support contextLength parameter", async () => {
      const mockResults = [
        { file: "note.md", matches: [{ line: 1, content: "search term with longer context" }] }
      ];

      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          headers: { "content-type": "application/json" },
          json: mockResults,
        })
      );

      await obsidianClient.simpleSearch("term", 50);

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/search/simple/?query=term&contextLength=50",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Authorization": "Bearer test-api-key",
            "Content-Type": "text/plain",
          }),
          body: "",
        })
      );
    });
  });

  describe("error handling", () => {
    test("should handle network errors in searchVault", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const query = { "glob": ["*.md", {"var": "file"}] };
      await expect(obsidianClient.searchVault(query)).rejects.toThrow("Failed to connect to vault");
    });

    test("should handle network errors in simpleSearch", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(obsidianClient.simpleSearch("test")).rejects.toThrow("Failed to connect to vault");
    });

    test("should handle missing active vault", async () => {
      // Remove all vaults
      await vaultManager.removeVault("test");

      const query = { "glob": ["*.md", {"var": "file"}] };
      await expect(obsidianClient.searchVault(query)).rejects.toThrow("No active vault configured");
    });
  });
});