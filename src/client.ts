import { VaultConfig } from "./schemas.js";
import { VaultManager } from "./vault-manager.js";

export class ObsidianAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = "ObsidianAPIError";
  }
}

export class VaultConnectionError extends Error {
  constructor(vaultName: string, originalError: Error) {
    super(`Failed to connect to vault '${vaultName}': ${originalError.message}`);
    this.name = "VaultConnectionError";
  }
}

/**
 * HTTP client for making requests to Obsidian Local REST API
 */
export class ObsidianClient {
  private vaultManager: VaultManager;

  constructor(vaultManager: VaultManager) {
    this.vaultManager = vaultManager;
  }

  /**
   * Make a request to a specific vault
   */
  async request(
    endpoint: string,
    options: {
      method?: string;
      body?: any;
      headers?: Record<string, string>;
      vault?: string;
    } = {}
  ): Promise<any> {
    const { method = "GET", body, headers = {}, vault } = options;

    let vaultConfig: VaultConfig;
    if (vault) {
      vaultConfig = await this.vaultManager.getVault(vault);
    } else {
      const activeVault = await this.vaultManager.getActiveVault();
      if (!activeVault) {
        throw new Error("No active vault configured. Please set an active vault or specify a vault name.");
      }
      vaultConfig = activeVault;
    }

    const baseUrl = vaultConfig.baseUrl.replace(/\/$/, ""); // Remove trailing slash
    const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`;
    const requestHeaders: Record<string, string> = {
      "Authorization": `Bearer ${vaultConfig.apiKey}`,
      "Content-Type": "application/json",
      ...headers,
    };
    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
      requestOptions.body = typeof body === "string" ? body : JSON.stringify(body);
    }

    try {
      const response = await fetch(url, requestOptions);
      let responseData: any;
      const contentType = response.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      if (!response.ok) {
        throw new ObsidianAPIError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          responseData
        );
      }

      return responseData;
    } catch (error) {
      if (error instanceof ObsidianAPIError) {
        throw error;
      }

      const vaultName = vault || (await this.vaultManager.getActiveVault())?.name || "unknown";
      throw new VaultConnectionError(vaultName, error as Error);
    }
  }

  /**
   * Test connection to a vault
   */
  async testConnection(vaultName?: string): Promise<boolean> {
    try {
      await this.request("/", { vault: vaultName });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get server information from a vault
   */
  async getServerInfo(vaultName?: string): Promise<any> {
    return this.request("/", { vault: vaultName });
  }

  /**
   * Get active file content
   */
  async getActiveFile(vaultName?: string): Promise<string> {
    return this.request("/active/", { vault: vaultName });
  }

  /**
   * Append content to active file
   */
  async appendToActiveFile(content: string, vaultName?: string): Promise<void> {
    await this.request("/active/", {
      method: "POST",
      body: content,
      headers: { "Content-Type": "text/plain" },
      vault: vaultName,
    });
  }

  /**
   * Replace active file content
   */
  async replaceActiveFile(content: string, vaultName?: string): Promise<void> {
    await this.request("/active/", {
      method: "PUT",
      body: content,
      headers: { "Content-Type": "text/plain" },
      vault: vaultName,
    });
  }

  /**
   * Delete active file
   */
  async deleteActiveFile(vaultName?: string): Promise<void> {
    await this.request("/active/", {
      method: "DELETE",
      vault: vaultName,
    });
  }

  /**
   * Get file content
   */
  async getFile(filePath: string, vaultName?: string): Promise<string> {
    return this.request(`/vault/${encodeURIComponent(filePath)}`, { vault: vaultName });
  }

  /**
   * Create or replace file
   */
  async createFile(filePath: string, content: string, vaultName?: string): Promise<void> {
    await this.request(`/vault/${encodeURIComponent(filePath)}`, {
      method: "PUT",
      body: content,
      headers: { "Content-Type": "text/plain" },
      vault: vaultName,
    });
  }

  /**
   * Append to file
   */
  async appendToFile(filePath: string, content: string, vaultName?: string): Promise<void> {
    await this.request(`/vault/${encodeURIComponent(filePath)}`, {
      method: "POST",
      body: content,
      headers: { "Content-Type": "text/plain" },
      vault: vaultName,
    });
  }

  /**
   * Delete file
   */
  async deleteFile(filePath: string, vaultName?: string): Promise<void> {
    await this.request(`/vault/${encodeURIComponent(filePath)}`, {
      method: "DELETE",
      vault: vaultName,
    });
  }

  /**
   * List directory contents
   */
  async listDirectory(dirPath: string = "", vaultName?: string): Promise<string[]> {
    const encodedPath = dirPath ? encodeURIComponent(dirPath) : "";
    return this.request(`/vault/${encodedPath}/`, { vault: vaultName });
  }

  /**
   * Search vault content
   */
  async searchVault(query: any, vaultName?: string): Promise<any> {
    return this.request("/search/", {
      method: "POST",
      body: query,
      vault: vaultName,
    });
  }

  /**
   * Simple text search
   */
  async simpleSearch(query: string, vaultName?: string): Promise<any> {
    return this.request("/search/simple/", {
      method: "POST",
      body: { query },
      vault: vaultName,
    });
  }

  /**
   * Open file in Obsidian
   */
  async openFile(filePath: string, vaultName?: string): Promise<void> {
    await this.request(`/open/${encodeURIComponent(filePath)}`, {
      method: "POST",
      vault: vaultName,
    });
  }

  /**
   * List available commands
   */
  async listCommands(vaultName?: string): Promise<any> {
    return this.request("/commands/", { vault: vaultName });
  }

  /**
   * Execute command
   */
  async executeCommand(commandId: string, vaultName?: string): Promise<any> {
    return this.request(`/commands/${encodeURIComponent(commandId)}/`, {
      method: "POST",
      vault: vaultName,
    });
  }
}