# Documentation Index

This folder contains comprehensive documentation for the AI Affiliate Marketing System project.

## Core Documentation

### 1. [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)
**Purpose**: Provides the high-level vision, current state, and immediate priorities for the project.  
**Audience**: New developers joining the project, project managers.  
**Key Sections**:
- The 5 AI Cores vision
- Current system architecture
- Integration status (Hotmart, Impact.com, AI providers)
- Next steps and priorities

### 2. [TECHNICAL_SPECIFICATIONS.md](./TECHNICAL_SPECIFICATIONS.md)
**Purpose**: Detailed technical reference for the entire system.  
**Audience**: Developers, DevOps engineers.  
**Key Sections**:
- Complete database schema (15 tables)
- All API endpoints with specifications
- Environment variables configuration
- Deployment setup (Railway, Vercel)
- Webhook specifications
- Agent system requirements

### 3. [AI_AGENTS_ARCHITECTURE.md](./AI_AGENTS_ARCHITECTURE.md)
**Purpose**: Detailed design for the agentic Offer Research AI system.  
**Audience**: AI/ML engineers, backend developers.  
**Key Sections**:
- System overview (Orchestration, Agent, Execution layers)
- Agent workflow with step-by-step examples
- Technology stack recommendations
- Implementation roadmap

### 4. [MCP_SERVERS_CONFIG.json](./MCP_SERVERS_CONFIG.json)
**Purpose**: Configuration file for Model Context Protocol servers.  
**Audience**: Developers using Claude or other AI assistants.  
**Includes**:
- GitHub MCP server configuration
- Railway MCP server configuration
- Vercel MCP server configuration
- Setup instructions and usage examples

### 5. [HOTMART_INTEGRATION_FINAL_SUMMARY.md](./HOTMART_INTEGRATION_FINAL_SUMMARY.md)
**Purpose**: Complete status report on the Hotmart integration.  
**Audience**: Project stakeholders, developers.  
**Key Sections**:
- What's been completed (98%)
- Pending items (final migration)
- Webhook flow documentation
- Testing results

## Quick Start for New Developers

1. **Read First**: [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) - Get the big picture
2. **Then Read**: [TECHNICAL_SPECIFICATIONS.md](./TECHNICAL_SPECIFICATIONS.md) - Understand the system
3. **For AI Work**: [AI_AGENTS_ARCHITECTURE.md](./AI_AGENTS_ARCHITECTURE.md) - Learn the agent system
4. **Setup MCP**: [MCP_SERVERS_CONFIG.json](./MCP_SERVERS_CONFIG.json) - Configure your tools

## Current Project Status

- **Phase**: Core #1 (Offer Research AI) - Ready to implement
- **Hotmart Integration**: 98% complete (pending final migration)
- **Database**: 15 tables, 11 migrations
- **Deployments**: Live on Railway (backend) and Vercel (frontend)

## Repository Structure

```
affiliate-marketing-system/
├── backend/
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic (AIService, HotmartService, etc.)
│   ├── database/        # Migrations and DB utilities
│   └── server.js        # Entry point
├── frontend/
│   ├── src/
│   │   ├── app/         # Next.js pages
│   │   └── components/  # React components
│   └── package.json
├── docs/                # This folder
└── README.md
```

## Important Links

- **Frontend**: https://affiliate-marketing-system-frontend.vercel.app
- **Backend**: https://affiliate-backend-production-df21.up.railway.app
- **GitHub**: https://github.com/TZEK89/affiliate-marketing-system

## Contact & Support

For questions or issues, create a GitHub issue in the repository.

---

**Last Updated**: December 6, 2025  
**Maintained By**: Project Team
