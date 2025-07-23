# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server for Obsidian integration. The project provides a TypeScript-based MCP server with multi-vault support for managing multiple Obsidian instances through the Local REST API plugin.

## Architecture

- **Entry Point**: `src/index.ts` - Main MCP server implementation
- **Server Type**: MCP Server using `@modelcontextprotocol/sdk`
- **Transport**: StdioServerTransport for communication
- **Build Output**: Compiled JavaScript in `build/` directory
- **Binary**: Executable at `build/index.js` (accessible via `obsidian-mcp` command)

### Multi-Vault System
- **VaultManager**: `src/vault-manager.ts` - Manages vault configurations and persistence
- **ObsidianClient**: `src/client.ts` - HTTP client with vault-aware requests
- **Config**: `src/config.ts` - Configuration management
- **Tools**: `src/tools/vault-management.ts` - MCP tools for vault operations

## Development Commands

```bash
# Build the project (compiles TypeScript and makes binary executable)
npm run build

# No tests are currently configured
npm test  # Will fail - no tests specified
```

## TypeScript Configuration

- **Target**: ES2022
- **Module System**: Node16 with Node16 module resolution
- **Output**: `build/` directory
- **Source**: `src/` directory
- **Strict mode**: Enabled

## Key Dependencies

- `@modelcontextprotocol/sdk`: Core MCP functionality
- `obsidian`: Obsidian API integration
- `zod`: Schema validation

## Available MCP Tools

### Vault Management
- `list_vaults` - List all configured vaults with connection status
- `get_vault_info` - Get detailed information about a specific vault  
- `set_active_vault` - Switch to a different vault for operations
- `add_vault` - Add new vault configuration with API key
- `remove_vault` - Remove vault configuration
- `get_active_vault` - Get currently active vault information

### Configuration
- Vault configurations stored in `~/.config/obsidian-mcp/vaults.json`
- No environment variable dependency - pure config-file approach
- Automatic persistence of vault settings and active state

## Usage
All vault operations are managed through MCP tools. Use `add_vault` to configure new Obsidian instances, then switch between them using `set_active_vault` or specify vault per operation.