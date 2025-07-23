import { VaultManager } from "../../src/vault-manager.js";
import { ObsidianClient } from "../../src/client.js";
import {
  createMcpTestServer,
  addTestVault,
  setupFetchMock,
  mockFetchResponse,
  type McpTestContext,
} from "../utils/mcpTestServer.js";

describe("Vault File Operations", () => {
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

  describe("getFile", () => {
    test("should retrieve file content", async () => {
      const mockContent = "# Test File\\n\\nThis is a test file.";
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          headers: { "content-type": "text/plain" },
          text: mockContent,
        })
      );

      const result = await obsidianClient.getFile("test/document.md");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/vault/test%2Fdocument.md",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            "Authorization": "Bearer test-api-key",
          }),
        })
      );

      expect(result).toBe(mockContent);
    });

    test("should use specified vault", async () => {
      await addTestVault(vaultManager, "vault2", "vault2-key", "http://localhost:27124", "Vault 2", false);

      const mockContent = "# Vault 2 File";
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          headers: { "content-type": "text/plain" },
          text: mockContent,
        })
      );

      await obsidianClient.getFile("notes/test.md", "vault2");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27124/vault/notes%2Ftest.md",
        expect.objectContaining({
          headers: expect.objectContaining({
            "Authorization": "Bearer vault2-key",
          }),
        })
      );
    });

    test("should handle file not found", async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          ok: false,
          status: 404,
          statusText: "Not Found",
          headers: { "content-type": "application/json" },
          json: { error: "File not found" },
        })
      );

      await expect(obsidianClient.getFile("nonexistent.md")).rejects.toThrow("HTTP 404");
    });
  });

  describe("createFile", () => {
    test("should create new file with content", async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({}));

      await obsidianClient.createFile("new/file.md", "# New File\\n\\nThis is new content.");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/vault/new%2Ffile.md",
        {
          method: "PUT",
          headers: {
            "Authorization": "Bearer test-api-key",
            "Content-Type": "text/plain",
          },
          body: "# New File\\n\\nThis is new content.",
        }
      );
    });

    test("should allow empty content", async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({}));

      await obsidianClient.createFile("empty.md", "");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/vault/empty.md",
        expect.objectContaining({
          body: "",
        })
      );
    });

    test("should use specified vault", async () => {
      await addTestVault(vaultManager, "vault2", "vault2-key", "http://localhost:27124", "Vault 2", false);

      mockFetch.mockResolvedValueOnce(mockFetchResponse({}));

      await obsidianClient.createFile("test.md", "content", "vault2");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27124/vault/test.md",
        expect.objectContaining({
          headers: expect.objectContaining({
            "Authorization": "Bearer vault2-key",
          }),
        })
      );
    });
  });

  describe("appendToFile", () => {
    test("should append content to existing file", async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({}));

      await obsidianClient.appendToFile("existing.md", "\\n\\nAppended content.");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/vault/existing.md",
        {
          method: "POST",
          headers: {
            "Authorization": "Bearer test-api-key",
            "Content-Type": "text/plain",
          },
          body: "\\n\\nAppended content.",
        }
      );
    });

    test("should use specified vault", async () => {
      await addTestVault(vaultManager, "vault2", "vault2-key", "http://localhost:27124", "Vault 2", false);

      mockFetch.mockResolvedValueOnce(mockFetchResponse({}));

      await obsidianClient.appendToFile("test.md", "content", "vault2");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27124/vault/test.md",
        expect.objectContaining({
          headers: expect.objectContaining({
            "Authorization": "Bearer vault2-key",
          }),
        })
      );
    });
  });

  describe("patchFile", () => {
    test("should patch file with modifications", async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({}));

      const patchData = {
        insertions: [{ line: 0, content: "# New Header" }],
        deletions: [{ startLine: 2, endLine: 4 }],
        replacements: [{ startLine: 1, endLine: 3, content: "New replacement content" }],
      };

      await obsidianClient.patchFile("patch.md", patchData);

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/vault/patch.md",
        {
          method: "PATCH",
          headers: {
            "Authorization": "Bearer test-api-key",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(patchData),
        }
      );
    });

    test("should use specified vault", async () => {
      await addTestVault(vaultManager, "vault2", "vault2-key", "http://localhost:27124", "Vault 2", false);

      mockFetch.mockResolvedValueOnce(mockFetchResponse({}));

      const patchData = { insertions: [{ line: 0, content: "test" }] };

      await obsidianClient.patchFile("test.md", patchData, "vault2");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27124/vault/test.md",
        expect.objectContaining({
          headers: expect.objectContaining({
            "Authorization": "Bearer vault2-key",
          }),
        })
      );
    });
  });

  describe("deleteFile", () => {
    test("should delete file", async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({}));

      await obsidianClient.deleteFile("delete-me.md");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/vault/delete-me.md",
        {
          method: "DELETE",
          headers: {
            "Authorization": "Bearer test-api-key",
            "Content-Type": "application/json",
          },
        }
      );
    });

    test("should handle deletion errors", async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          ok: false,
          status: 404,
          statusText: "Not Found",
          headers: { "content-type": "application/json" },
          json: { error: "File not found" },
        })
      );

      await expect(obsidianClient.deleteFile("nonexistent.md")).rejects.toThrow("HTTP 404");
    });

    test("should use specified vault", async () => {
      await addTestVault(vaultManager, "vault2", "vault2-key", "http://localhost:27124", "Vault 2", false);

      mockFetch.mockResolvedValueOnce(mockFetchResponse({}));

      await obsidianClient.deleteFile("test.md", "vault2");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27124/vault/test.md",
        expect.objectContaining({
          headers: expect.objectContaining({
            "Authorization": "Bearer vault2-key",
          }),
        })
      );
    });
  });

  describe("error handling", () => {
    test("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(obsidianClient.getFile("test.md")).rejects.toThrow("Failed to connect to vault");
    });

    test("should handle missing active vault", async () => {
      // Remove all vaults
      await vaultManager.removeVault("test");

      await expect(obsidianClient.getFile("test.md")).rejects.toThrow("No active vault configured");
    });
  });
});