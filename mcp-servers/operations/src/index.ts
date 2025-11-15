#!/usr/bin/env node

/**
 * Operations MCP Server
 * 
 * Provides tools for managing campaigns, offers, budgets, and operational tasks.
 * Enables Manus AI to control the affiliate marketing system through conversation.
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

// API client configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';
const API_TOKEN = process.env.API_TOKEN || '';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

// Tool schemas
const listCampaignsSchema = z.object({
  status: z.enum(['draft', 'active', 'paused', 'completed', 'archived']).optional(),
  platform_id: z.number().optional(),
  offer_id: z.number().optional(),
  min_roas: z.number().optional(),
  limit: z.number().default(20),
});

const getCampaignSchema = z.object({
  campaign_id: z.number(),
});

const updateCampaignStatusSchema = z.object({
  campaign_id: z.number(),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'archived']),
  reason: z.string().optional(),
});

const updateCampaignBudgetSchema = z.object({
  campaign_id: z.number(),
  budget_daily: z.number().optional(),
  budget_total: z.number().optional(),
});

const listOffersSchema = z.object({
  niche: z.string().optional(),
  network_id: z.number().optional(),
  min_quality_score: z.number().optional(),
  status: z.enum(['active', 'inactive', 'paused', 'archived']).optional(),
  limit: z.number().default(20),
});

const getOfferSchema = z.object({
  offer_id: z.number(),
});

const getCampaignHealthSchema = z.object({
  min_severity: z.enum(['critical', 'poor', 'fair']).optional(),
});

// Create MCP server
const server = new Server(
  {
    name: 'affiliate-operations',
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
        name: 'list_campaigns',
        description: 'List all campaigns with optional filtering by status, platform, offer, or ROAS threshold',
        inputSchema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['draft', 'active', 'paused', 'completed', 'archived'],
              description: 'Filter by campaign status',
            },
            platform_id: {
              type: 'number',
              description: 'Filter by platform ID',
            },
            offer_id: {
              type: 'number',
              description: 'Filter by offer ID',
            },
            min_roas: {
              type: 'number',
              description: 'Filter campaigns with ROAS >= this value',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of campaigns to return',
              default: 20,
            },
          },
        },
      },
      {
        name: 'get_campaign',
        description: 'Get detailed information about a specific campaign including performance metrics',
        inputSchema: {
          type: 'object',
          properties: {
            campaign_id: {
              type: 'number',
              description: 'Campaign ID',
            },
          },
          required: ['campaign_id'],
        },
      },
      {
        name: 'update_campaign_status',
        description: 'Update campaign status (activate, pause, complete, or archive)',
        inputSchema: {
          type: 'object',
          properties: {
            campaign_id: {
              type: 'number',
              description: 'Campaign ID',
            },
            status: {
              type: 'string',
              enum: ['draft', 'active', 'paused', 'completed', 'archived'],
              description: 'New status',
            },
            reason: {
              type: 'string',
              description: 'Optional reason for status change',
            },
          },
          required: ['campaign_id', 'status'],
        },
      },
      {
        name: 'update_campaign_budget',
        description: 'Update campaign daily or total budget',
        inputSchema: {
          type: 'object',
          properties: {
            campaign_id: {
              type: 'number',
              description: 'Campaign ID',
            },
            budget_daily: {
              type: 'number',
              description: 'New daily budget',
            },
            budget_total: {
              type: 'number',
              description: 'New total budget',
            },
          },
          required: ['campaign_id'],
        },
      },
      {
        name: 'list_offers',
        description: 'List all affiliate offers with optional filtering',
        inputSchema: {
          type: 'object',
          properties: {
            niche: {
              type: 'string',
              description: 'Filter by niche',
            },
            network_id: {
              type: 'number',
              description: 'Filter by network ID',
            },
            min_quality_score: {
              type: 'number',
              description: 'Filter offers with quality score >= this value',
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'paused', 'archived'],
              description: 'Filter by status',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of offers to return',
              default: 20,
            },
          },
        },
      },
      {
        name: 'get_offer',
        description: 'Get detailed information about a specific offer',
        inputSchema: {
          type: 'object',
          properties: {
            offer_id: {
              type: 'number',
              description: 'Offer ID',
            },
          },
          required: ['offer_id'],
        },
      },
      {
        name: 'get_campaign_health',
        description: 'Get health status of all campaigns with alerts and recommendations',
        inputSchema: {
          type: 'object',
          properties: {
            min_severity: {
              type: 'string',
              enum: ['critical', 'poor', 'fair'],
              description: 'Minimum severity level to include',
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
      case 'list_campaigns': {
        const params = listCampaignsSchema.parse(args);
        const response = await apiClient.get('/campaigns', { params });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'get_campaign': {
        const { campaign_id } = getCampaignSchema.parse(args);
        const response = await apiClient.get(`/campaigns/${campaign_id}`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'update_campaign_status': {
        const { campaign_id, status, reason } = updateCampaignStatusSchema.parse(args);
        const response = await apiClient.patch(`/campaigns/${campaign_id}/status`, {
          status,
          reason,
        });
        return {
          content: [
            {
              type: 'text',
              text: `Campaign ${campaign_id} status updated to ${status}. ${reason ? `Reason: ${reason}` : ''}`,
            },
          ],
        };
      }

      case 'update_campaign_budget': {
        const { campaign_id, budget_daily, budget_total } = updateCampaignBudgetSchema.parse(args);
        const response = await apiClient.patch(`/campaigns/${campaign_id}/budget`, {
          budget_daily,
          budget_total,
        });
        return {
          content: [
            {
              type: 'text',
              text: `Campaign ${campaign_id} budget updated. ${budget_daily ? `Daily: $${budget_daily}` : ''} ${budget_total ? `Total: $${budget_total}` : ''}`,
            },
          ],
        };
      }

      case 'list_offers': {
        const params = listOffersSchema.parse(args);
        const response = await apiClient.get('/offers', { params });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'get_offer': {
        const { offer_id } = getOfferSchema.parse(args);
        const response = await apiClient.get(`/offers/${offer_id}`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'get_campaign_health': {
        const params = getCampaignHealthSchema.parse(args || {});
        const response = await apiClient.get('/campaigns/health');
        
        let campaigns = response.data.data;
        if (params.min_severity) {
          const severityOrder = { critical: 1, poor: 2, fair: 3, good: 4, excellent: 5 };
          const minLevel = severityOrder[params.min_severity];
          campaigns = campaigns.filter((c: any) => 
            severityOrder[c.health_status] <= minLevel
          );
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ campaigns, count: campaigns.length }, null, 2),
            },
          ],
        };
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
  console.error('Operations MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

