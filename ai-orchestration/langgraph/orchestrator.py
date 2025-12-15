"""
LangGraph Master Orchestrator
Controls the flow between all 8 cores and manages global state
"""

from typing import TypedDict, Annotated, Literal, Optional, Dict, Any, List
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
import operator
import asyncio

from shared.config import (
    Config, CoreType, TaskStatus, OrchestratorState,
    CORE_FRAMEWORK_MAPPING, get_primary_framework
)


# =============================================================================
# STATE DEFINITION
# =============================================================================

class MasterState(TypedDict):
    """Master state for the orchestrator graph"""
    session_id: str
    messages: Annotated[List[Dict], operator.add]
    current_core: Optional[str]
    task_queue: List[Dict[str, Any]]
    completed_tasks: List[Dict[str, Any]]
    global_context: Dict[str, Any]
    routing_decision: Optional[str]
    error: Optional[str]


# =============================================================================
# ORCHESTRATOR NODES
# =============================================================================

class MasterOrchestrator:
    """
    LangGraph-based master orchestrator that routes tasks to appropriate cores
    and manages the overall workflow of the affiliate marketing system.
    """
    
    def __init__(self):
        self.llm = ChatOpenAI(
            model=Config.DEFAULT_LLM_MODEL,
            api_key=Config.OPENAI_API_KEY,
            temperature=0.1
        )
        self.memory = MemorySaver()
        self.graph = self._build_graph()
    
    def _build_graph(self) -> StateGraph:
        """Build the master orchestration graph"""
        
        # Create the graph
        graph = StateGraph(MasterState)
        
        # Add nodes for each function
        graph.add_node("analyze_request", self.analyze_request)
        graph.add_node("route_to_core", self.route_to_core)
        graph.add_node("execute_offer_intelligence", self.execute_offer_intelligence)
        graph.add_node("execute_content_generation", self.execute_content_generation)
        graph.add_node("execute_campaign_management", self.execute_campaign_management)
        graph.add_node("execute_analytics", self.execute_analytics)
        graph.add_node("execute_automation", self.execute_automation)
        graph.add_node("execute_financial", self.execute_financial)
        graph.add_node("execute_integration", self.execute_integration)
        graph.add_node("execute_personalization", self.execute_personalization)
        graph.add_node("aggregate_results", self.aggregate_results)
        graph.add_node("handle_error", self.handle_error)
        
        # Add edges
        graph.add_edge(START, "analyze_request")
        graph.add_edge("analyze_request", "route_to_core")
        
        # Conditional routing based on core type
        graph.add_conditional_edges(
            "route_to_core",
            self._route_decision,
            {
                "offer_intelligence": "execute_offer_intelligence",
                "content_generation": "execute_content_generation",
                "campaign_management": "execute_campaign_management",
                "analytics_engine": "execute_analytics",
                "automation_hub": "execute_automation",
                "financial_intelligence": "execute_financial",
                "integration_layer": "execute_integration",
                "personalization_engine": "execute_personalization",
                "error": "handle_error",
                "complete": "aggregate_results"
            }
        )
        
        # All core executions lead to aggregate_results
        for core_node in [
            "execute_offer_intelligence", "execute_content_generation",
            "execute_campaign_management", "execute_analytics",
            "execute_automation", "execute_financial",
            "execute_integration", "execute_personalization"
        ]:
            graph.add_edge(core_node, "aggregate_results")
        
        graph.add_edge("handle_error", "aggregate_results")
        graph.add_edge("aggregate_results", END)
        
        return graph.compile(checkpointer=self.memory)
    
    def _route_decision(self, state: MasterState) -> str:
        """Determine which core to route to"""
        routing = state.get("routing_decision")
        if routing:
            return routing
        return "complete"
    
    # =========================================================================
    # NODE IMPLEMENTATIONS
    # =========================================================================
    
    async def analyze_request(self, state: MasterState) -> Dict[str, Any]:
        """Analyze the incoming request and determine intent"""
        messages = state.get("messages", [])
        
        if not messages:
            return {"error": "No messages to analyze"}
        
        last_message = messages[-1] if messages else {}
        content = last_message.get("content", "")
        
        # Use LLM to analyze intent
        system_prompt = """You are an AI orchestrator for an affiliate marketing system.
        Analyze the user's request and determine which core should handle it:
        
        1. offer_intelligence - Finding, analyzing, scoring affiliate products
        2. content_generation - Creating copy, images, videos, landing pages
        3. campaign_management - Managing ad campaigns, budgets, scheduling
        4. analytics_engine - Data analysis, metrics, reporting
        5. automation_hub - Automated workflows, triggers, scheduling
        6. financial_intelligence - Revenue tracking, expenses, profitability
        7. integration_layer - API connections, external services
        8. personalization_engine - User preferences, recommendations
        
        Respond with ONLY the core name (e.g., "offer_intelligence")."""
        
        response = await self.llm.ainvoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=content)
        ])
        
        core_decision = response.content.strip().lower().replace(" ", "_")
        
        return {
            "global_context": {
                **state.get("global_context", {}),
                "analyzed_intent": core_decision,
                "original_request": content
            }
        }
    
    async def route_to_core(self, state: MasterState) -> Dict[str, Any]:
        """Route the request to the appropriate core"""
        context = state.get("global_context", {})
        intent = context.get("analyzed_intent", "")
        
        valid_cores = [
            "offer_intelligence", "content_generation", "campaign_management",
            "analytics_engine", "automation_hub", "financial_intelligence",
            "integration_layer", "personalization_engine"
        ]
        
        if intent in valid_cores:
            return {
                "routing_decision": intent,
                "current_core": intent
            }
        
        return {"routing_decision": "error", "error": f"Unknown intent: {intent}"}
    
    async def execute_offer_intelligence(self, state: MasterState) -> Dict[str, Any]:
        """Execute Offer Intelligence core using CrewAI"""
        from crewai_agents.offer_intelligence import OfferIntelligenceCrew
        
        context = state.get("global_context", {})
        request = context.get("original_request", "")
        
        crew = OfferIntelligenceCrew()
        result = await crew.execute(request)
        
        return {
            "completed_tasks": [{
                "core": "offer_intelligence",
                "result": result,
                "status": "completed"
            }],
            "messages": [{"role": "assistant", "content": str(result)}]
        }
    
    async def execute_content_generation(self, state: MasterState) -> Dict[str, Any]:
        """Execute Content Generation core using CrewAI + AutoGen"""
        from crewai_agents.content_generation import ContentGenerationCrew
        
        context = state.get("global_context", {})
        request = context.get("original_request", "")
        
        crew = ContentGenerationCrew()
        result = await crew.execute(request)
        
        return {
            "completed_tasks": [{
                "core": "content_generation",
                "result": result,
                "status": "completed"
            }],
            "messages": [{"role": "assistant", "content": str(result)}]
        }
    
    async def execute_campaign_management(self, state: MasterState) -> Dict[str, Any]:
        """Execute Campaign Management core using LangGraph sub-graph"""
        # This would call a nested LangGraph for campaign state management
        context = state.get("global_context", {})
        
        return {
            "completed_tasks": [{
                "core": "campaign_management",
                "result": {"status": "Campaign management executed"},
                "status": "completed"
            }],
            "messages": [{"role": "assistant", "content": "Campaign management task completed"}]
        }
    
    async def execute_analytics(self, state: MasterState) -> Dict[str, Any]:
        """Execute Analytics Engine core"""
        return {
            "completed_tasks": [{
                "core": "analytics_engine",
                "result": {"status": "Analytics executed"},
                "status": "completed"
            }],
            "messages": [{"role": "assistant", "content": "Analytics task completed"}]
        }
    
    async def execute_automation(self, state: MasterState) -> Dict[str, Any]:
        """Execute Automation Hub core"""
        return {
            "completed_tasks": [{
                "core": "automation_hub",
                "result": {"status": "Automation executed"},
                "status": "completed"
            }],
            "messages": [{"role": "assistant", "content": "Automation task completed"}]
        }
    
    async def execute_financial(self, state: MasterState) -> Dict[str, Any]:
        """Execute Financial Intelligence core using CrewAI"""
        from crewai_agents.financial_intelligence import FinancialIntelligenceCrew
        
        context = state.get("global_context", {})
        request = context.get("original_request", "")
        
        crew = FinancialIntelligenceCrew()
        result = await crew.execute(request)
        
        return {
            "completed_tasks": [{
                "core": "financial_intelligence",
                "result": result,
                "status": "completed"
            }],
            "messages": [{"role": "assistant", "content": str(result)}]
        }
    
    async def execute_integration(self, state: MasterState) -> Dict[str, Any]:
        """Execute Integration Layer core"""
        return {
            "completed_tasks": [{
                "core": "integration_layer",
                "result": {"status": "Integration executed"},
                "status": "completed"
            }],
            "messages": [{"role": "assistant", "content": "Integration task completed"}]
        }
    
    async def execute_personalization(self, state: MasterState) -> Dict[str, Any]:
        """Execute Personalization Engine core using LlamaIndex"""
        from llamaindex_rag.personalization import PersonalizationEngine
        
        context = state.get("global_context", {})
        request = context.get("original_request", "")
        
        engine = PersonalizationEngine()
        result = await engine.personalize(request)
        
        return {
            "completed_tasks": [{
                "core": "personalization_engine",
                "result": result,
                "status": "completed"
            }],
            "messages": [{"role": "assistant", "content": str(result)}]
        }
    
    async def aggregate_results(self, state: MasterState) -> Dict[str, Any]:
        """Aggregate results from all executed cores"""
        completed = state.get("completed_tasks", [])
        
        summary = {
            "total_tasks": len(completed),
            "cores_executed": [t.get("core") for t in completed],
            "all_successful": all(t.get("status") == "completed" for t in completed)
        }
        
        return {
            "global_context": {
                **state.get("global_context", {}),
                "execution_summary": summary
            }
        }
    
    async def handle_error(self, state: MasterState) -> Dict[str, Any]:
        """Handle errors in the orchestration"""
        error = state.get("error", "Unknown error")
        
        return {
            "messages": [{
                "role": "assistant",
                "content": f"Error occurred: {error}. Please try again or rephrase your request."
            }],
            "completed_tasks": [{
                "core": "error_handler",
                "result": {"error": error},
                "status": "failed"
            }]
        }
    
    # =========================================================================
    # PUBLIC API
    # =========================================================================
    
    async def run(self, message: str, session_id: str = "default") -> Dict[str, Any]:
        """Run the orchestrator with a user message"""
        initial_state = {
            "session_id": session_id,
            "messages": [{"role": "user", "content": message}],
            "current_core": None,
            "task_queue": [],
            "completed_tasks": [],
            "global_context": {},
            "routing_decision": None,
            "error": None
        }
        
        config = {"configurable": {"thread_id": session_id}}
        result = await self.graph.ainvoke(initial_state, config)
        
        return result
    
    def run_sync(self, message: str, session_id: str = "default") -> Dict[str, Any]:
        """Synchronous wrapper for run()"""
        return asyncio.run(self.run(message, session_id))


# =============================================================================
# FACTORY FUNCTION
# =============================================================================

def create_orchestrator() -> MasterOrchestrator:
    """Factory function to create the master orchestrator"""
    return MasterOrchestrator()


# =============================================================================
# CLI FOR TESTING
# =============================================================================

if __name__ == "__main__":
    import sys
    
    orchestrator = create_orchestrator()
    
    if len(sys.argv) > 1:
        message = " ".join(sys.argv[1:])
    else:
        message = "Find the top 10 affiliate products in the finance niche"
    
    print(f"Processing: {message}")
    result = orchestrator.run_sync(message)
    print(f"Result: {result}")
