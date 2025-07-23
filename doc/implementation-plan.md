# Obsidian MCP Server Implementation Plan

## Overview
This document outlines the implementation plan for creating MCP tools that interface with the Obsidian Local REST API. The plan covers all available endpoints and organizes them into logical phases based on priority and functionality.

## API Endpoints Covered
Based on the Obsidian Local REST API documentation, this implementation will cover:

- **System Endpoints**: Server info, OpenAPI spec, certificates
- **Active File Operations**: CRUD operations on currently active file
- **Periodic Note Operations**: Daily/weekly/monthly/quarterly/yearly notes
- **Vault File/Directory Operations**: Complete file system management
- **Search Capabilities**: Advanced and simple search functionality
- **Command Execution**: Execute Obsidian commands
- **Navigation**: Open files in Obsidian interface

## Implementation Phases

### Phase 1: Core Infrastructure (High Priority)
**Timeline: Week 1**

1. **Multi-Vault Configuration System**
   - Implement vault discovery and configuration
   - Support multiple vault configurations via environment variables
   - Vault switching and management tools
   - **Files**: `src/config.ts`, `src/vault-manager.ts`

2. **Authentication Setup**
   - Implement API key configuration and validation per vault
   - Add connection management for Obsidian Local REST API
   - Create base HTTP client with proper headers
   - **Files**: `src/client.ts`

3. **Error Handling Framework**
   - Standardized error responses for API failures
   - Connection status validation
   - Rate limiting and retry logic
   - **Files**: `src/errors.ts`, `src/utils.ts`

### Phase 2: Vault Management Tools (High Priority)
**Timeline: Week 1-2**

4. **list_vaults** - List all configured vaults
5. **get_vault_info** - Get details about a specific vault
6. **set_active_vault** - Switch to a different vault for operations

**Files**: `src/tools/vault-management.ts`

### Phase 3: Active File Operations (High Priority)
**Timeline: Week 2**

7. **get_active_file** - Retrieve currently active file content
8. **append_to_active_file** - Add content to active file
9. **replace_active_file** - Replace entire active file content
10. **patch_active_file** - Modify specific sections of active file
11. **delete_active_file** - Delete the currently active file

**Files**: `src/tools/active-file.ts`

### Phase 4: Vault File Management (High Priority)
**Timeline: Week 2-3**

12. **list_vault_files** - List files in vault root or specific directory
13. **get_file** - Retrieve specific file content by path
14. **create_file** - Create new file with content
15. **append_to_file** - Add content to existing file
16. **replace_file** - Replace entire file content
17. **patch_file** - Modify specific sections of file
18. **delete_file** - Delete specific file
19. **list_directory** - List contents of specific directory

**Files**: `src/tools/vault-files.ts`, `src/tools/vault-directories.ts`

### Phase 5: Search Capabilities (Medium Priority)
**Timeline: Week 3-4**

20. **search_vault** - Advanced search using Dataview/JsonLogic queries
21. **simple_search** - Basic text search across vault

**Files**: `src/tools/search.ts`

### Phase 6: Periodic Notes (Medium Priority)
**Timeline: Week 4**

22. **get_periodic_note** - Retrieve daily/weekly/monthly/quarterly/yearly notes
23. **append_to_periodic_note** - Add content to periodic notes
24. **replace_periodic_note** - Replace periodic note content
25. **patch_periodic_note** - Modify periodic note sections
26. **delete_periodic_note** - Delete periodic notes

**Files**: `src/tools/periodic-notes.ts`

### Phase 7: Command Integration (Low Priority)
**Timeline: Week 5**

27. **list_commands** - Get available Obsidian commands
28. **execute_command** - Run specific Obsidian command

**Files**: `src/tools/commands.ts`

### Phase 8: Navigation (Low Priority)
**Timeline: Week 5**

29. **open_file** - Open specific file in Obsidian interface

**Files**: `src/tools/navigation.ts`

### Phase 9: System Tools (Low Priority)
**Timeline: Week 6**

30. **get_server_info** - Basic server status and details
31. **get_api_certificate** - Retrieve API certificate if needed

**Files**: `src/tools/system.ts`

## Implementation Considerations

### Multi-Vault Configuration Strategy

