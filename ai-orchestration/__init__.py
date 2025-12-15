"""
AI Orchestration Module
8-Core AI Affiliate Marketing System

Frameworks:
- LangGraph: Master orchestrator for workflow management
- CrewAI: Role-based agent teams for specialized tasks
- AutoGen: Conversational control interface
- LlamaIndex: Knowledge base and RAG system
"""

from .unified_api import UnifiedAISystem, app, start_server

__version__ = "1.0.0"
__all__ = ["UnifiedAISystem", "app", "start_server"]
