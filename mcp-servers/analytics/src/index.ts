#!/usr/bin/env node

/**
 * Analytics MCP Server
 * 
 * Provides tools for querying performance metrics and generating reports:
 * - Dashboard overview
 * - Revenue analysis
 * - Conversion funnels
 * - Performance trends
 * - Custom reports
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

// API client
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
const dashboardOverviewSchema = z.object({
  days: z.number().min(1).max(365).default(30),
});

const revenueByPlatformSchema = z.object({
  days: z.number().min(1).max(365).default(30),
});

const revenueByNicheSchema = z.object({
  days: z.number().min(1).max(365).default(30),
});

const conversionFunnelSchema = z.object({
  campaign_id: z.number().optional(),
  days: z.number().min(1).max(365).default(30),
});

const performanceByTimeSchema = z.object({
  grouping: z.enum(['hour', 'day', 'week', 'month']).default('day'),
  days: z.number().min(1).max(365).default(30),
});

const campaignPerformanceSchema = z.object({
  campaign_id: z.number(),
  days: z.number().min(1).max(365).default(30),
});

// Create MCP server
const server = new Server(
  {
    name: 'affiliate-analytics',
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
        name: 'get_dashboard_overview',
        description: 'Get comprehensive dashboard overview with key metrics, trends, and top performers',
        inputSchema: {
          type: 'object',
          properties: {
            days: {
              type: 'number',
              description: 'Number of days to analyze',
              default: 30,
              minimum: 1,
              maximum: 365,
            },
          },
        },
      },
      {
        name: 'get_revenue_by_platform',
        description: 'Analyze revenue performance across different ad platforms',
        inputSchema: {
          type: 'object',
          properties: {
            days: {
              type: 'number',
              description: 'Number of days to analyze',
              default: 30,
              minimum: 1,
              maximum: 365,
            },
          },
        },
      },
      {
        name: 'get_revenue_by_niche',
        description: 'Analyze revenue performance across different niches',
        inputSchema: {
          type: 'object',
          properties: {
            days: {
              type: 'number',
              description: 'Number of days to analyze',
              default: 30,
              minimum: 1,
              maximum: 365,
            },
          },
        },
      },
      {
        name: 'get_conversion_funnel',
        description: 'Analyze conversion funnel from clicks to approved conversions',
        inputSchema: {
          type: 'object',
          properties: {
            campaign_id: {
              type: 'number',
              description: 'Optional campaign ID to filter by',
            },
            days: {
              type: 'number',
              description: 'Number of days to analyze',
              default: 30,
              minimum: 1,
              maximum: 365,
            },
          },
        },
      },
      {
        name: 'get_performance_by_time',
        description: 'Get performance metrics grouped by time period (hour, day, week, month)',
        inputSchema: {
          type: 'object',
          properties: {
            grouping: {
              type: 'string',
              enum: ['hour', 'day', 'week', 'month'],
              description: 'Time grouping',
              default: 'day',
            },
            days: {
              type: 'number',
              description: 'Number of days to analyze',
              default: 30,
              minimum: 1,
              maximum: 365,
            },
          },
        },
      },
      {
        name: 'get_campaign_performance',
        description: 'Get detailed performance metrics for a specific campaign',
        inputSchema: {
          type: 'object',
          properties: {
            campaign_id: {
              type: 'number',
              description: 'Campaign ID',
            },
            days: {
              type: 'number',
              description: 'Number of days to analyze',
              default: 30,
              minimum: 1,
              maximum: 365,
            },
          },
          required: ['campaign_id'],
        },
      },
      {
        name: 'get_cohort_analysis',
        description: 'Analyze campaign performance by cohort (launch week)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_health_alerts',
        description: 'Get campaigns with poor or critical health status',
        inputSchema: {
          type: 'object',
          properties: {},
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
      case 'get_dashboard_overview': {
        const params = dashboardOverviewSchema.parse(args || {});
        const response = await apiClient.get('/analytics/dashboard', { params });
        
        const data = response.data.data;
        const summary = `
📊 DASHBOARD OVERVIEW (Last ${params.days} days)

💰 REVENUE METRICS:
- Total Revenue: $${data.metrics.total_revenue?.toLocaleString() || 0}
- Total Profit: $${data.metrics.total_profit?.toLocaleString() || 0}
- Total Spend: $${data.metrics.total_spend?.toLocaleString() || 0}
- Average ROAS: ${data.metrics.avg_roas?.toFixed(2) || 0}x

📈 CAMPAIGN METRICS:
- Total Campaigns: ${data.metrics.total_campaigns || 0}
- Active Campaigns: ${data.metrics.active_campaigns || 0}
- Total Offers: ${data.metrics.total_offers || 0}
- Landing Pages: ${data.metrics.total_landing_pages || 0}

🎯 CONVERSION METRICS:
- Total Clicks: ${data.metrics.total_clicks?.toLocaleString() || 0}
- Total Conversions: ${data.metrics.total_conversions?.toLocaleString() || 0}
- Conversion Rate: ${data.metrics.total_clicks > 0 ? ((data.metrics.total_conversions / data.metrics.total_clicks) * 100).toFixed(2) : 0}%

🏆 TOP CAMPAIGNS:
${data.topCampaigns?.slice(0, 5).map((c: any, i: number) => 
  `${i + 1}. ${c.name} - ROAS: ${c.roas?.toFixed(2)}x, Revenue: $${c.revenue?.toLocaleString()}`
).join('\n') || 'No data'}

🎯 TOP OFFERS:
${data.topOffers?.slice(0, 5).map((o: any, i: number) => 
  `${i + 1}. ${o.name} - Revenue: $${o.total_revenue?.toLocaleString()}, Conversions: ${o.total_conversions}`
).join('\n') || 'No data'}
`;
        
        return {
          content: [
            {
              type: 'text',
              text: summary,
            },
          ],
        };
      }

      case 'get_revenue_by_platform': {
        const params = revenueByPlatformSchema.parse(args || {});
        const response = await apiClient.get('/analytics/revenue/by-platform', { params });
        
        const platforms = response.data.data;
        const summary = `
📱 REVENUE BY PLATFORM (Last ${params.days} days)

${platforms.map((p: any) => `
${p.platform}:
  - Campaigns: ${p.campaign_count}
  - Spend: $${p.total_spend?.toLocaleString() || 0}
  - Revenue: $${p.total_revenue?.toLocaleString() || 0}
  - Profit: $${p.total_profit?.toLocaleString() || 0}
  - ROAS: ${p.roas?.toFixed(2) || 0}x
`).join('\n')}
`;
        
        return {
          content: [
            {
              type: 'text',
              text: summary,
            },
          ],
        };
      }

      case 'get_revenue_by_niche': {
        const params = revenueByNicheSchema.parse(args || {});
        const response = await apiClient.get('/analytics/revenue/by-niche', { params });
        
        const niches = response.data.data;
        const summary = `
🎯 REVENUE BY NICHE (Last ${params.days} days)

${niches.map((n: any) => `
${n.niche}:
  - Campaigns: ${n.campaign_count}
  - Offers: ${n.offer_count}
  - Spend: $${n.total_spend?.toLocaleString() || 0}
  - Revenue: $${n.total_revenue?.toLocaleString() || 0}
  - Profit: $${n.total_profit?.toLocaleString() || 0}
  - ROAS: ${n.roas?.toFixed(2) || 0}x
`).join('\n')}
`;
        
        return {
          content: [
            {
              type: 'text',
              text: summary,
            },
          ],
        };
      }

      case 'get_conversion_funnel': {
        const params = conversionFunnelSchema.parse(args || {});
        const response = await apiClient.get('/analytics/funnel', { params });
        
        const funnel = response.data.data;
        const summary = `
🔄 CONVERSION FUNNEL ANALYSIS (Last ${params.days} days)
${params.campaign_id ? `Campaign ID: ${params.campaign_id}` : 'All Campaigns'}

📊 FUNNEL METRICS:
1. Total Clicks: ${funnel.total_clicks?.toLocaleString() || 0}
2. Clicks with Conversion: ${funnel.clicks_with_conversion?.toLocaleString() || 0}
3. Total Conversions: ${funnel.total_conversions?.toLocaleString() || 0}
   - Approved: ${funnel.approved_conversions?.toLocaleString() || 0}
   - Pending: ${funnel.pending_conversions?.toLocaleString() || 0}
   - Rejected: ${funnel.rejected_conversions?.toLocaleString() || 0}

📈 RATES:
- Conversion Rate: ${funnel.conversion_rate?.toFixed(2) || 0}%
- Approval Rate: ${funnel.approval_rate?.toFixed(2) || 0}%
`;
        
        return {
          content: [
            {
              type: 'text',
              text: summary,
            },
          ],
        };
      }

      case 'get_performance_by_time': {
        const params = performanceByTimeSchema.parse(args || {});
        const response = await apiClient.get('/analytics/performance/by-time', { params });
        
        return {
          content: [
            {
              type: 'text',
              text: `Performance by ${params.grouping} (Last ${params.days} days):\n\n${JSON.stringify(response.data.data, null, 2)}`,
            },
          ],
        };
      }

      case 'get_campaign_performance': {
        const params = campaignPerformanceSchema.parse(args);
        const response = await apiClient.get(`/campaigns/${params.campaign_id}/performance`);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'get_cohort_analysis': {
        const response = await apiClient.get('/analytics/cohorts');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'get_health_alerts': {
        const response = await apiClient.get('/analytics/alerts');
        
        const alerts = response.data.data;
        const summary = `
⚠️ CAMPAIGN HEALTH ALERTS

${alerts.length === 0 ? 'No campaigns with poor or critical health!' : alerts.map((c: any) => `
${c.health_status === 'critical' ? '🔴' : '🟡'} ${c.name} (ID: ${c.id})
  Status: ${c.health_status.toUpperCase()}
  ROAS: ${c.roas?.toFixed(2) || 0}x (Target: ${c.target_roas}x)
  Spend: $${c.spend?.toLocaleString() || 0}
  Revenue: $${c.revenue?.toLocaleString() || 0}
  ${c.recommendations ? `Recommendation: ${c.recommendations}` : ''}
`).join('\n')}

Total Alerts: ${alerts.length}
`;
        
        return {
          content: [
            {
              type: 'text',
              text: summary,
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
  console.error('Analytics MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

