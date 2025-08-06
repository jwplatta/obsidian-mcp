# Templater Quick Reference

## Basic Syntax
```javascript
<% %> // Raw display
<%~ %> // Interpolation (with escaping)  
<%* %> // JavaScript execution
<%+ %> // Dynamic command (resolved in preview)
```

## Whitespace Control
- `<%_` / `_%>` - Trim all whitespace before/after
- `<%-` / `-%>` - Trim one newline before/after

## Core Modules

### tp.config
- `tp.config.active_file` - Active file when launching
- `tp.config.target_file` - Target file for template
- `tp.config.run_mode` - How Templater was launched

### tp.date
- `tp.date.now(format?, offset?, reference?, reference_format?)`
- `tp.date.tomorrow(format?)` / `tp.date.yesterday(format?)`
- `tp.date.weekday(format?, weekday, reference?, reference_format?)`

### tp.file
- `tp.file.title` - File title
- `tp.file.content` - File content  
- `tp.file.tags` - File tags array
- `tp.file.path(relative?)` - File path
- `tp.file.folder(relative?)` - Folder name
- `tp.file.creation_date(format?)` / `tp.file.last_modified_date(format?)`
- `tp.file.cursor(order?)` - Set cursor position
- `tp.file.selection()` - Get selected text
- `tp.file.rename(new_title)` - Rename file
- `tp.file.move(new_path)` - Move file
- `tp.file.create_new(template, filename?, open_new?, folder?)`
- `tp.file.include(include_link)` - Include file content
- `tp.file.exists(filename)` - Check if file exists

### tp.frontmatter
- `tp.frontmatter.property_name` - Access frontmatter properties
- `tp.frontmatter["property with spaces"]` - Bracket notation for spaced names

### tp.system
- `tp.system.clipboard()` - Get clipboard content
- `tp.system.prompt(prompt_text?, default_value?, throw_on_cancel?)` - Show prompt
- `tp.system.suggester(text_items, items, throw_on_cancel?, placeholder?)` - Show suggester

### tp.web  
- `tp.web.daily_quote()` - Random daily quote
- `tp.web.random_picture(size?, query?)` - Random Unsplash image

### tp.obsidian
Access to full Obsidian API - useful for scripts

## User Functions
- `tp.user.function_name()` - Call custom scripts or system commands
- Scripts: JavaScript files in configured folder (CommonJS exports)
- System commands: Shell commands configured in settings

## Examples
```javascript
// Current date
<% tp.date.now() %>

// Tomorrow with custom format  
<% tp.date.tomorrow("YYYY-MM-DD dddd") %>

// File info
<% tp.file.title %> - <% tp.file.creation_date() %>

// Conditional content
<%* if (tp.frontmatter.status === "draft") { -%>
🚧 DRAFT
<%* } -%>

// User input
<%* const name = await tp.system.prompt("Enter name:") -%>
Hello <% name %>!

// Include other file
<% tp.file.include("Templates/Header") %>

// Set cursor positions
Content here<% tp.file.cursor(1) %> and here<% tp.file.cursor(2) %>
```