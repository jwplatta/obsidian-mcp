import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { VaultManager } from "../../src/vault-manager.js";
import { ObsidianClient } from "../../src/client.js";
import { Config } from "../../src/config.js";
import fs from "fs/promises";
import path from "path";
import { tmpdir } from "os";

export interface McpTestContext {
  server: McpServer;
  vaultManager: VaultManager;
  obsidianClient: ObsidianClient;
  tempConfigDir: string;
  tempConfigFile: string;
  cleanup: () => Promise<void>;
}

export async function createMcpTestServer(): Promise<McpTestContext> {
  const tempConfigDir = await fs.mkdtemp(path.join(tmpdir(), "obsidian-mcp-test-"));
  const tempConfigFile = path.join(tempConfigDir, "vaults.json");

  const server = new McpServer({
    name: "test-server",
    version: "1.0.0",
    capabilities: { resources: {}, tools: {} },
  });

  const vaultManager = new VaultManager();
  const config = Config.getInstance();
  config.setConfigFile(tempConfigFile);

  const obsidianClient = new ObsidianClient(vaultManager);

  await vaultManager.initialize();

  const cleanup = async () => {
    try {
      await fs.rm(tempConfigDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  };

  return {
    server,
    vaultManager,
    obsidianClient,
    tempConfigDir,
    tempConfigFile,
    cleanup,
  };
}

export async function addTestVault(
  vaultManager: VaultManager,
  name: string = "test",
  apiKey: string = "test-api-key",
  baseUrl: string = "http://localhost:27123",
  displayName: string = "Test Vault",
  setAsActive: boolean = true
): Promise<void> {
  await vaultManager.addVault(name, apiKey, baseUrl, displayName, setAsActive);
}

export interface MockCallHandler {
  (request: any): Promise<any>;
}

export function createMockCallHandler(handlers: Record<string, MockCallHandler>) {
  return async (request: any) => {
    const toolName = request.params?.name;
    const handler = handlers[toolName];

    if (!handler) {
      throw new Error(`No handler found for tool: ${toolName}`);
    }

    return handler(request);
  };
}

export function mockSuccessResponse(text: string) {
  return {
    content: [
      {
        type: "text",
        text,
      },
    ],
  };
}

export function mockErrorResponse(text: string) {
  return {
    content: [
      {
        type: "text",
        text,
      },
    ],
    isError: true,
  };
}

export async function callTool(
  server: McpServer,
  toolName: string,
  arguments_: any = {}
): Promise<any> {
  // Access the internal tools registry
  const tools = (server as any)._tools;

  if (!tools || !tools.has(toolName)) {
    throw new Error(`Tool '${toolName}' not found`);
  }

  const tool = tools.get(toolName);

  // Call the tool handler directly
  return tool.handler(arguments_);
}

export function setupFetchMock() {
  const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
  global.fetch = mockFetch;
  return mockFetch;
}

export function mockFetchResponse(options: {
  ok?: boolean;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  text?: string;
  json?: any;
}): Response {
  const {
    ok = true,
    status = 200,
    statusText = "OK",
    headers = {},
    text = "",
    json,
  } = options;

  const responseHeaders = new Headers(headers);

  return {
    ok,
    status,
    statusText,
    headers: responseHeaders,
    text: () => Promise.resolve(text),
    json: () => Promise.resolve(json || {}),
  } as Response;
}