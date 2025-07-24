# Obsidian MCP Server

A Model Context Protocol server for Obsidian integration that enables AI assistants to interact with your Obsidian vaults through the Local REST API plugin.

## Features

### Multi-Vault Management
- **Vault Configuration**: Add, remove, and switch between multiple Obsidian vaults
- **Connection Status**: Monitor vault connectivity and API health
- **Active Vault System**: Set and manage the currently active vault for operations

### File Operations
- **Active File Management**: Get, create, update, append to, and delete the currently active file
- **File System Operations**: Full CRUD operations on any file by path
- **Advanced Patching**: Line-based insertions, deletions, and replacements
- **Directory Listing**: Browse vault structure and file organization

### Content Creation & Management
- **Periodic Notes**: Full support for daily, weekly, monthly, quarterly, and yearly notes
- **Structured Editing**: Target-specific modifications using headings, blocks, or frontmatter
- **Content Appending**: Add content to existing files without replacement

### Search & Discovery
- **Simple Text Search**: Basic content search across all vault files with context
- **Advanced Queries**: Dataview DQL queries and JsonLogic-based searches
- **File Navigation**: Open files directly in the Obsidian interface

### System Integration
- **Command Execution**: List and execute any available Obsidian command
- **Server Monitoring**: Check API status and retrieve certificates
- **Configuration Persistence**: Automatic vault configuration management

## Available Tools

<details>
<summary><strong>Vault Management (6 tools)</strong></summary>

- `list_vaults` - List all configured vaults with status
- `add_vault` - Add new vault configuration with API key
- `remove_vault` - Remove vault configuration
- `set_active_vault` - Switch active vault for operations
- `get_active_vault` - Get current active vault info
- `get_vault_info` - Get detailed vault information
</details>

<details>
<summary><strong>Active File Operations (5 tools)</strong></summary>

- `get_active_file` - Get content of currently active file
- `append_to_active_file` - Append content to active file
- `replace_active_file` - Replace entire active file content
- `patch_active_file` - Apply line-based modifications to active file
- `delete_active_file` - Delete the currently active file
</details>

<details>
<summary><strong>File System Operations (6 tools)</strong></summary>

- `get_file` - Get content of specific file by path
- `create_file` - Create new file with content
- `append_to_file` - Append content to existing file
- `replace_file` - Replace entire file content
- `patch_file` - Apply line-based modifications to file
- `delete_file` - Delete specific file by path
</details>

<details>
<summary><strong>Directory Operations (2 tools)</strong></summary>

- `list_vault_files` - List files in vault root or directory
- `list_directory` - List contents of specific directory
</details>

<details>
<summary><strong>Search Operations (2 tools)</strong></summary>

- `simple_search` - Basic text search with context
- `search_vault` - Advanced Dataview DQL and JsonLogic queries
</details>

<details>
<summary><strong>Periodic Notes (5 tools)</strong></summary>

- `get_periodic_note` - Get daily/weekly/monthly/quarterly/yearly notes
- `append_to_periodic_note` - Append to periodic notes
- `replace_periodic_note` - Replace periodic note content
- `patch_periodic_note` - Modify specific sections of periodic notes
- `delete_periodic_note` - Delete periodic notes
</details>

<details>
<summary><strong>System Operations (4 tools)</strong></summary>

- `list_commands` - List all available Obsidian commands
- `execute_command` - Execute specific Obsidian command
- `open_file` - Open file in Obsidian interface
- `get_server_info` - Get API server status
- `get_api_certificate` - Retrieve API certificate
</details>

## Prerequisites

1. **Obsidian** with the **Local REST API** plugin installed and configured
2. **Node.js** 16+ for building and running the server
3. **API Key** generated from the Local REST API plugin settings

## Installation

### From Source

```bash
# Clone the repository
git clone <repository-url>
cd obsidian-mcp

# Install dependencies
npm install

# Build the server
npm run build
```

The built server will be available at `build/index.js` and can be executed via the `obsidian-mcp` command.

## Configuration

### Claude Desktop

Add to your Claude Desktop configuration file:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "obsidian": {
      "command": "node",
      "args": ["/path/to/obsidian-mcp/build/index.js"]
    }
  }
}
```

### Other MCP Clients

For other MCP-compatible clients, use:
- **Command**: `node`
- **Args**: `["/path/to/obsidian-mcp/build/index.js"]`
- **Transport**: stdio

## Usage

### Initial Setup

1. **Install and Configure Local REST API Plugin**:
   - Install the "Local REST API" plugin in Obsidian
   - Enable the plugin and generate an API key
   - Note the server URL (typically `http://localhost:27123`)

2. **Add Your First Vault**:
   ```
   Use the add_vault tool with:
   - name: "my-vault"
   - apiKey: "your-generated-api-key"
   - baseUrl: "http://localhost:27123" (if different)
   ```

3. **Verify Connection**:
   ```
   Use list_vaults to confirm your vault is connected
   ```

### Multi-Vault Workflow

```bash
# Add multiple vaults
add_vault(name="personal", apiKey="key1", baseUrl="http://localhost:27123")
add_vault(name="work", apiKey="key2", baseUrl="http://localhost:27124")

# List all vaults
list_vaults()

# Switch between vaults
set_active_vault(vault="work")

# All subsequent operations use the active vault
get_active_file()
```

### Working with Files

```bash
# Get current active file
get_active_file()

# Create a new file
create_file(path="notes/meeting-notes.md", content="# Meeting Notes\n\n")

# Search across all files
simple_search(query="project deadline")

# Advanced Dataview query
search_vault(query="TABLE file.mtime FROM \"projects\" WHERE completed = false", queryType="dataview")
```

### Periodic Notes

```bash
# Get today's daily note
get_periodic_note(period="daily")

# Append to this week's weekly note
append_to_periodic_note(period="weekly", content="## New Task\n- Complete project review")

# Patch monthly note with specific heading
patch_periodic_note(
  period="monthly", 
  operation="append", 
  targetType="heading", 
  target="Goals", 
  content="- Finish documentation"
)
```

## Configuration Storage

Vault configurations are automatically stored in:
- **MacOS/Linux**: `~/.config/obsidian-mcp/vaults.json`
- **Windows**: `%APPDATA%/obsidian-mcp/vaults.json`

No environment variables required - all configuration is file-based.

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Local Development

Use the MCP Inspector for local testing:

```bash
npm run build
npx @modelcontextprotocol/inspector build/index.js
```

## API Requirements

This server requires:
- **Obsidian** with **Local REST API plugin** installed
- **API key** generated from plugin settings
- **Network access** to Obsidian's REST API server (default: localhost:27123)

## Security Notes

- API keys are stored locally in configuration files
- Server communicates only with local Obsidian instances
- No external network access required
- Configuration files should be kept secure

## License

Licensed under the MIT License. See LICENSE file for details.

## Contributing

Contributions welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.