# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server for Obsidian integration. The project provides a TypeScript-based MCP server that can be used to extend Claude's capabilities with Obsidian-specific functionality.

## Architecture

- **Entry Point**: `src/index.ts` - Main MCP server implementation
- **Server Type**: MCP Server using `@modelcontextprotocol/sdk`
- **Transport**: StdioServerTransport for communication
- **Build Output**: Compiled JavaScript in `build/` directory
- **Binary**: Executable at `build/index.js` (accessible via `obsidian-mcp` command)

The server currently includes weather API examples that should be replaced with Obsidian-specific tools and resources.

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

## Current State

The codebase contains placeholder weather API functionality that demonstrates MCP tool implementation patterns. This should be replaced with Obsidian-specific tools for vault operations, note management, and plugin interactions.