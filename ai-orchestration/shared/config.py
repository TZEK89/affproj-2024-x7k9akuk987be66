"""
Shared Configuration for AI Orchestration System
All frameworks share this configuration for consistency
"""

import os
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from enum import Enum

load_dotenv()

# =============================================================================
# ENVIRONMENT CONFIGURATION
# =============================================================================

class Config:
    """Central configuration for all AI frameworks"""
    
    # API Keys
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
    
    # Database
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")
    DATABASE_URL = os.getenv("DATABASE_URL")
    
    # Model Configuration
    DEFAULT_LLM_MODEL = "gpt-4o"
    DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small"
    
    # Framework Settings
    LANGGRAPH_CHECKPOINT_DIR = "./checkpoints"
    LLAMAINDEX_STORAGE_DIR = "./knowledge_base"
    CREWAI_VERBOSE = True
    AUTOGEN_CODE_EXECUTION = True


# =============================================================================
# CORE DEFINITIONS
# =============================================================================

class CoreType(str, Enum):
    """The 8 cores of the affiliate marketing system"""
    OFFER_INTELLIGENCE = "offer_intelligence"
    CONTENT_GENERATION = "content_generation"
    CAMPAIGN_MANAGEMENT = "campaign_management"
    ANALYTICS_ENGINE = "analytics_engine"
    AUTOMATION_HUB = "automation_hub"
    FINANCIAL_INTELLIGENCE = "financial_intelligence"
    INTEGRATION_LAYER = "integration_layer"
    PERSONALIZATION_ENGINE = "personalization_engine"


class TaskStatus(str, Enum):
    """Status of tasks across all frameworks"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"
    CANCELLED = "cancelled"


# =============================================================================
# SHARED STATE MODELS
# =============================================================================

class AgentState(BaseModel):
    """Shared state model for all agents across frameworks"""
    task_id: str
    core: CoreType
    status: TaskStatus = TaskStatus.PENDING
    input_data: Dict[str, Any] = {}
    output_data: Dict[str, Any] = {}
    messages: List[Dict[str, Any]] = []
    metadata: Dict[str, Any] = {}
    error: Optional[str] = None
    
    class Config:
        use_enum_values = True


class OrchestratorState(BaseModel):
    """State for the LangGraph master orchestrator"""
    session_id: str
    current_core: Optional[CoreType] = None
    active_tasks: List[str] = []
    completed_tasks: List[str] = []
    global_context: Dict[str, Any] = {}
    user_preferences: Dict[str, Any] = {}
    
    class Config:
        use_enum_values = True


# =============================================================================
# CORE CONFIGURATION MAPPING
# =============================================================================

CORE_FRAMEWORK_MAPPING = {
    CoreType.OFFER_INTELLIGENCE: {
        "primary": "crewai",
        "secondary": ["llamaindex"],
        "agents": ["market_researcher", "competitor_analyst", "scoring_agent"],
        "description": "Discovers and scores affiliate offers across networks"
    },
    CoreType.CONTENT_GENERATION: {
        "primary": "crewai",
        "secondary": ["autogen"],
        "agents": ["copywriter", "visual_designer", "video_scripter", "code_generator"],
        "description": "Generates marketing content, copy, and landing pages"
    },
    CoreType.CAMPAIGN_MANAGEMENT: {
        "primary": "langgraph",
        "secondary": ["crewai"],
        "agents": ["campaign_orchestrator", "budget_optimizer", "scheduler"],
        "description": "Manages campaign lifecycle and optimization"
    },
    CoreType.ANALYTICS_ENGINE: {
        "primary": "langgraph",
        "secondary": ["llamaindex"],
        "agents": ["data_pipeline", "metrics_calculator", "insight_generator"],
        "description": "Processes data and generates actionable insights"
    },
    CoreType.AUTOMATION_HUB: {
        "primary": "langgraph",
        "secondary": ["crewai"],
        "agents": ["workflow_engine", "trigger_manager", "task_executor"],
        "description": "Executes automated workflows and triggers"
    },
    CoreType.FINANCIAL_INTELLIGENCE: {
        "primary": "crewai",
        "secondary": ["llamaindex"],
        "agents": ["revenue_tracker", "expense_analyzer", "profit_calculator"],
        "description": "Tracks revenue, expenses, and profitability"
    },
    CoreType.INTEGRATION_LAYER: {
        "primary": "langgraph",
        "secondary": ["autogen"],
        "agents": ["api_gateway", "mcp_connector", "data_transformer"],
        "description": "Manages external integrations and MCP servers"
    },
    CoreType.PERSONALIZATION_ENGINE: {
        "primary": "llamaindex",
        "secondary": ["crewai"],
        "agents": ["user_profiler", "recommendation_engine", "personalization_agent"],
        "description": "Personalizes user experience based on behavior"
    }
}


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def get_core_config(core: CoreType) -> Dict[str, Any]:
    """Get configuration for a specific core"""
    return CORE_FRAMEWORK_MAPPING.get(core, {})


def get_primary_framework(core: CoreType) -> str:
    """Get the primary framework for a core"""
    config = get_core_config(core)
    return config.get("primary", "langgraph")


def get_agents_for_core(core: CoreType) -> List[str]:
    """Get list of agents for a specific core"""
    config = get_core_config(core)
    return config.get("agents", [])
