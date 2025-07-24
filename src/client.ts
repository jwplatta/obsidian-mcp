import { VaultConfig } from "./schemas.js";
import { VaultManager } from "./vault-manager.js";
import { logger, LogLevel } from "./logger.js";
import https from "https";

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
    logger.setLevel(LogLevel.DEBUG);

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    logger.info("ObsidianClient initialized");
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
      logger.debug(`Using specified vault: ${vault}`);
      vaultConfig = await this.vaultManager.getVault(vault);
    } else {
      const activeVault = await this.vaultManager.getActiveVault();
      if (!activeVault) {
        const error = "No active vault configured. Please set an active vault or specify a vault name.";
        logger.error(error);
        throw new Error(error);
      }
      logger.debug(`Using active vault: ${activeVault.name}`);
      vaultConfig = activeVault;
    }

    logger.debug(`Vault configuration for ${vaultConfig.name}:`, vaultConfig);

    const baseUrl = vaultConfig.baseUrl.replace(/\/$/, "");
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

    logger.debug(`Request options:`, {
      method,
      url,
      hasAuth: requestHeaders.Authorization ? 'yes' : 'no',
      contentType: requestHeaders['Content-Type']
    });

    if (body !== undefined && (method === "POST" || method === "PUT" || method === "PATCH")) {
      requestOptions.body = typeof body === "string" ? body : JSON.stringify(body);
    }

    logger.debug(`Making ${method} request to ${url}`, {
      vault: vaultConfig.name,
      endpoint,
      hasBody: body !== undefined,
      bodyLength: typeof body === 'string' ? body.length : JSON.stringify(body || {}).length
    });

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
        const error = new ObsidianAPIError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          responseData
        );
        logger.error(`API request failed: ${method} ${url}`, {
          status: response.status,
          statusText: response.statusText,
          vault: vaultConfig.name,
          responseData
        });
        throw error;
      }

      logger.debug(`API request successful: ${method} ${url}`, {
        status: response.status,
        vault: vaultConfig.name,
        responseType: contentType,
        responseLength: typeof responseData === 'string' ? responseData.length : JSON.stringify(responseData).length
      });

      return responseData;
    } catch (error) {
      if (error instanceof ObsidianAPIError) {
        throw error;
      }

      const vaultName = vault || (await this.vaultManager.getActiveVault())?.name || "unknown";
      const connectionError = new VaultConnectionError(vaultName, error as Error);
      logger.error(`Connection error for vault ${vaultName}`, {
        endpoint,
        method,
        url,
        originalError: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        errorCode: (error as any)?.code,
        errorCause: (error as any)?.cause,
        vault: vaultName
      });
      throw connectionError;
    }
  }

  /**
   * Test connection to a vault
   */
  async testConnection(vaultName?: string): Promise<boolean> {
    try {
      logger.info(`Testing connection to vault: ${vaultName || 'active vault'}`);
      await this.request("/", { vault: vaultName });
      logger.info(`Connection successful to vault: ${vaultName || 'active vault'}`);
      return true;
    } catch (error) {
      logger.warn(`Connection failed to vault: ${vaultName || 'active vault'}`, {
        error: error instanceof Error ? error.message : String(error)
      });
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
    logger.info(`Getting active file content`, { vault: vaultName });
    return this.request("/active/", { vault: vaultName });
  }

  /**
   * Append content to active file
   */
  async appendToActiveFile(content: string, vaultName?: string): Promise<void> {
    logger.info(`Appending content to active file`, { vault: vaultName, contentLength: content.length });
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
    logger.info(`Replacing active file content`, { vault: vaultName, contentLength: content.length });
    await this.request("/active/", {
      method: "PUT",
      body: content,
      headers: { "Content-Type": "text/plain" },
      vault: vaultName,
    });
  }

  /**
   * Patch active file with specific line operations
   */
  async patchActiveFile(patchData: any, vaultName?: string): Promise<void> {
    logger.info(`Patching active file`, { vault: vaultName });
    await this.request("/active/", {
      method: "PATCH",
      body: patchData,
      vault: vaultName,
    });
  }

  /**
   * Delete active file
   */
  async deleteActiveFile(vaultName?: string): Promise<void> {
    logger.warn(`Deleting active file`, { vault: vaultName });
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
   * Patch file with specific line operations
   */
  async patchFile(filePath: string, patchData: any, vaultName?: string): Promise<void> {
    await this.request(`/vault/${encodeURIComponent(filePath)}`, {
      method: "PATCH",
      body: patchData,
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
  async simpleSearch(query: string, contextLength?: number, vaultName?: string): Promise<any> {
    const params = new URLSearchParams({ query });
    if (contextLength !== undefined) {
      params.set('contextLength', contextLength.toString());
    }
    
    return this.request(`/search/simple/?${params.toString()}`, {
      method: "POST",
      body: "",
      headers: { "Content-Type": "text/plain" },
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

  /**
   * Get periodic note content
   */
  async getPeriodicNote(period: string, date?: string, vaultName?: string): Promise<string> {
    const endpoint = date 
      ? `/periodic-notes/${encodeURIComponent(period)}/${encodeURIComponent(date)}/`
      : `/periodic-notes/${encodeURIComponent(period)}/`;
    
    logger.info(`Getting periodic note`, { period, date, vault: vaultName });
    return this.request(endpoint, { vault: vaultName });
  }

  /**
   * Append content to periodic note
   */
  async appendToPeriodicNote(period: string, content: string, date?: string, vaultName?: string): Promise<void> {
    const endpoint = date
      ? `/periodic-notes/${encodeURIComponent(period)}/${encodeURIComponent(date)}/`
      : `/periodic-notes/${encodeURIComponent(period)}/`;
    
    logger.info(`Appending content to periodic note`, { period, date, vault: vaultName, contentLength: content.length });
    await this.request(endpoint, {
      method: "POST",
      body: content,
      headers: { "Content-Type": "text/plain" },
      vault: vaultName,
    });
  }

  /**
   * Replace periodic note content
   */
  async replacePeriodicNote(period: string, content: string, date?: string, vaultName?: string): Promise<void> {
    const endpoint = date
      ? `/periodic-notes/${encodeURIComponent(period)}/${encodeURIComponent(date)}/`
      : `/periodic-notes/${encodeURIComponent(period)}/`;
    
    logger.info(`Replacing periodic note content`, { period, date, vault: vaultName, contentLength: content.length });
    await this.request(endpoint, {
      method: "PUT",
      body: content,
      headers: { "Content-Type": "text/plain" },
      vault: vaultName,
    });
  }

  /**
   * Patch periodic note with specific line operations
   */
  async patchPeriodicNote(period: string, patchData: any, date?: string, vaultName?: string): Promise<void> {
    const endpoint = date
      ? `/periodic-notes/${encodeURIComponent(period)}/${encodeURIComponent(date)}/`
      : `/periodic-notes/${encodeURIComponent(period)}/`;
    
    logger.info(`Patching periodic note`, { period, date, vault: vaultName });
    await this.request(endpoint, {
      method: "PATCH",
      body: patchData,
      vault: vaultName,
    });
  }

  /**
   * Delete periodic note
   */
  async deletePeriodicNote(period: string, date?: string, vaultName?: string): Promise<void> {
    const endpoint = date
      ? `/periodic-notes/${encodeURIComponent(period)}/${encodeURIComponent(date)}/`
      : `/periodic-notes/${encodeURIComponent(period)}/`;
    
    logger.warn(`Deleting periodic note`, { period, date, vault: vaultName });
    await this.request(endpoint, {
      method: "DELETE",
      vault: vaultName,
    });
  }
}