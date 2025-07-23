import { VaultManager } from "../../src/vault-manager.js";
import { ObsidianClient } from "../../src/client.js";
import {
  createMcpTestServer,
  addTestVault,
  setupFetchMock,
  mockFetchResponse,
  type McpTestContext,
} from "../utils/mcpTestServer.js";

describe("Active File Client Operations", () => {
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

  describe("getActiveFile", () => {
    test("should retrieve active file content", async () => {
      const mockContent = "# Active File\n\nThis is the content.";
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          headers: { "content-type": "text/plain" },
          text: mockContent,
        })
      );

      const result = await obsidianClient.getActiveFile();

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/active/",
        {
          method: "GET",
          headers: {
            "Authorization": "Bearer test-api-key",
            "Content-Type": "application/json",
          },
        }
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

      await obsidianClient.getActiveFile("vault2");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27124/active/",
        expect.objectContaining({
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
          json: { error: "No active file" },
        })
      );

      await expect(obsidianClient.getActiveFile()).rejects.toThrow("HTTP 404");
    });
  });

  describe("appendToActiveFile", () => {
    test("should append content to active file", async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({}));

      await obsidianClient.appendToActiveFile("\n\nNew content added.");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/active/",
        {
          method: "POST",
          headers: {
            "Authorization": "Bearer test-api-key",
            "Content-Type": "text/plain",
          },
          body: "\n\nNew content added.",
        }
      );
    });
  });

  describe("replaceActiveFile", () => {
    test("should replace active file content", async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({}));

      const newContent = "# Replaced Content\n\nThis is the new content.";
      await obsidianClient.replaceActiveFile(newContent);

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/active/",
        {
          method: "PUT",
          headers: {
            "Authorization": "Bearer test-api-key",
            "Content-Type": "text/plain",
          },
          body: newContent,
        }
      );
    });

    test("should allow empty content", async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({}));

      await obsidianClient.replaceActiveFile("");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/active/",
        {
          method: "PUT",
          headers: {
            "Authorization": "Bearer test-api-key",
            "Content-Type": "text/plain",
          },
          body: "",
        }
      );
    });
  });

  describe("deleteActiveFile", () => {
    test("should delete active file", async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({}));

      await obsidianClient.deleteActiveFile();

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/active/",
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

      await expect(obsidianClient.deleteActiveFile()).rejects.toThrow("HTTP 404");
    });
  });

  describe("error handling", () => {
    test("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(obsidianClient.getActiveFile()).rejects.toThrow("Failed to connect to vault");
    });

    test("should handle missing active vault", async () => {
      // Remove all vaults
      await vaultManager.removeVault("test");

      await expect(obsidianClient.getActiveFile()).rejects.toThrow("No active vault configured");
    });
  });
});