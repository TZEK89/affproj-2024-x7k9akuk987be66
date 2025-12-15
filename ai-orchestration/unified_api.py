"""
Unified API - Wires all AI frameworks together
This is the central integration point for LangGraph, CrewAI, AutoGen, and LlamaIndex
"""

import asyncio
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
import sys

# Add paths for imports
sys.path.append(os.path.dirname(__file__))

from shared.config import Config, CoreType, TaskStatus, CORE_FRAMEWORK_MAPPING
from langgraph.orchestrator import MasterOrchestrator, create_orchestrator
from llamaindex.knowledge_base import AffiliateKnowledgeBase, create_knowledge_base
from autogen.chat_interface import AffiliateCommandCenter, create_command_center


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default"
    user_id: Optional[str] = "default"


class ChatResponse(BaseModel):
    response: str
    core_executed: Optional[str] = None
    task_id: Optional[str] = None
    status: str = "completed"


class CoreExecutionRequest(BaseModel):
    core: str
    task: str
    parameters: Optional[Dict[str, Any]] = {}


class CoreExecutionResponse(BaseModel):
    core: str
    task_id: str
    status: str
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class KnowledgeQueryRequest(BaseModel):
    question: str
    category: Optional[str] = None


class KnowledgeAddRequest(BaseModel):
    title: str
    content: str
    category: str
    doc_type: Optional[str] = "custom"


# =============================================================================
# UNIFIED AI SYSTEM
# =============================================================================

