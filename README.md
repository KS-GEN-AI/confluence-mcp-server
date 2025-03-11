# Confluence Communication Server MCP Server

Interact with Confluence

This is a TypeScript-based MCP server that provides tools to interact with Confluence. It demonstrates core MCP concepts by providing:

- Tools for executing CQL queries to search pages
- Tools for retrieving the content of Confluence pages

<a href="https://glama.ai/mcp/servers/850t5hxya0">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/850t5hxya0/badge" alt="Confluence Communication Server MCP server" />
</a>

## Features

## Confluence Tools

### `execute_cql_search`
- **Purpose**: Run a CQL query to search for Confluence pages.
- **Parameters**: `cql`, `limit` (default: 10).

### `get_page_content`
- **Purpose**: Fetch the content of a Confluence page.
- **Parameters**: `pageId`.

## Development

Install dependencies:
```bash
npm install
```

Build the server:
```bash
npm run build
```

For development with auto-rebuild:
```bash
npm run watch
```

## Installation

To use with Claude Desktop, add the server config:

On MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`  
On Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "Confluence communication server": {
      "command": "node",
      "args": [
        "/PATH_TO_THE_PROJECT/build/index.js"
      ],
      "env": {
        "CONFLUENCE_URL": "https://XXXXXXXX.atlassian.net/wiki",
        "CONFLUENCE_API_MAIL": "Your email",
        "CONFLUENCE_API_KEY": "KEY_FROM: https://id.atlassian.com/manage-profile/security/api-tokens"
      }
    }
  }
}
```

### Debugging

Since MCP servers communicate over stdio, debugging can be challenging. We recommend using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), which is available as a package script:

```bash
npm run inspector
```

The Inspector will provide a URL to access debugging tools in your browser.