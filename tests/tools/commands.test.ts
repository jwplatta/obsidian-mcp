import { VaultManager } from "../../src/vault-manager.js";
import { ObsidianClient } from "../../src/client.js";
import {
  createMcpTestServer,
  addTestVault,
  setupFetchMock,
  mockFetchResponse,
  type McpTestContext,
} from "../utils/mcpTestServer.js";

describe("Command Client Operations", () => {
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

  describe("listCommands", () => {
    test("should list available commands", async () => {
      const mockCommands = {
        commands: [
          {
            id: "editor:save-file",
            name: "Save current file"
          },
          {
            id: "editor:follow-link",
            name: "Follow link under cursor"
          },
          {
            id: "workspace:split-vertical",
            name: "Split pane vertically"
          }
        ]
      };

      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          headers: { "content-type": "application/json" },
          json: mockCommands,
        })
      );

      const result = await obsidianClient.listCommands();

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/commands/",
        {
          method: "GET",
          headers: {
            "Authorization": "Bearer test-api-key",
            "Content-Type": "application/json",
          },
        }
      );

      expect(result).toEqual(mockCommands);
    });

    test("should use specified vault", async () => {
      await addTestVault(vaultManager, "vault2", "vault2-key", "http://localhost:27124", "Vault 2", false);

      const mockCommands = { commands: [] };
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          headers: { "content-type": "application/json" },
          json: mockCommands,
        })
      );

      await obsidianClient.listCommands("vault2");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27124/commands/",
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
          status: 500,
          statusText: "Internal Server Error",
          headers: { "content-type": "application/json" },
          json: { error: "Server error" },
        })
      );

      await expect(obsidianClient.listCommands()).rejects.toThrow("HTTP 500");
    });
  });

  describe("executeCommand", () => {
    test("should execute command successfully", async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          status: 200,
          headers: { "content-type": "application/json" },
          json: {},
        })
      );

      const result = await obsidianClient.executeCommand("editor:save-file");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/commands/editor%3Asave-file/",
        {
          method: "POST",
          headers: {
            "Authorization": "Bearer test-api-key",
            "Content-Type": "application/json",
          },
        }
      );

      expect(result).toEqual({});
    });

    test("should execute command with result data", async () => {
      const commandResult = { status: "completed", data: "some result" };
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          status: 200,
          headers: { "content-type": "application/json" },
          json: commandResult,
        })
      );

      const result = await obsidianClient.executeCommand("workspace:split-vertical");

      expect(result).toEqual(commandResult);
    });

    test("should use specified vault", async () => {
      await addTestVault(vaultManager, "vault2", "vault2-key", "http://localhost:27124", "Vault 2", false);

      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          status: 200,
          headers: { "content-type": "application/json" },
          json: {},
        })
      );

      await obsidianClient.executeCommand("editor:follow-link", "vault2");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27124/commands/editor%3Afollow-link/",
        expect.objectContaining({
          headers: expect.objectContaining({
            "Authorization": "Bearer vault2-key",
          }),
        })
      );
    });

    test("should handle command execution errors", async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          ok: false,
          status: 404,
          statusText: "Not Found",
          headers: { "content-type": "application/json" },
          json: { error: "Command not found" },
        })
      );

      await expect(obsidianClient.executeCommand("invalid:command")).rejects.toThrow("HTTP 404");
    });

    test("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(obsidianClient.executeCommand("editor:save-file")).rejects.toThrow("Failed to connect to vault");
    });

    test("should properly encode command IDs", async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({
          status: 200,
          headers: { "content-type": "application/json" },
          json: {},
        })
      );

      await obsidianClient.executeCommand("editor:open-link-in-new-leaf");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:27123/commands/editor%3Aopen-link-in-new-leaf/",
        expect.objectContaining({
          method: "POST",
        })
      );
    });
  });

  describe("error handling", () => {
    test("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(obsidianClient.listCommands()).rejects.toThrow("Failed to connect to vault");
    });

    test("should handle missing active vault", async () => {
      // Remove all vaults
      await vaultManager.removeVault("test");

      await expect(obsidianClient.listCommands()).rejects.toThrow("No active vault configured");
    });
  });
});