**Environment Variable Pattern:**
- Format: `{VAULT_NAME}_OBSIDIAN_API_KEY` and `{VAULT_NAME}_OBSIDIAN_BASE_URL`
- Examples:
  - `DEVELOPMENT_OBSIDIAN_API_KEY=abc123...`
  - `DEVELOPMENT_OBSIDIAN_BASE_URL=http://localhost:27123`
  - `PERSONAL_OBSIDIAN_API_KEY=def456...`
  - `PERSONAL_OBSIDIAN_BASE_URL=http://localhost:27124`

**Alternative Configuration (JSON file):**
```json
{
  "vaults": {
    "development": {
      "apiKey": "abc123...",
      "baseUrl": "http://localhost:27123",
      "name": "Development Vault"
    },
    "personal": {
      "apiKey": "def456...",
      "baseUrl": "http://localhost:27124",
      "name": "Personal Notes"
    }
  },
  "defaultVault": "development"
}
```

### Configuration Requirements
- Multi-vault support with environment variables or JSON config
- API key management per vault
- Base URL configuration per vault (supports different ports)
- Default vault selection
- Runtime vault switching
- SSL/TLS certificate handling per vault

### Schema Validation
- Use Zod schemas for all request/response validation
- File path validation and sanitization
- Content type handling (markdown, plaintext, etc.)
- Parameter validation for all endpoints

### Error Handling
- Network connectivity issues
- Authentication failures (401/403)
- File not found scenarios (404)
- Permission errors (403)
- Server errors (500+)
- Timeout handling

### Tool Grouping Strategy
- Group related operations (e.g., all active file operations)
- Implement common patterns for CRUD operations
- Reusable components for file path handling
- Consistent naming conventions across tools
- All tools accept optional `vault` parameter to specify target vault
- Default to active/configured vault if no vault specified

### Testing Strategy
- Unit tests for each tool
- Integration tests with mock Obsidian API
- Error condition testing
- Authentication testing

### Documentation
- JSDoc comments for all functions
- Usage examples for each tool
- Configuration documentation
- Troubleshooting guide

## File Structure
```
src/
├── index.ts              # Main server entry point
├── config.ts             # Configuration management
├── vault-manager.ts      # Multi-vault management
├── client.ts             # HTTP client for Obsidian API
├── errors.ts             # Error handling utilities
├── utils.ts              # Common utilities
├── schemas.ts            # Zod validation schemas
└── tools/
    ├── vault-management.ts # Vault switching and info
    ├── active-file.ts    # Active file operations
    ├── vault-files.ts    # Vault file management
    ├── vault-directories.ts # Directory operations
    ├── search.ts         # Search functionality
    ├── periodic-notes.ts # Periodic notes
    ├── commands.ts       # Command execution
    ├── navigation.ts     # File navigation
    └── system.ts         # System information
```

## Success Criteria
1. All 31 API endpoints implemented as MCP tools (27 original + 4 vault management)
2. Multi-vault configuration and switching functionality
3. Comprehensive error handling and validation
4. Complete documentation with multi-vault examples
5. Working integration with multiple Obsidian Local REST API instances

## Multi-Vault Usage Examples

**Setup via MCP Tools:**
```javascript
// Add a development vault
await server.call("add_vault", {
  name: "development",
  apiKey: "dev-api-key-123",
  baseUrl: "http://localhost:27123",
  displayName: "Development Vault",
  setAsActive: true
});

// Add a personal vault
await server.call("add_vault", {
  name: "personal", 
  apiKey: "personal-api-key-456",
  baseUrl: "http://localhost:27124",
  displayName: "Personal Notes"
});
```

**Vault Management:**
```javascript
// List all configured vaults
await server.call("list_vaults");

// Get vault information
await server.call("get_vault_info", { vault: "development" });

// Switch to personal vault
await server.call("set_active_vault", { vault: "personal" });

// Get current active vault
await server.call("get_active_vault");

// Remove a vault
await server.call("remove_vault", { vault: "old_vault" });
```

**File Operations:**
```javascript
// Get file from specific vault (without switching)
await server.call("get_file", {
  path: "notes/meeting.md",
  vault: "development"
});

// Create file in active vault
await server.call("create_file", {
  path: "daily/2024-01-15.md",
  content: "# Daily Note\n\n"
});
```