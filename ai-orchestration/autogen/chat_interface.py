"""
AutoGen Conversational Control Interface
Your command center for controlling the entire AI affiliate marketing system
"""

import asyncio
from typing import Dict, Any, List, Optional
from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.tools import AgentTool
from autogen_agentchat.ui import Console
from autogen_ext.models.openai import OpenAIChatCompletionClient
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from shared.config import Config, CoreType, CORE_FRAMEWORK_MAPPING


# =============================================================================
# AUTOGEN CHAT INTERFACE
# =============================================================================

class AffiliateCommandCenter:
    """
    AutoGen-based conversational interface for controlling the entire system.
    This is your command center where you can:
    - Chat with the system to trigger workflows
    - Monitor agent activities
    - Execute code snippets
    - Manage all 8 cores through conversation
    """
    
    def __init__(self):
        self.model_client = OpenAIChatCompletionClient(
            model=Config.DEFAULT_LLM_MODEL,
            api_key=Config.OPENAI_API_KEY
        )
        self.agents = self._create_agents()
        self.main_agent = self._create_main_agent()
    
    def _create_agents(self) -> Dict[str, AssistantAgent]:
        """Create specialized agents for each core"""
        agents = {}
        
        # Offer Intelligence Agent
        agents["offer_intel"] = AssistantAgent(
            name="offer_intelligence_agent",
            model_client=self.model_client,
            system_message="""You are the Offer Intelligence specialist for an affiliate marketing system.
            You help discover, analyze, and score affiliate products across networks like Hotmart, 
            ClickBank, and Impact. When asked about offers, you provide detailed analysis including
            commission rates, competition levels, and AI scores.""",
            description="Handles offer discovery, analysis, and scoring tasks."
        )
        
        # Content Generation Agent
        agents["content_gen"] = AssistantAgent(
            name="content_generation_agent",
            model_client=self.model_client,
            system_message="""You are the Content Generation specialist for an affiliate marketing system.
            You create high-converting ad copy, email sequences, social media posts, and video scripts.
            You understand direct response copywriting and platform-specific content requirements.""",
            description="Creates marketing content, copy, and creative assets."
        )
        
        # Campaign Management Agent
        agents["campaign_mgmt"] = AssistantAgent(
            name="campaign_management_agent",
            model_client=self.model_client,
            system_message="""You are the Campaign Management specialist for an affiliate marketing system.
            You manage campaign lifecycles, optimize budgets, and make scaling decisions.
            You understand ad platforms, A/B testing, and performance optimization.""",
            description="Manages campaigns, budgets, and optimization."
        )
        
        # Analytics Agent
        agents["analytics"] = AssistantAgent(
            name="analytics_agent",
            model_client=self.model_client,
            system_message="""You are the Analytics specialist for an affiliate marketing system.
            You analyze data, calculate KPIs, and generate actionable insights.
            You can interpret metrics like CTR, ROAS, and conversion rates.""",
            description="Analyzes data and generates insights."
        )
        
        # Financial Agent
        agents["financial"] = AssistantAgent(
            name="financial_agent",
            model_client=self.model_client,
            system_message="""You are the Financial Intelligence specialist for an affiliate marketing system.
            You track revenue, analyze expenses, and calculate profitability.
            You provide financial recommendations and forecasts.""",
            description="Tracks finances and calculates profitability."
        )
        
        return agents
    
    def _create_main_agent(self) -> AssistantAgent:
        """Create the main orchestrator agent with tools for each core"""
        
        # Create AgentTools for each specialized agent
        agent_tools = [
            AgentTool(self.agents["offer_intel"], return_value_as_last_message=True),
            AgentTool(self.agents["content_gen"], return_value_as_last_message=True),
            AgentTool(self.agents["campaign_mgmt"], return_value_as_last_message=True),
            AgentTool(self.agents["analytics"], return_value_as_last_message=True),
            AgentTool(self.agents["financial"], return_value_as_last_message=True),
        ]
        
        return AssistantAgent(
            name="affiliate_command_center",
            model_client=self.model_client,
            system_message="""You are the AI Command Center for an enterprise affiliate marketing system.
            
            You control 8 specialized cores:
            1. Offer Intelligence - Find and score affiliate products
            2. Content Generation - Create marketing content
            3. Campaign Management - Manage ad campaigns
            4. Analytics Engine - Analyze performance data
            5. Automation Hub - Run automated workflows
            6. Financial Intelligence - Track revenue and profits
            7. Integration Layer - Connect external services
            8. Personalization Engine - Customize user experience
            
            When a user makes a request:
            1. Determine which core(s) should handle it
            2. Delegate to the appropriate specialist agent
            3. Synthesize the results into a clear response
            
            You can also:
            - Execute Python code for quick calculations
            - Query the knowledge base for SOPs
            - Trigger automated workflows
            
            Always be helpful, concise, and action-oriented.""",
            tools=agent_tools,
            model_client_stream=True,
            max_tool_iterations=10
        )
    
    # =========================================================================
    # PUBLIC API
    # =========================================================================
    
    async def chat(self, message: str) -> str:
        """Send a message and get a response"""
        response = await self.main_agent.run(task=message)
        return str(response.messages[-1].content) if response.messages else "No response"
    
    async def chat_stream(self, message: str):
        """Stream a chat response"""
        await Console(self.main_agent.run_stream(task=message))
    
    async def execute_core(self, core: CoreType, task: str) -> Dict[str, Any]:
        """Execute a specific core with a task"""
        core_agent_map = {
            CoreType.OFFER_INTELLIGENCE: "offer_intel",
            CoreType.CONTENT_GENERATION: "content_gen",
            CoreType.CAMPAIGN_MANAGEMENT: "campaign_mgmt",
            CoreType.ANALYTICS_ENGINE: "analytics",
            CoreType.FINANCIAL_INTELLIGENCE: "financial",
        }
        
        agent_key = core_agent_map.get(core)
        if not agent_key or agent_key not in self.agents:
            return {"error": f"Core {core} not available"}
        
        agent = self.agents[agent_key]
        response = await agent.run(task=task)
        
        return {
            "core": core.value,
            "task": task,
            "response": str(response.messages[-1].content) if response.messages else "No response"
        }
    
    def get_available_cores(self) -> List[Dict[str, str]]:
        """Get list of available cores and their descriptions"""
        return [
            {
                "core": core.value,
                "description": config["description"],
                "primary_framework": config["primary"],
                "agents": config["agents"]
            }
            for core, config in CORE_FRAMEWORK_MAPPING.items()
        ]
    
    async def close(self):
        """Clean up resources"""
        await self.model_client.close()


