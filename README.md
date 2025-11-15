# AI-Automated Affiliate Marketing System

**Version:** 1.0.0  
**Status:** Production Ready  
**License:** Private/Proprietary

---

## 📋 Overview

A complete, AI-powered affiliate marketing automation system with intelligent campaign management, automated content generation, and real-time optimization. Built with modern technologies and integrated with Manus AI via Model Context Protocol (MCP) for conversational control and strategic intelligence.

### Key Features

- ✅ **Automated Offer Discovery** - Intelligent scraping and evaluation of affiliate offers
- ✅ **AI Content Generation** - Automated creation of images, videos, and ad copy
- ✅ **Smart Campaign Management** - Multi-platform ad campaign orchestration
- ✅ **Real-Time Optimization** - Automatic scaling, pausing, and creative refresh
- ✅ **Comprehensive Analytics** - Deep performance insights and trend analysis
- ✅ **MCP Integration** - Conversational control via Manus AI
- ✅ **Self-Hosted** - Full control over your data and infrastructure

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  MANUS AI (via MCP)                      │
│         Conversational Control & Intelligence            │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   MCP SERVER LAYER                       │
│  Operations │ Content │ Analytics │ Automation │ Integrations
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│              CORE APPLICATION LAYER                      │
│  Backend API │ Frontend Dashboard │ n8n Workflows        │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  DATA & STORAGE LAYER                    │
│  PostgreSQL │ Redis │ Cloudflare R2                      │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                 EXTERNAL INTEGRATIONS                    │
│  Affiliate Networks │ Ad Platforms │ AI Services         │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ and npm 10+
- **Docker** and Docker Compose
- **PostgreSQL** 15+ (via Supabase or self-hosted)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd affiliate-marketing-system
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys and configuration
   ```

4. **Start Docker services** (Redis, n8n)
   ```bash
   npm run docker:up
   ```

5. **Set up database**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

6. **Start all services**
   ```bash
   npm run dev:all
   ```

7. **Access the applications**
   - Frontend Dashboard: http://localhost:3000
   - Backend API: http://localhost:3001
   - n8n Automation: http://localhost:5678

---

## 📁 Project Structure

```
affiliate-marketing-system/
├── backend/              # Node.js/TypeScript API
├── frontend/             # React/Next.js Dashboard
├── mcp-servers/          # MCP servers for Manus AI integration
│   ├── operations/       # Campaign & offer management
│   ├── content/          # AI content generation
│   ├── analytics/        # Performance analysis
│   ├── automation/       # Workflow control
│   └── integrations/     # API health & management
├── database/             # SQL migrations and seeds
├── automation/           # n8n workflows
├── landing-pages/        # Landing page templates
├── docs/                 # Documentation
└── scripts/              # Utility scripts
```

---

## 🔧 Configuration

### Required API Keys

You'll need API keys for:

**Affiliate Networks:**
- ClickBank
- ShareASale
- CJ Affiliate
- Impact

**Ad Platforms:**
- Meta (Facebook/Instagram)
- Google Ads
- TikTok Ads (optional)

**AI Services:**
- Anthropic Claude
- Midjourney
- Runway
- ElevenLabs

**Infrastructure:**
- Supabase (PostgreSQL)
- Cloudflare R2 (storage)

See `.env.example` for complete list and format.

---

## 📊 Database Schema

### Core Tables

- **networks** - Affiliate networks (ClickBank, ShareASale, etc.)
- **platforms** - Ad platforms (Meta, Google, TikTok)
- **offers** - Affiliate offers with quality scores
- **assets** - AI-generated creative content
- **landing_pages** - Landing pages for offers
- **campaigns** - Ad campaigns across platforms
- **clicks** - Click tracking data
- **conversions** - Conversion tracking data
- **users** - System users
- **settings** - System configuration

### Performance Views

- `campaign_performance` - Comprehensive campaign metrics
- `offer_performance` - Aggregated offer performance
- `daily_performance_summary` - Daily metrics
- `top_performing_assets` - Best creative assets
- `campaign_health_status` - Health assessment with recommendations

---

## 🤖 MCP Integration

### Available MCP Servers

1. **Operations Server** (Port 3100)
   - Campaign management
   - Offer management
   - Performance queries
   - Optimization actions

2. **Content Server** (Port 3101)
   - Image generation
   - Video generation
   - Copy generation
   - Asset management

3. **Analytics Server** (Port 3102)
   - Performance analysis
   - Trend detection
   - Predictive analytics
   - Reporting

4. **Automation Server** (Port 3103)
   - Workflow management
   - Rule configuration
   - Health monitoring

5. **Integrations Server** (Port 3104)
   - API health checks
   - Authentication management
   - Usage tracking

### Using with Manus AI

Once MCP servers are running, you can interact with your system conversationally:

```
You: "Show me campaigns with ROAS < 2.0x"
Manus: [queries via MCP] "Found 3 campaigns..."

