import { VaultManager } from "../../src/vault-manager.js";
import { ObsidianClient } from "../../src/client.js";
import {
  createMcpTestServer,
  addTestVault,
  setupFetchMock,
  mockFetchResponse,
  type McpTestContext,
} from "../utils/mcpTestServer.js";

describe("Navigation Client Operations", () => {
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

  describe("openFile", () => {
    test("should open file without newLeaf parameter", async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({}));

      await obsidianClient.openFile("notes/meeting.md");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/open/notes%2Fmeeting.md",
        {
          method: "POST",
          headers: {
            "Authorization": "Bearer test-api-key",
            "Content-Type": "application/json",
          },
        }
      );
    });

    test("should open file with newLeaf=true", async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({}));

      await obsidianClient.openFile("daily/2024-01-15.md", true);

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/open/daily%2F2024-01-15.md?newLeaf=true",
        {
          method: "POST",
          headers: {
            "Authorization": "Bearer test-api-key",
            "Content-Type": "application/json",
          },
        }
      );
    });

    test("should open file with newLeaf=false", async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({}));

      await obsidianClient.openFile("projects/project-x.md", false);

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/open/projects%2Fproject-x.md?newLeaf=false",
        {
          method: "POST",
          headers: {
            "Authorization": "Bearer test-api-key",
            "Content-Type": "application/json",
          },
        }
      );
    });

    test("should use specified vault", async () => {
      await addTestVault(vaultManager, "vault2", "vault2-key", "http://localhost:27124", "Vault 2", false);
      
      mockFetch.mockResolvedValueOnce(mockFetchResponse({}));

      await obsidianClient.openFile("notes/vault2-note.md", true, "vault2");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27124/open/notes%2Fvault2-note.md?newLeaf=true",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Authorization": "Bearer vault2-key",
          }),
        })
      );
    });

    test("should handle API errors", async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          ok: false,
          status: 404,
          statusText: "Not Found",
          headers: { "content-type": "application/json" },
          json: { error: "File not found" },
        })
      );

      await expect(obsidianClient.openFile("nonexistent/file.md")).rejects.toThrow("HTTP 404");
    });

    test("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(obsidianClient.openFile("notes/test.md")).rejects.toThrow("Failed to connect to vault");
    });

    test("should handle missing active vault", async () => {
      // Remove all vaults
      await vaultManager.removeVault("test");

      await expect(obsidianClient.openFile("notes/test.md")).rejects.toThrow("No active vault configured");
    });

    test("should handle special characters in file path", async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({}));

      const specialPath = "notes/file with spaces & symbols!.md";
      
      await obsidianClient.openFile(specialPath, true);

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/open/notes%2Ffile%20with%20spaces%20%26%20symbols!.md?newLeaf=true",
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    test("should not include query parameters when newLeaf is undefined", async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({}));

      await obsidianClient.openFile("test.md");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/open/test.md",
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    test("should handle empty file path", async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({}));

      await obsidianClient.openFile("");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/open/",
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    test("should handle file paths with different vault configurations", async () => {
      await addTestVault(vaultManager, "other", "other-key", "http://localhost:27125", "Other Vault", false);
      
      mockFetch.mockResolvedValueOnce(mockFetchResponse({}));

      await obsidianClient.openFile("test.md", false, "other");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27125/open/test.md?newLeaf=false",
        expect.objectContaining({
          headers: expect.objectContaining({
            "Authorization": "Bearer other-key",
          }),
        })
      );
    });
  });

  describe("error handling", () => {
    test("should handle HTTP 500 errors", async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        })
      );

      await expect(obsidianClient.openFile("test.md")).rejects.toThrow("HTTP 500");
    });

    test("should handle timeout errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Request timeout"));

      await expect(obsidianClient.openFile("test.md")).rejects.toThrow("Failed to connect to vault");
    });
  });
});