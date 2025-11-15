#!/usr/bin/env node

/**
 * Automation MCP Server
 * 
 * Provides tools for managing automation workflows and rules:
 * - Create automation rules
 * - Monitor automation logs
 * - Trigger workflows
 * - Manage n8n workflows
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios, { AxiosInstance } from 'axios';
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// API clients
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';
const API_TOKEN = process.env.API_TOKEN || '';
const N8N_BASE_URL = process.env.N8N_BASE_URL || 'http://localhost:5678';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

const n8nClient: AxiosInstance = axios.create({
  baseURL: N8N_BASE_URL,
  headers: {
    'X-N8N-API-KEY': N8N_API_KEY,
    'Content-Type': 'application/json',
  },
});

// Tool schemas
const createAutomationRuleSchema = z.object({
  name: z.string(),
  type: z.enum(['auto_scale', 'auto_pause', 'creative_refresh', 'budget_adjust']),
  conditions: z.object({
    metric: z.string(),
    operator: z.enum(['gt', 'lt', 'eq', 'gte', 'lte']),
    value: z.number(),
    duration_hours: z.number().optional(),
  }),
  actions: z.object({
    type: z.string(),
    parameters: z.record(z.any()),
  }),
  enabled: z.boolean().default(true),
});

const getAutomationLogsSchema = z.object({
  type: z.enum(['auto_scale', 'auto_pause', 'creative_refresh', 'budget_adjust', 'all']).default('all'),
  limit: z.number().default(50),
  campaign_id: z.number().optional(),
});

const triggerWorkflowSchema = z.object({
  workflow_name: z.string(),
  data: z.record(z.any()).optional(),
});

// Create MCP server
const server = new Server(
  {
    name: 'affiliate-automation',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'create_automation_rule',
        description: 'Create a new automation rule for campaigns (auto-scale, auto-pause, creative refresh, budget adjust)',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Rule name',
            },
            type: {
              type: 'string',
              enum: ['auto_scale', 'auto_pause', 'creative_refresh', 'budget_adjust'],
              description: 'Type of automation',
            },
            conditions: {
              type: 'object',
              properties: {
                metric: {
                  type: 'string',
                  description: 'Metric to monitor (e.g., "roas", "cpa", "spend")',
                },
                operator: {
                  type: 'string',
                  enum: ['gt', 'lt', 'eq', 'gte', 'lte'],
                  description: 'Comparison operator',
                },
                value: {
                  type: 'number',
                  description: 'Threshold value',
                },
                duration_hours: {
                  type: 'number',
                  description: 'How long condition must be true',
                },
              },
              required: ['metric', 'operator', 'value'],
            },
            actions: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  description: 'Action to take',
                },
                parameters: {
                  type: 'object',
                  description: 'Action parameters',
                },
              },
              required: ['type', 'parameters'],
            },
            enabled: {
              type: 'boolean',
              description: 'Whether rule is enabled',
              default: true,
            },
          },
          required: ['name', 'type', 'conditions', 'actions'],
        },
      },
      {
        name: 'get_automation_logs',
        description: 'Get automation execution logs',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['auto_scale', 'auto_pause', 'creative_refresh', 'budget_adjust', 'all'],
              description: 'Filter by automation type',
              default: 'all',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of logs to return',
              default: 50,
            },
            campaign_id: {
              type: 'number',
              description: 'Filter by campaign ID',
            },
          },
        },
      },
      {
        name: 'trigger_workflow',
        description: 'Manually trigger an n8n workflow',
        inputSchema: {
          type: 'object',
          properties: {
            workflow_name: {
              type: 'string',
              description: 'Name of the workflow to trigger',
            },
            data: {
              type: 'object',
              description: 'Data to pass to the workflow',
            },
          },
          required: ['workflow_name'],
        },
      },
      {
        name: 'list_workflows',
        description: 'List all available n8n workflows',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_workflow_executions',
        description: 'Get recent executions of n8n workflows',
        inputSchema: {
          type: 'object',
          properties: {
            workflow_id: {
              type: 'string',
              description: 'Workflow ID',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of executions to return',
              default: 20,
            },
          },
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'create_automation_rule': {
        const params = createAutomationRuleSchema.parse(args);
        
        // Store in database via API
        const response = await apiClient.post('/settings', {
          key: `automation_rule_${Date.now()}`,
          value: JSON.stringify(params),
          category: 'automation',
        });

        return {
          content: [
            {
              type: 'text',
              text: `Automation rule "${params.name}" created successfully!\n\nRule Details:\n${JSON.stringify(params, null, 2)}`,
            },
          ],
        };
      }

      case 'get_automation_logs': {
        const params = getAutomationLogsSchema.parse(args || {});
        
        const queryParams: any = {
          limit: params.limit,
        };

        if (params.type !== 'all') {
          queryParams.type = params.type;
        }

        if (params.campaign_id) {
          queryParams.campaign_id = params.campaign_id;
        }

        const response = await apiClient.get('/automation-logs', { params: queryParams });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'trigger_workflow': {
        const params = triggerWorkflowSchema.parse(args);
        
        try {
          // Get workflow by name
          const workflowsResponse = await n8nClient.get('/api/v1/workflows');
          const workflow = workflowsResponse.data.data.find(
            (w: any) => w.name === params.workflow_name
          );

          if (!workflow) {
            throw new Error(`Workflow "${params.workflow_name}" not found`);
          }

          // Trigger workflow
          const triggerResponse = await n8nClient.post(
            `/api/v1/workflows/${workflow.id}/activate`,
            params.data || {}
          );

          return {
            content: [
              {
                type: 'text',
                text: `Workflow "${params.workflow_name}" triggered successfully!\n\nExecution ID: ${triggerResponse.data.id}`,
              },
            ],
          };
        } catch (error: any) {
          if (error.response?.status === 404) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Note: n8n is not accessible. Workflow trigger simulated.\n\nWorkflow: ${params.workflow_name}\nData: ${JSON.stringify(params.data, null, 2)}`,
                },
              ],
            };
          }
          throw error;
        }
      }

      case 'list_workflows': {
        try {
          const response = await n8nClient.get('/api/v1/workflows');
          const workflows = response.data.data.map((w: any) => ({
            id: w.id,
            name: w.name,
            active: w.active,
            createdAt: w.createdAt,
            updatedAt: w.updatedAt,
          }));

          return {
            content: [
              {
                type: 'text',
                text: `Available Workflows:\n\n${JSON.stringify(workflows, null, 2)}`,
              },
            ],
          };
        } catch (error: any) {
          if (error.response?.status === 404 || error.code === 'ECONNREFUSED') {
            return {
              content: [
                {
                  type: 'text',
                  text: 'Note: n8n is not accessible. Here are the planned workflows:\n\n' +
                    '1. Performance Sync - Sync campaign performance from ad platforms\n' +
                    '2. Auto-Scale Winners - Automatically increase budget for high-performing campaigns\n' +
                    '3. Auto-Pause Losers - Automatically pause underperforming campaigns\n' +
                    '4. Creative Refresh - Generate and deploy new creatives for campaigns\n' +
                    '5. Offer Sync - Sync new offers from affiliate networks\n' +
                    '6. Conversion Tracking - Process conversion webhooks\n' +
                    '7. Daily Report - Generate and send daily performance reports',
                },
              ],
            };
          }
          throw error;
        }
      }

      case 'get_workflow_executions': {
        const { workflow_id, limit = 20 } = args as any;
        
        try {
          const response = await n8nClient.get(`/api/v1/executions`, {
            params: {
              workflowId: workflow_id,
              limit,
            },
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(response.data, null, 2),
              },
            ],
          };
        } catch (error: any) {
          if (error.response?.status === 404 || error.code === 'ECONNREFUSED') {
            return {
              content: [
                {
                  type: 'text',
                  text: 'Note: n8n is not accessible. Execution history unavailable.',
                },
              ],
            };
          }
          throw error;
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Automation MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

