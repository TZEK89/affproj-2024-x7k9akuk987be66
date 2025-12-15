# Manus as Master Controller Architecture

## The Problem

The previous architecture had multiple independent AI systems (LangGraph, CrewAI, AutoGen, LlamaIndex) each using their own LLM instances. The user would need to interact with a dashboard that then calls these systems - creating confusion about:
- Which agent is being used
- Which LLM is processing the request
- Who is actually in control

## The Solution: Manus as the Central Intelligence

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER (You)                               │
│                    Talks directly to Manus                       │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MANUS (Master Controller)                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  • Receives your natural language commands               │    │
│  │  • Decides which core/framework to use                   │    │
│  │  • Executes agents via shell/MCP                         │    │
│  │  • Uses Claude (Anthropic) as primary intelligence       │    │
│  │  • Has access to OpenAI API for agent execution          │    │
│  │  • Reports results back to you                           │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────────┐
        │                       │                           │
        ▼                       ▼                           ▼
┌───────────────┐    ┌───────────────────┐    ┌───────────────────┐
│  SHELL TOOLS  │    │    MCP SERVERS    │    │   DIRECT APIs     │
├───────────────┤    ├───────────────────┤    ├───────────────────┤
│ • Python exec │    │ • Firecrawl       │    │ • OpenAI API      │
│ • Agent runs  │    │ • Playwright      │    │ • Anthropic API   │
│ • Data proc   │    │ • Supabase        │    │ • Hotmart API     │
└───────────────┘    │ • Gmail           │    └───────────────────┘
                     │ • Railway         │
                     │ • Vercel          │
                     └───────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AGENT EXECUTION LAYER                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐  │
│  │  CrewAI     │ │  LangGraph  │ │  LlamaIndex │ │  AutoGen  │  │
│  │  Agents     │ │  Workflows  │ │  RAG/SOPs   │ │  Tools    │  │
│  │             │ │             │ │             │ │           │  │
│  │ Uses OpenAI │ │ Uses OpenAI │ │ Uses OpenAI │ │Uses OpenAI│  │
│  │ GPT-4/4o    │ │ GPT-4/4o    │ │ Embeddings  │ │ GPT-4/4o  │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SUPABASE DATABASE                          │
│  • Products    • Campaigns    • Analytics    • User Data         │
└─────────────────────────────────────────────────────────────────┘
```

## How It Works

### 1. You Talk to Manus
```
You: "Find top 10 finance products with 50%+ commission"
```

### 2. Manus Decides
- This is an Offer Intelligence task
- Should use CrewAI's Offer Intelligence Crew
- Agents needed: Market Researcher, Competitor Analyst, Scoring Agent
- LLM: OpenAI GPT-4o (via OPENAI_API_KEY)

### 3. Manus Executes
```bash
# Manus runs this via shell tool
python ai-orchestration/runners/offer_intelligence_runner.py \
  --task "Find top 10 finance products with 50%+ commission" \
  --output json
```

### 4. Manus Reports Back
```
Manus: "I've executed the Offer Intelligence crew with 3 agents:
- Market Researcher found 25 potential products
- Competitor Analyst assessed market saturation
- Scoring Agent ranked them by AI Score

Here are the top 10:
1. Wealth Builder Pro - 60% commission, AI Score: 92
..."
```

## LLM Usage Map

| Component | LLM Used | API Key | Purpose |
|-----------|----------|---------|---------|
| **Manus (Me)** | Claude 3.5 Sonnet | Built-in | Master control, decision making |
| **CrewAI Agents** | GPT-4o | OPENAI_API_KEY | Agent conversations, task execution |
| **LangGraph Nodes** | GPT-4o | OPENAI_API_KEY | Workflow decisions |
| **LlamaIndex** | text-embedding-3-small | OPENAI_API_KEY | Document embeddings |
| **AutoGen** | GPT-4o | OPENAI_API_KEY | Tool execution |

## Command Interface

Manus can execute any of these commands:

```bash
# Offer Intelligence
python runners/offer_intelligence.py --task "..." --niche "finance"

# Content Generation
python runners/content_generation.py --product "..." --types "ad,email,social"

# Financial Analysis
python runners/financial_intelligence.py --period "december 2024"

# Knowledge Query
python runners/knowledge_query.py --question "..." --category "..."

# Full Orchestration
python runners/orchestrate.py --request "..." --session "user123"
```

## Benefits of This Architecture

1. **Single Point of Control**: You talk to Manus, Manus controls everything
2. **Transparency**: Manus tells you exactly which agents/LLMs are being used
3. **Flexibility**: Manus can switch between frameworks based on the task
4. **Persistence**: Manus remembers context across conversations
5. **MCP Integration**: Manus can use all configured MCP servers directly
6. **No Dashboard Required**: You don't need to use the web UI - just chat with Manus
