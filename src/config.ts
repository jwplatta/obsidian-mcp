/**
 * Configuration module for Obsidian MCP Server
 * All vault configuration is now managed through MCP tools and persisted to JSON file
 */

/**
 * Configuration class for managing application settings
 */
export class Config {
  private static instance: Config;
  private _configDir: string;
  private _configFile: string;

  private constructor() {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '.';
    this._configDir = `${homeDir}/.config/obsidian-mcp`;
    this._configFile = `${this._configDir}/vaults.json`;
  }

  static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  get configDir(): string {
    return this._configDir;
  }

  get configFile(): string {
    return this._configFile;
  }

  /**
   * Gets the vault configuration file path for testing
   */
  setConfigFile(path: string): void {
    this._configFile = path;
  }
}