class UnifiedAISystem:
    """
    Central integration point for all AI frameworks.
    Manages the lifecycle and communication between:
    - LangGraph (Master Orchestrator)
    - CrewAI (Agent Teams)
    - AutoGen (Conversational Interface)
    - LlamaIndex (Knowledge Base)
    """
    
    def __init__(self):
        self.orchestrator: Optional[MasterOrchestrator] = None
        self.knowledge_base: Optional[AffiliateKnowledgeBase] = None
        self.command_center: Optional[AffiliateCommandCenter] = None
        self.task_history: List[Dict[str, Any]] = []
        self._initialized = False
    
    async def initialize(self):
        """Initialize all AI frameworks"""
        if self._initialized:
            return
        
        print("🚀 Initializing Unified AI System...")
        
        # Initialize LangGraph Orchestrator
        print("  ├─ Initializing LangGraph Master Orchestrator...")
        self.orchestrator = create_orchestrator()
        
        # Initialize LlamaIndex Knowledge Base
        print("  ├─ Initializing LlamaIndex Knowledge Base...")
        self.knowledge_base = create_knowledge_base()
        
        # Initialize AutoGen Command Center
        print("  ├─ Initializing AutoGen Command Center...")
        self.command_center = create_command_center()
        
        self._initialized = True
        print("  └─ ✅ All systems initialized!")
    
    async def shutdown(self):
        """Shutdown all AI frameworks"""
        if self.command_center:
            await self.command_center.close()
        self._initialized = False
    
    # =========================================================================
    # CHAT INTERFACE
    # =========================================================================
    
    async def chat(self, message: str, session_id: str = "default") -> Dict[str, Any]:
        """
        Main chat interface - routes through LangGraph orchestrator
        """
        if not self._initialized:
            await self.initialize()
        
        # Get context from knowledge base
        context = self.knowledge_base.query(message)
        
        # Route through LangGraph orchestrator
        result = await self.orchestrator.run(message, session_id)
        
        # Extract response
        messages = result.get("messages", [])
        response = messages[-1].get("content", "No response") if messages else "No response"
        
        # Get executed core
        completed_tasks = result.get("completed_tasks", [])
        core_executed = completed_tasks[0].get("core") if completed_tasks else None
        
        # Log to history
        self.task_history.append({
            "session_id": session_id,
            "message": message,
            "response": response,
            "core_executed": core_executed
        })
        
        return {
            "response": response,
            "core_executed": core_executed,
            "context_sources": context.get("sources", [])
        }
    
    # =========================================================================
    # CORE EXECUTION
    # =========================================================================
    
    async def execute_core(self, core: str, task: str, parameters: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Execute a specific core directly
        """
        if not self._initialized:
            await self.initialize()
        
        try:
            core_type = CoreType(core)
        except ValueError:
            return {"error": f"Invalid core: {core}"}
        
        # Get context from knowledge base
        context = self.knowledge_base.get_context_for_core(core)
        
        # Execute based on primary framework
        config = CORE_FRAMEWORK_MAPPING.get(core_type, {})
        primary_framework = config.get("primary", "langgraph")
        
        if primary_framework == "crewai":
            result = await self._execute_crewai_core(core_type, task, context)
        elif primary_framework == "langgraph":
            result = await self._execute_langgraph_core(core_type, task, context)
        elif primary_framework == "llamaindex":
            result = await self._execute_llamaindex_core(core_type, task, context)
        else:
            result = {"error": f"Unknown framework: {primary_framework}"}
        
        return result
    
    async def _execute_crewai_core(self, core: CoreType, task: str, context: str) -> Dict[str, Any]:
        """Execute a CrewAI-based core"""
        from crewai.crews.offer_intelligence import OfferIntelligenceCrew
        from crewai.crews.content_generation import ContentGenerationCrew
        from crewai.crews.financial_intelligence import FinancialIntelligenceCrew
        
        crew_map = {
            CoreType.OFFER_INTELLIGENCE: OfferIntelligenceCrew,
            CoreType.CONTENT_GENERATION: ContentGenerationCrew,
            CoreType.FINANCIAL_INTELLIGENCE: FinancialIntelligenceCrew,
        }
        
        crew_class = crew_map.get(core)
        if not crew_class:
            return {"error": f"No CrewAI crew for core: {core}"}
        
        crew = crew_class()
        result = await crew.execute(f"{task}\n\nContext: {context}")
        return result
    
    async def _execute_langgraph_core(self, core: CoreType, task: str, context: str) -> Dict[str, Any]:
        """Execute a LangGraph-based core"""
        # Route through the orchestrator with specific core targeting
        result = await self.orchestrator.run(
            f"[CORE: {core.value}] {task}\n\nContext: {context}",
            session_id=f"core_{core.value}"
        )
        return {
            "core": core.value,
            "status": "completed",
            "result": result
        }
    
    async def _execute_llamaindex_core(self, core: CoreType, task: str, context: str) -> Dict[str, Any]:
        """Execute a LlamaIndex-based core"""
        from llamaindex.knowledge_base import PersonalizationEngine
        
        if core == CoreType.PERSONALIZATION_ENGINE:
            engine = PersonalizationEngine()
            result = await engine.personalize(task)
            return {
                "core": core.value,
                "status": "completed",
                "result": result
            }
        
        return {"error": f"No LlamaIndex handler for core: {core}"}
    
    # =========================================================================
    # KNOWLEDGE BASE
    # =========================================================================
    
    def query_knowledge(self, question: str, category: str = None) -> Dict[str, Any]:
        """Query the knowledge base"""
        if not self.knowledge_base:
            return {"error": "Knowledge base not initialized"}
        
        return self.knowledge_base.query(question, category)
    
    def add_knowledge(self, title: str, content: str, category: str, doc_type: str = "custom") -> bool:
        """Add a document to the knowledge base"""
        if not self.knowledge_base:
            return False
        
        return self.knowledge_base.add_document(title, content, category, doc_type)
    
    def list_knowledge(self) -> List[Dict[str, str]]:
        """List all documents in the knowledge base"""
        if not self.knowledge_base:
            return []
        
        return self.knowledge_base.list_documents()
    
    # =========================================================================
    # STATUS & MONITORING
    # =========================================================================
    
    def get_status(self) -> Dict[str, Any]:
        """Get system status"""
        return {
            "initialized": self._initialized,
            "frameworks": {
                "langgraph": self.orchestrator is not None,
                "llamaindex": self.knowledge_base is not None,
                "autogen": self.command_center is not None,
                "crewai": True  # CrewAI crews are created on-demand
            },
            "cores": [core.value for core in CoreType],
            "task_history_count": len(self.task_history)
        }
    
    def get_task_history(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent task history"""
        return self.task_history[-limit:]


# =============================================================================
# FASTAPI APPLICATION
# =============================================================================

app = FastAPI(
    title="Affiliate Marketing AI System",
    description="Unified API for the 8-Core AI Affiliate Marketing System",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global AI system instance
ai_system = UnifiedAISystem()


@app.on_event("startup")
async def startup_event():
    """Initialize AI system on startup"""
    await ai_system.initialize()


@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown AI system"""
    await ai_system.shutdown()


# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "Affiliate Marketing AI System",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/status")
async def get_status():
    """Get system status"""
    return ai_system.get_status()


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Main chat endpoint"""
    try:
        result = await ai_system.chat(request.message, request.session_id)
        return ChatResponse(
            response=result.get("response", ""),
            core_executed=result.get("core_executed"),
            status="completed"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/execute", response_model=CoreExecutionResponse)
async def execute_core(request: CoreExecutionRequest):
    """Execute a specific core"""
    try:
        result = await ai_system.execute_core(
            request.core,
            request.task,
            request.parameters
        )
        return CoreExecutionResponse(
            core=request.core,
            task_id=f"task_{request.core}_{len(ai_system.task_history)}",
            status="completed" if "error" not in result else "failed",
            result=result if "error" not in result else None,
            error=result.get("error")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/cores")
async def list_cores():
    """List available cores"""
    return {
        "cores": [
            {
                "id": core.value,
                "name": core.name.replace("_", " ").title(),
                "description": config["description"],
                "primary_framework": config["primary"],
                "agents": config["agents"]
            }
            for core, config in CORE_FRAMEWORK_MAPPING.items()
        ]
    }


@app.post("/knowledge/query")
async def query_knowledge(request: KnowledgeQueryRequest):
    """Query the knowledge base"""
    return ai_system.query_knowledge(request.question, request.category)


@app.post("/knowledge/add")
async def add_knowledge(request: KnowledgeAddRequest):
    """Add a document to the knowledge base"""
    success = ai_system.add_knowledge(
        request.title,
        request.content,
        request.category,
        request.doc_type
    )
    return {"success": success}


@app.get("/knowledge/list")
async def list_knowledge():
    """List all documents in the knowledge base"""
    return {"documents": ai_system.list_knowledge()}


@app.get("/history")
async def get_history(limit: int = 10):
    """Get task history"""
    return {"history": ai_system.get_task_history(limit)}


# =============================================================================
# MAIN ENTRY POINT
# =============================================================================

def start_server(host: str = "0.0.0.0", port: int = 8000):
    """Start the API server"""
    uvicorn.run(app, host=host, port=port)


if __name__ == "__main__":
    start_server()
