# Dataview Query Examples for Obsidian MCP

This document provides comprehensive examples of Dataview queries that can be used with the `search_vault` tool in the Obsidian MCP server. These examples cover most of the Dataview Query Language (DQL) capabilities.

## Query Structure

All Dataview queries follow this structure:
```
QUERY-TYPE [fields] FROM [source] [DATA-COMMAND] [expression]
```

### Basic Table Queries

**List all files with their creation and modification dates:**
```dataview
TABLE file.ctime, file.mtime
FROM ""
```

**Show files with specific metadata fields:**
```dataview
TABLE author, status, tags
FROM #project
```

**Table with computed fields:**
```dataview
TABLE file.name, file.size, round(file.size / 1024, 2) as "Size (KB)"
FROM ""
WHERE file.size > 1000
```

### Advanced Table Queries

**Files grouped by folder with word count:**
```dataview
TABLE length(file.tasks) as "Tasks", length(file.outlinks) as "Links", file.words as "Words"
FROM ""
WHERE file.words > 100
SORT file.words DESC
```

**Project status tracking table:**
```dataview
TABLE status, author, dateformat(due, "yyyy-MM-dd") as "Due Date", priority
FROM #project
WHERE status != "completed"
SORT priority DESC, due ASC
```

**File relationships table:**
```dataview
TABLE length(file.inlinks) as "Backlinks", length(file.outlinks) as "Forward Links",
      length(file.tags) as "Tag Count"
FROM ""
WHERE length(file.inlinks) > 0
SORT length(file.inlinks) DESC
```