You: "Pause them and generate new creative"
Manus: [executes via MCP] "Done. Paused 3 campaigns, generating new creative..."
```

---

## 🔄 Automation Workflows

### Pre-built n8n Workflows

1. **Performance Sync** - Hourly sync of campaign metrics
2. **Auto-Scaling** - Scale winning campaigns automatically
3. **Auto-Pause** - Pause underperforming campaigns
4. **Creative Refresh** - Refresh creative when CTR drops
5. **Offer Sync** - Weekly sync of new offers
6. **Conversion Tracking** - Real-time conversion processing
7. **Daily Report** - Automated daily performance reports

---

## 📈 Usage

### Creating Your First Campaign

1. **Add an offer** (Dashboard → Offers → Add Offer)
2. **Generate creative** (Content → Generate Assets)
3. **Create landing page** (Landing Pages → New Page)
4. **Launch campaign** (Campaigns → New Campaign)
5. **Monitor performance** (Dashboard → Analytics)

### Automated Optimization

The system automatically:
- Scales campaigns with ROAS > 3.0x
- Pauses campaigns with ROAS < 1.5x
- Refreshes creative after 21 days
- Syncs performance data hourly
- Generates daily reports

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run backend tests
npm run test --workspace=backend

# Run frontend tests
npm run test --workspace=frontend
```

---

## 🚢 Deployment

### Production Deployment

1. **Build all components**
   ```bash
   npm run build:all
   ```

2. **Deploy backend** (Railway, Render, or your server)
   ```bash
   cd backend
   npm run start
   ```

3. **Deploy frontend** (Vercel or your server)
   ```bash
   cd frontend
   npm run start
   ```

4. **Deploy MCP servers** (same server as backend)
   ```bash
   npm run start:mcp
   ```

See `docs/DEPLOYMENT_GUIDE.md` for detailed instructions.

---

## 📚 Documentation

- [Setup Guide](docs/SETUP_GUIDE.md)
- [API Documentation](docs/API_DOCUMENTATION.md)
- [MCP Documentation](docs/MCP_DOCUMENTATION.md)
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Architecture](docs/ARCHITECTURE.md)

---

## 🔐 Security

- All API keys encrypted at rest
- JWT authentication for API access
- Rate limiting on all endpoints
- CORS protection
- SQL injection prevention
- XSS protection

**Important:** Change the default admin password immediately after first login!

---

## 🐛 Troubleshooting

### Common Issues

**Database connection failed:**
- Check DATABASE_URL in .env
- Verify Supabase project is active
- Check firewall/network settings

**Redis connection failed:**
- Ensure Docker is running: `docker ps`
- Restart Redis: `docker-compose restart redis`

**n8n workflows not running:**
- Check n8n is accessible: http://localhost:5678
- Verify credentials are configured
- Check workflow activation status

See `docs/TROUBLESHOOTING.md` for more solutions.

---

## 📊 Performance

### Expected Metrics

- **API Response Time:** < 200ms (p95)
- **Dashboard Load Time:** < 2s
- **Database Query Time:** < 50ms (p95)
- **Workflow Execution:** < 5s per workflow

### Optimization

- Redis caching reduces database load by 90%+
- Database indexes optimize query performance
- CDN delivery for frontend assets
- Automatic connection pooling

---

## 🤝 Support

For issues, questions, or feature requests:

1. Check documentation in `docs/`
2. Review troubleshooting guide
3. Check automation logs: `npm run docker:logs`
4. Contact Manus AI for assistance

---

## 📝 License

This software is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

---

## 🎯 Roadmap

### Version 1.1 (Q1 2026)
- [ ] Mobile app (React Native)
- [ ] Advanced A/B testing
- [ ] Multi-user support with roles
- [ ] White-label landing pages

### Version 1.2 (Q2 2026)
- [ ] Machine learning for bid optimization
- [ ] Predictive analytics
- [ ] Advanced audience segmentation
- [ ] Integration with more ad platforms

---

## 🙏 Acknowledgments

Built with:
- Node.js & TypeScript
- React & Next.js
- PostgreSQL & Redis
- n8n
- Anthropic Claude
- Midjourney
- Runway
- And many other amazing open-source projects

---

**Ready to scale your affiliate marketing business? Let's go! 🚀**

