#!/usr/bin/env node

/**
 * Content MCP Server
 * 
 * Provides tools for generating and managing creative content:
 * - Images (Midjourney, DALL-E)
 * - Videos (Runway, Luma AI)
 * - Copy (Claude)
 * - Asset management
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios, { AxiosInstance } from 'axios';
import OpenAI from 'openai';
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// API clients
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';
const API_TOKEN = process.env.API_TOKEN || '';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Tool schemas
const generateAdCopySchema = z.object({
  offer_name: z.string(),
  offer_description: z.string(),
  target_audience: z.string(),
  tone: z.enum(['professional', 'casual', 'urgent', 'friendly', 'authoritative']).default('professional'),
  format: z.enum(['short', 'medium', 'long']).default('medium'),
  include_cta: z.boolean().default(true),
});

const generateImagePromptSchema = z.object({
  offer_name: z.string(),
  style: z.string().optional(),
  mood: z.string().optional(),
  elements: z.array(z.string()).optional(),
});

const generateVideoScriptSchema = z.object({
  offer_name: z.string(),
  duration: z.number().default(30),
  hook: z.string().optional(),
  key_points: z.array(z.string()),
});

const listAssetsSchema = z.object({
  type: z.enum(['image', 'video', 'audio', 'text']).optional(),
  ai_tool: z.string().optional(),
  offer_id: z.number().optional(),
  limit: z.number().default(20),
});

const createAssetSchema = z.object({
  offer_id: z.number().optional(),
  type: z.enum(['image', 'video', 'audio', 'text']),
  name: z.string(),
  description: z.string().optional(),
  file_url: z.string(),
  ai_tool: z.string().optional(),
  ai_prompt: z.string().optional(),
  metadata: z.object({}).passthrough().optional(),
});

const getAssetStatsSchema = z.object({
  group_by: z.enum(['ai_tool', 'type', 'offer']).default('ai_tool'),
});

// Create MCP server
const server = new Server(
  {
    name: 'affiliate-content',
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
        name: 'generate_ad_copy',
        description: 'Generate compelling ad copy for an offer using AI (Claude via OpenAI-compatible API)',
        inputSchema: {
          type: 'object',
          properties: {
            offer_name: {
              type: 'string',
              description: 'Name of the offer/product',
            },
            offer_description: {
              type: 'string',
              description: 'Brief description of the offer',
            },
            target_audience: {
              type: 'string',
              description: 'Target audience description',
            },
            tone: {
              type: 'string',
              enum: ['professional', 'casual', 'urgent', 'friendly', 'authoritative'],
              description: 'Tone of the copy',
              default: 'professional',
            },
            format: {
              type: 'string',
              enum: ['short', 'medium', 'long'],
              description: 'Length of the copy',
              default: 'medium',
            },
            include_cta: {
              type: 'boolean',
              description: 'Include call-to-action',
              default: true,
            },
          },
          required: ['offer_name', 'offer_description', 'target_audience'],
        },
      },
      {
        name: 'generate_image_prompt',
        description: 'Generate optimized prompts for image generation (Midjourney, DALL-E, etc.)',
        inputSchema: {
          type: 'object',
          properties: {
            offer_name: {
              type: 'string',
              description: 'Name of the offer/product',
            },
            style: {
              type: 'string',
              description: 'Visual style (e.g., "photorealistic", "minimalist", "vibrant")',
            },
            mood: {
              type: 'string',
              description: 'Desired mood (e.g., "energetic", "calm", "professional")',
            },
            elements: {
              type: 'array',
              items: { type: 'string' },
              description: 'Key visual elements to include',
            },
          },
          required: ['offer_name'],
        },
      },
      {
        name: 'generate_video_script',
        description: 'Generate video script for video ads',
        inputSchema: {
          type: 'object',
          properties: {
            offer_name: {
              type: 'string',
              description: 'Name of the offer/product',
            },
            duration: {
              type: 'number',
              description: 'Video duration in seconds',
              default: 30,
            },
            hook: {
              type: 'string',
              description: 'Opening hook (optional)',
            },
            key_points: {
              type: 'array',
              items: { type: 'string' },
              description: 'Key points to cover',
            },
          },
          required: ['offer_name', 'key_points'],
        },
      },
      {
        name: 'list_assets',
        description: 'List all creative assets with filtering',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['image', 'video', 'audio', 'text'],
              description: 'Filter by asset type',
            },
            ai_tool: {
              type: 'string',
              description: 'Filter by AI tool used',
            },
            offer_id: {
              type: 'number',
              description: 'Filter by offer ID',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of assets to return',
              default: 20,
            },
          },
        },
      },
      {
        name: 'create_asset',
        description: 'Create a new asset record in the system',
        inputSchema: {
          type: 'object',
          properties: {
            offer_id: {
              type: 'number',
              description: 'Associated offer ID',
            },
            type: {
              type: 'string',
              enum: ['image', 'video', 'audio', 'text'],
              description: 'Asset type',
            },
            name: {
              type: 'string',
              description: 'Asset name',
            },
            description: {
              type: 'string',
              description: 'Asset description',
            },
            file_url: {
              type: 'string',
              description: 'URL to the asset file',
            },
            ai_tool: {
              type: 'string',
              description: 'AI tool used to generate',
            },
            ai_prompt: {
              type: 'string',
              description: 'Prompt used for generation',
            },
            metadata: {
              type: 'object',
              description: 'Additional metadata',
            },
          },
          required: ['type', 'name', 'file_url'],
        },
      },
      {
        name: 'get_asset_stats',
        description: 'Get statistics about assets grouped by AI tool, type, or offer',
        inputSchema: {
          type: 'object',
          properties: {
            group_by: {
              type: 'string',
              enum: ['ai_tool', 'type', 'offer'],
              description: 'How to group the statistics',
              default: 'ai_tool',
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
      case 'generate_ad_copy': {
        const params = generateAdCopySchema.parse(args);
        
        const lengthMap = {
          short: '50-75 words',
          medium: '100-150 words',
          long: '200-300 words',
        };

        const prompt = `Generate compelling ad copy for the following offer:

Offer: ${params.offer_name}
Description: ${params.offer_description}
Target Audience: ${params.target_audience}
Tone: ${params.tone}
Length: ${lengthMap[params.format]}
${params.include_cta ? 'Include a strong call-to-action at the end.' : ''}

Create persuasive, benefit-focused copy that speaks directly to the target audience's pain points and desires. Make it engaging and conversion-focused.`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4.1-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert copywriter specializing in direct response advertising and affiliate marketing.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.8,
        });

        const copy = completion.choices[0].message.content;

        return {
          content: [
            {
              type: 'text',
              text: `Generated Ad Copy:\n\n${copy}`,
            },
          ],
        };
      }

      case 'generate_image_prompt': {
        const params = generateImagePromptSchema.parse(args);
        
        const prompt = `Generate a detailed, optimized prompt for AI image generation (Midjourney/DALL-E) for the following:

Offer: ${params.offer_name}
${params.style ? `Style: ${params.style}` : ''}
${params.mood ? `Mood: ${params.mood}` : ''}
${params.elements ? `Elements: ${params.elements.join(', ')}` : ''}

Create a detailed prompt that will produce a high-quality, eye-catching image suitable for advertising. Include specific details about composition, lighting, colors, and atmosphere. Format it as a single, well-structured prompt ready to use.`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4.1-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert at creating prompts for AI image generation tools like Midjourney and DALL-E.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
        });

        const imagePrompt = completion.choices[0].message.content;

        return {
          content: [
            {
              type: 'text',
              text: `Generated Image Prompt:\n\n${imagePrompt}`,
            },
          ],
        };
      }

      case 'generate_video_script': {
        const params = generateVideoScriptSchema.parse(args);
        
        const prompt = `Generate a video script for a ${params.duration}-second ad for:

Offer: ${params.offer_name}
${params.hook ? `Opening Hook: ${params.hook}` : ''}
Key Points to Cover:
${params.key_points.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Create a compelling video script with:
- Attention-grabbing opening (first 3 seconds)
- Clear value proposition
- Emotional appeal
- Strong call-to-action
- Timing markers for each section

Format: Include [TIME] markers and scene descriptions.`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4.1-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert video scriptwriter specializing in short-form advertising content.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.8,
        });

        const script = completion.choices[0].message.content;

        return {
          content: [
            {
              type: 'text',
              text: `Generated Video Script:\n\n${script}`,
            },
          ],
        };
      }

      case 'list_assets': {
        const params = listAssetsSchema.parse(args);
        const response = await apiClient.get('/assets', { params });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'create_asset': {
        const params = createAssetSchema.parse(args);
        const response = await apiClient.post('/assets', params);
        return {
          content: [
            {
              type: 'text',
              text: `Asset created successfully!\n\n${JSON.stringify(response.data, null, 2)}`,
            },
          ],
        };
      }

      case 'get_asset_stats': {
        const params = getAssetStatsSchema.parse(args || {});
        const response = await apiClient.get('/assets/stats/by-tool');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
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
  console.error('Content MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

