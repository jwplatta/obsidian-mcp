import { writeFile, mkdir } from "fs/promises";
import { dirname, resolve } from "path";
import { homedir } from "os";

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LoggerConfig {
  level: LogLevel;
  filePath: string;
  enableConsole: boolean;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: any;
}

export class Logger {
  private config: LoggerConfig;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: LogLevel.INFO,
      filePath: resolve(homedir(), ".config", "obsidian-mcp", "logs", "mcp-server.log"),
      enableConsole: false,
      ...config,
    };
  }

  async ensureLogDirectory(): Promise<void> {
    const logDir = dirname(this.config.filePath);
    try {
      await mkdir(logDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }
  }

  private formatLogEntry(level: string, message: string, context?: any): string {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };
    return JSON.stringify(entry) + "\n";
  }

  private async writeToFile(content: string): Promise<void> {
    await this.ensureLogDirectory();
    await writeFile(this.config.filePath, content, { flag: "a" });
  }

  private async log(level: LogLevel, levelName: string, message: string, context?: any): Promise<void> {
    if (level > this.config.level) {
      return;
    }

    const logContent = this.formatLogEntry(levelName, message, context);

    if (this.config.enableConsole) {
      console.log(logContent.trim());
    }

    // Queue writes to prevent race conditions
    this.writeQueue = this.writeQueue.then(() => this.writeToFile(logContent));
    await this.writeQueue;
  }

  async error(message: string, context?: any): Promise<void> {
    await this.log(LogLevel.ERROR, "ERROR", message, context);
  }

  async warn(message: string, context?: any): Promise<void> {
    await this.log(LogLevel.WARN, "WARN", message, context);
  }

  async info(message: string, context?: any): Promise<void> {
    await this.log(LogLevel.INFO, "INFO", message, context);
  }

  async debug(message: string, context?: any): Promise<void> {
    await this.log(LogLevel.DEBUG, "DEBUG", message, context);
  }

  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  getLogPath(): string {
    return this.config.filePath;
  }
}

// Default logger instance
export const logger = new Logger();