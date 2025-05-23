#!/usr/bin/env node

import axios, { AxiosRequestConfig } from 'axios';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

/**
 * Configure your Confluence instance credentials and URL.
 */
const CONFLUENCE_URL = process.env.CONFLUENCE_URL;
const CONFLUENCE_API_MAIL = process.env.CONFLUENCE_API_MAIL;
const CONFLUENCE_API_KEY = process.env.CONFLUENCE_API_KEY;

/**
 * Create an MCP server to handle CQL queries and page retrieval.
 */
const server = new Server(
  {
    name: 'Confluence communication server',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

/**
 * Handler for listing available tools.
 * Provides tools for querying Confluence with CQL and retrieving page content.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'execute_cql_search',
        description: 'Execute a CQL query on Confluence to search pages',
        inputSchema: {
          type: 'object',
          properties: {
            cql: {
              type: 'string',
              description: 'CQL query string',
            },
            limit: {
              type: 'integer',
              description: 'Number of results to return',
              default: 10,
            },
          },
          required: ['cql'],
        },
      },
      {
        name: 'get_page_content',
        description: 'Get the content of a Confluence page',
        inputSchema: {
          type: 'object',
          properties: {
            pageId: {
              type: 'string',
              description: 'Confluence Page ID',
            },
          },
          required: ['pageId'],
        },
      },
      {
        name: 'update_page_content',
        description: 'Update the content of a Confluence page',
        inputSchema: {
          type: 'object',
          properties: {
            pageId: {
              type: 'string',
              description: 'Confluence Page ID',
            },
            content: {
              type: 'string',
              description: 'HTML content to update the page with',
            },
            title: {
              type: 'string',
              description: 'Page title (optional, if you want to change it)',
            },
          },
          required: ['pageId', 'content'],
        },
      },
    ],
  };
});

/**
 * Function to execute a CQL query against Confluence.
 * @param {string} cql - CQL query string
 * @param limit
 * @returns {Promise<any>}
 */
async function executeCQL(cql: string, limit: number): Promise<any> {
  try {
    const params = {
      cql,
      limit,
    };

    const response = await axios.get(
      `${CONFLUENCE_URL}/wiki/rest/api/content/search`,
      {
        // Updated URL
        headers: getAuthHeaders().headers,
        params,
      },
    );

    return response.data;
  } catch (error: any) {
    return {
      error: error.response ? error.response.data : error.message,
    };
  }
}

/**
 * Function to retrieve content from a Confluence page by ID.
 * @param {string} pageId - Confluence Page ID
 * @returns {Promise<any>}
 */
async function getPageContent(pageId: string): Promise<any> {
  try {
    const response = await axios.get(
      `${CONFLUENCE_URL}/wiki/rest/api/content/${pageId}?expand=body.storage,version`,
      {
        headers: getAuthHeaders().headers,
      },
    );

    return response.data;
  } catch (error: any) {
    return {
      error: error.response ? error.response.data : error.message,
    };
  }
}

/**
 * Function to update content on a Confluence page by ID.
 * @param {string} pageId - Confluence Page ID
 * @param {string} content - HTML content to update
 * @param {string} title - Optional new title
 * @returns {Promise<any>}
 */
async function updatePageContent(
  pageId: string,
  content: string,
  title?: string,
): Promise<any> {
  try {
    // First, get the current page to retrieve its version and other details
    const currentPage = await getPageContent(pageId);

    if (currentPage.error) {
      return {
        error: `Failed to get current page: ${currentPage.error}`,
      };
    }

    // Create update payload
    const updatePayload = {
      id: pageId,
      type: currentPage.type,
      title: title || currentPage.title,
      space: currentPage.space,
      body: {
        storage: {
          value: content,
          representation: 'storage',
        },
      },
      version: {
        number: currentPage.version.number + 1,
      },
    };

    // Update the page
    const response = await axios.put(
      `${CONFLUENCE_URL}/wiki/rest/api/content/${pageId}`,
      updatePayload,
      {
        headers: {
          ...getAuthHeaders().headers,
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data;
  } catch (error: any) {
    return {
      error: error.response ? error.response.data : error.message,
    };
  }
}

/**
 * Function to get the authentication headers.
 * @returns {AxiosRequestConfig}
 */
function getAuthHeaders(): AxiosRequestConfig<any> {
  const authHeader = `Basic ${Buffer.from(
    `${CONFLUENCE_API_MAIL}:${CONFLUENCE_API_KEY}`,
  ).toString('base64')}`;
  return {
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
  };
}

/**
 * Handler for the execute_cql_search and get_page_content tools.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case 'execute_cql_search': {
      const cql = String(request.params.arguments?.cql);
      const limit = Number(request.params.arguments?.limit ?? 10);

      if (!cql) {
        throw new Error('CQL query is required');
      }

      const response = await executeCQL(cql, limit);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response, null, 2),
          },
        ],
      };
    }

    case 'get_page_content': {
      const pageId = String(request.params.arguments?.pageId);

      if (!pageId) {
        throw new Error('Page ID is required');
      }

      const response = await getPageContent(pageId);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response, null, 2),
          },
        ],
      };
    }

    case 'update_page_content': {
      const pageId = String(request.params.arguments?.pageId);
      const content = String(request.params.arguments?.content);
      const title = request.params.arguments?.title
        ? String(request.params.arguments?.title)
        : undefined;

      if (!pageId) {
        throw new Error('Page ID is required');
      }
      if (!content) {
        throw new Error('Content is required');
      }

      const response = await updatePageContent(pageId, content, title);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error('Unknown tool');
  }
});

/**
 * Start the server using stdio transport.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
