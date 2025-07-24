import { VaultManager } from "../../src/vault-manager.js";
import { ObsidianClient } from "../../src/client.js";
import {
  createMcpTestServer,
  addTestVault,
  setupFetchMock,
  mockFetchResponse,
  type McpTestContext,
} from "../utils/mcpTestServer.js";

describe("Periodic Notes Client Operations", () => {
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

  describe("getPeriodicNote", () => {
    test("should get daily note without specific date", async () => {
      const mockContent = "# Daily Note\n\n## Tasks\n- Review emails";
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          headers: { "content-type": "text/plain" },
          text: mockContent,
        })
      );

      const result = await obsidianClient.getPeriodicNote("daily");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/periodic-notes/daily/",
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

    test("should get weekly note with specific date", async () => {
      const mockContent = "# Weekly Note\n\n## Goals for this week";
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          headers: { "content-type": "text/plain" },
          text: mockContent,
        })
      );

      const result = await obsidianClient.getPeriodicNote("weekly", "2024-01-15");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/periodic-notes/weekly/2024-01-15/",
        expect.objectContaining({
          method: "GET",
        })
      );

      expect(result).toBe(mockContent);
    });

    test("should use specified vault", async () => {
      await addTestVault(vaultManager, "vault2", "vault2-key", "http://localhost:27124", "Vault 2", false);

      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          headers: { "content-type": "text/plain" },
          text: "# Vault 2 Daily Note",
        })
      );

      await obsidianClient.getPeriodicNote("daily", undefined, "vault2");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27124/periodic-notes/daily/",
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
          json: { error: "Note not found" },
        })
      );

      await expect(obsidianClient.getPeriodicNote("daily")).rejects.toThrow("HTTP 404");
    });
  });

  describe("appendToPeriodicNote", () => {
    test("should append content to monthly note", async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({}));

      await obsidianClient.appendToPeriodicNote("monthly", "\n\n## New Section\n- Additional content");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/periodic-notes/monthly/",
        {
          method: "POST",
          headers: {
            "Authorization": "Bearer test-api-key",
            "Content-Type": "text/plain",
          },
          body: "\n\n## New Section\n- Additional content",
        }
      );
    });

    test("should append with specific date", async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({}));

      await obsidianClient.appendToPeriodicNote("quarterly", "\n## Q1 Goals", "2024-01-01");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/periodic-notes/quarterly/2024-01-01/",
        expect.objectContaining({
          method: "POST",
          body: "\n## Q1 Goals",
        })
      );
    });

    test("should handle append errors", async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        })
      );

      await expect(
        obsidianClient.appendToPeriodicNote("daily", "New content")
      ).rejects.toThrow("HTTP 500");
    });
  });

  describe("replacePeriodicNote", () => {
    test("should replace yearly note content", async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({}));

      const newContent = "# 2024 Goals\n\n## Professional\n- Complete projects";

      await obsidianClient.replacePeriodicNote("yearly", newContent, "2024-01-01");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/periodic-notes/yearly/2024-01-01/",
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

      await obsidianClient.replacePeriodicNote("daily", "");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/periodic-notes/daily/",
        expect.objectContaining({
          method: "PUT",
          body: "",
        })
      );
    });
  });

  describe("patchPeriodicNote", () => {
    test("should patch with insert operation", async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({}));

      const patchData = {
        operation: "insert",
        startLine: 5,
        endLine: undefined,
        content: "## New Meeting Notes\n- Discussed project timeline",
      };

      await obsidianClient.patchPeriodicNote("weekly", patchData);

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/periodic-notes/weekly/",
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

    test("should patch with replace operation", async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({}));

      const patchData = {
        operation: "replace",
        startLine: 2,
        endLine: 4,
        content: "## Updated Tasks\n- New priority items",
      };

      await obsidianClient.patchPeriodicNote("daily", patchData, "2024-01-15");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/periodic-notes/daily/2024-01-15/",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify(patchData),
        })
      );
    });

    test("should patch with delete operation", async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({}));

      const patchData = {
        operation: "delete",
        startLine: 10,
        endLine: 12,
        content: undefined,
      };

      await obsidianClient.patchPeriodicNote("monthly", patchData);

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/periodic-notes/monthly/",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify(patchData),
        })
      );
    });

    test("should handle patch errors", async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          ok: false,
          status: 400,
          statusText: "Bad Request",
          headers: { "content-type": "application/json" },
          json: { error: "Invalid patch operation" },
        })
      );

      const patchData = {
        operation: "insert",
        startLine: 0,
        endLine: undefined,
        content: "New content",
      };

      await expect(
        obsidianClient.patchPeriodicNote("daily", patchData)
      ).rejects.toThrow("HTTP 400");
    });
  });

  describe("deletePeriodicNote", () => {
    test("should delete daily note", async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({}));

      await obsidianClient.deletePeriodicNote("daily", "2024-01-15");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/periodic-notes/daily/2024-01-15/",
        {
          method: "DELETE",
          headers: {
            "Authorization": "Bearer test-api-key",
            "Content-Type": "application/json",
          },
        }
      );
    });

    test("should delete current period note without date", async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({}));

      await obsidianClient.deletePeriodicNote("weekly");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/periodic-notes/weekly/",
        expect.objectContaining({
          method: "DELETE",
        })
      );
    });

    test("should handle deletion errors", async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          ok: false,
          status: 404,
          statusText: "Not Found",
          headers: { "content-type": "application/json" },
          json: { error: "Note not found" },
        })
      );

      await expect(obsidianClient.deletePeriodicNote("monthly")).rejects.toThrow("HTTP 404");
    });
  });

  describe("error handling", () => {
    test("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(obsidianClient.getPeriodicNote("daily")).rejects.toThrow("Failed to connect to vault");
    });

    test("should handle missing active vault", async () => {
      // Remove all vaults
      await vaultManager.removeVault("test");

      await expect(obsidianClient.getPeriodicNote("daily")).rejects.toThrow("No active vault configured");
    });
  });

  describe("period types validation", () => {
    test("should handle all period types", async () => {
      const periods = ["daily", "weekly", "monthly", "quarterly", "yearly"] as const;
      
      for (const period of periods) {
        mockFetch.mockResolvedValueOnce(
          mockFetchResponse({
            headers: { "content-type": "text/plain" },
            text: `# ${period} note`,
          })
        );

        const result = await obsidianClient.getPeriodicNote(period);
        expect(result).toBe(`# ${period} note`);
      }
    });
  });
});