# =============================================================================
# INTERACTIVE CLI
# =============================================================================

class InteractiveCLI:
    """Interactive command-line interface for the command center"""
    
    def __init__(self):
        self.command_center = AffiliateCommandCenter()
        self.running = True
    
    async def run(self):
        """Run the interactive CLI"""
        print("\n" + "="*60)
        print("🚀 AFFILIATE MARKETING AI COMMAND CENTER")
        print("="*60)
        print("\nWelcome! I'm your AI assistant for affiliate marketing.")
        print("I can help you with:")
        print("  • Finding and scoring affiliate offers")
        print("  • Creating marketing content")
        print("  • Managing campaigns")
        print("  • Analyzing performance")
        print("  • Tracking finances")
        print("\nType 'help' for commands, 'quit' to exit.\n")
        
        while self.running:
            try:
                user_input = input("You: ").strip()
                
                if not user_input:
                    continue
                
                if user_input.lower() == 'quit':
                    print("\nGoodbye! 👋")
                    self.running = False
                    break
                
                if user_input.lower() == 'help':
                    self._show_help()
                    continue
                
                if user_input.lower() == 'cores':
                    self._show_cores()
                    continue
                
                # Process the message
                print("\n🤖 Processing...\n")
                response = await self.command_center.chat(user_input)
                print(f"Assistant: {response}\n")
                
            except KeyboardInterrupt:
                print("\n\nInterrupted. Type 'quit' to exit.")
            except Exception as e:
                print(f"\nError: {e}\n")
        
        await self.command_center.close()
    
    def _show_help(self):
        """Show help information"""
        print("\n📚 AVAILABLE COMMANDS:")
        print("  help  - Show this help message")
        print("  cores - List available AI cores")
        print("  quit  - Exit the command center")
        print("\n💡 EXAMPLE QUERIES:")
        print("  • Find top 10 finance affiliate products")
        print("  • Create ad copy for a weight loss product")
        print("  • Analyze my campaign performance")
        print("  • Calculate my ROI for December")
        print()
    
    def _show_cores(self):
        """Show available cores"""
        print("\n🎯 AVAILABLE AI CORES:\n")
        for core_info in self.command_center.get_available_cores():
            print(f"  {core_info['core'].upper()}")
            print(f"    {core_info['description']}")
            print(f"    Framework: {core_info['primary_framework']}")
            print(f"    Agents: {', '.join(core_info['agents'])}")
            print()


# =============================================================================
# FACTORY FUNCTIONS
# =============================================================================

def create_command_center() -> AffiliateCommandCenter:
    """Factory function to create the command center"""
    return AffiliateCommandCenter()


async def start_interactive_cli():
    """Start the interactive CLI"""
    cli = InteractiveCLI()
    await cli.run()


# =============================================================================
# MAIN ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    asyncio.run(start_interactive_cli())
