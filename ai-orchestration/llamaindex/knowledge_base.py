"""
LlamaIndex Knowledge Base and RAG System
Manages SOPs, documentation, and provides context to all agents
"""

from llama_index.core import (
    VectorStoreIndex,
    SimpleDirectoryReader,
    Document,
    Settings,
    StorageContext,
    load_index_from_storage
)
from llama_index.core.node_parser import SentenceSplitter
from llama_index.llms.openai import OpenAI
from llama_index.embeddings.openai import OpenAIEmbedding
from typing import List, Dict, Any, Optional
from pathlib import Path
import os
import sys
import json

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from shared.config import Config


# =============================================================================
# CONFIGURATION
# =============================================================================

# Configure LlamaIndex settings
Settings.llm = OpenAI(model=Config.DEFAULT_LLM_MODEL, api_key=Config.OPENAI_API_KEY)
Settings.embed_model = OpenAIEmbedding(model=Config.DEFAULT_EMBEDDING_MODEL, api_key=Config.OPENAI_API_KEY)
Settings.node_parser = SentenceSplitter(chunk_size=1024, chunk_overlap=200)


# =============================================================================
# KNOWLEDGE BASE CLASS
# =============================================================================

class AffiliateKnowledgeBase:
    """
    Central knowledge base for the affiliate marketing system.
    Stores and retrieves SOPs, best practices, and historical data.
    """
    
    def __init__(self, storage_dir: str = None):
        self.storage_dir = storage_dir or Config.LLAMAINDEX_STORAGE_DIR
        self.index = None
        self._initialize_storage()
    
    def _initialize_storage(self):
        """Initialize or load the vector store"""
        storage_path = Path(self.storage_dir)
        
        if storage_path.exists() and (storage_path / "docstore.json").exists():
            # Load existing index
            storage_context = StorageContext.from_defaults(persist_dir=str(storage_path))
            self.index = load_index_from_storage(storage_context)
        else:
            # Create new index with default documents
            storage_path.mkdir(parents=True, exist_ok=True)
            self._create_default_knowledge_base()
    
    def _create_default_knowledge_base(self):
        """Create the default knowledge base with core SOPs"""
        default_docs = self._get_default_documents()
        self.index = VectorStoreIndex.from_documents(default_docs)
        self.index.storage_context.persist(persist_dir=self.storage_dir)
    
    def _get_default_documents(self) -> List[Document]:
        """Get default SOP documents for the knowledge base"""
        sops = [
            {
                "title": "Offer Selection SOP",
                "category": "offer_intelligence",
                "content": """
                # Offer Selection Standard Operating Procedure
                
                ## Criteria for Selecting Affiliate Offers
                
                1. **Commission Rate**: Minimum 30% for digital products, 5% for physical
                2. **Price Point**: Sweet spot is $47-$297 for cold traffic
                3. **Gravity/Popularity**: Look for products with proven sales history
                4. **Refund Rate**: Avoid products with >10% refund rates
                5. **Vendor Reputation**: Check vendor history and support quality
                
                ## Red Flags to Avoid
                - New vendors with no track record
                - Products with excessive upsells
                - Misleading sales pages
                - Poor affiliate support
                
                ## Scoring Formula
                AI Score = (Commission * 0.25) + (Price_Score * 0.15) + (Competition_Inverse * 0.20) 
                         + (Demand * 0.20) + (Trend * 0.10) + (Platform_Trust * 0.10)
                """
            },
            {
                "title": "Content Creation SOP",
                "category": "content_generation",
                "content": """
                # Content Creation Standard Operating Procedure
                
                ## Ad Copy Guidelines
                
                1. **Headlines**: Use numbers, questions, or bold claims
                2. **Body Copy**: Focus on benefits, not features
                3. **CTA**: Clear, action-oriented, create urgency
                
                ## Email Sequence Structure
                - Email 1: Welcome + Lead Magnet Delivery
                - Email 2: Value + Trust Building
                - Email 3: Story + Problem Agitation
                - Email 4: Solution + Product Introduction
                - Email 5: Urgency + Final Push
                
                ## Platform-Specific Guidelines
                - Facebook: 125 characters for primary text
                - Google: 30 char headlines, 90 char descriptions
                - Email: 50 char subject lines, 35 char preview text
                """
            },
            {
                "title": "Campaign Management SOP",
                "category": "campaign_management",
                "content": """
                # Campaign Management Standard Operating Procedure
                
                ## Campaign Lifecycle
                1. Planning → 2. Setup → 3. Launch → 4. Optimize → 5. Scale/Kill
                
                ## Budget Allocation Rules
                - Test budget: $50-100 per ad set
                - Scale threshold: 2x ROAS for 3 consecutive days
                - Kill threshold: <0.5x ROAS after $100 spend
                
                ## Optimization Schedule
                - Day 1-3: Let data accumulate, no changes
                - Day 4-7: Kill underperformers, duplicate winners
                - Week 2+: Scale winners, test new angles
                
                ## Key Metrics to Track
                - CTR: Target >1% for cold traffic
                - CPC: Varies by niche, track trends
                - Conversion Rate: Target >2% for landing pages
                - ROAS: Minimum 2x for profitability
                """
            },
            {
                "title": "Financial Tracking SOP",
                "category": "financial_intelligence",
                "content": """
                # Financial Tracking Standard Operating Procedure
                
                ## Revenue Tracking
                - Log all earnings daily from each platform
                - Reconcile with actual payments monthly
                - Track pending vs confirmed commissions
                
                ## Expense Categories
                1. Advertising (Facebook, Google, Native)
                2. Tools (Email, Landing Pages, Tracking)
                3. Content (Copywriting, Design, Video)
                4. Operations (VA, Software, Hosting)
                
                ## Profitability Calculations
                - Gross Profit = Revenue - Ad Spend
                - Net Profit = Gross Profit - All Expenses
                - ROI = (Net Profit / Total Investment) * 100
                - ROAS = Revenue / Ad Spend
                
                ## Tax Considerations
                - Set aside 25-30% for taxes
                - Track all deductible expenses
                - Keep receipts for 7 years
                """
            },
            {
                "title": "Platform Integration Guide",
                "category": "integration_layer",
                "content": """
                # Platform Integration Guide
                
                ## Supported Affiliate Networks
                
                ### Hotmart
                - API: REST API available
                - Commission tracking: Real-time
                - Payment: Weekly/Monthly
                
                ### ClickBank
                - API: Reporting API
                - Commission tracking: Real-time
                - Payment: Weekly
                
                ### Impact
                - API: Full REST API
                - Commission tracking: Real-time
                - Payment: Monthly
                
                ### Amazon Associates
                - API: Product Advertising API
                - Commission tracking: Daily
                - Payment: Monthly (60-day delay)
                
                ## MCP Server Integrations
                - Firecrawl: Web scraping
                - Playwright: Browser automation
                - Supabase: Database operations
                - Gmail: Email automation
                """
            }
        ]
        
        documents = []
        for sop in sops:
            doc = Document(
                text=sop["content"],
                metadata={
                    "title": sop["title"],
                    "category": sop["category"],
                    "type": "sop"
                }
            )
            documents.append(doc)
        
        return documents
    
    # =========================================================================
    # PUBLIC API
    # =========================================================================
    
    def query(self, question: str, category: Optional[str] = None) -> Dict[str, Any]:
        """Query the knowledge base"""
        if not self.index:
            return {"error": "Knowledge base not initialized"}
        
        query_engine = self.index.as_query_engine(
            similarity_top_k=5,
            response_mode="tree_summarize"
        )
        
        # Add category filter if specified
        if category:
            question = f"[Category: {category}] {question}"
        
        response = query_engine.query(question)
        
        return {
            "answer": str(response),
            "sources": [
                {
                    "title": node.metadata.get("title", "Unknown"),
                    "category": node.metadata.get("category", "Unknown"),
                    "score": node.score if hasattr(node, 'score') else None
                }
                for node in response.source_nodes
            ]
        }
    
    def add_document(self, title: str, content: str, category: str, doc_type: str = "custom") -> bool:
        """Add a new document to the knowledge base"""
        try:
            doc = Document(
                text=content,
                metadata={
                    "title": title,
                    "category": category,
                    "type": doc_type
                }
            )
            
            self.index.insert(doc)
            self.index.storage_context.persist(persist_dir=self.storage_dir)
            return True
        except Exception as e:
            print(f"Error adding document: {e}")
            return False
    
    def get_context_for_core(self, core: str) -> str:
        """Get relevant context for a specific core"""
        result = self.query(f"What are the best practices and SOPs for {core}?", category=core)
        return result.get("answer", "")
    
    def list_documents(self) -> List[Dict[str, str]]:
        """List all documents in the knowledge base"""
        if not self.index:
            return []
        
        docs = []
        for doc_id, doc in self.index.docstore.docs.items():
            docs.append({
                "id": doc_id,
                "title": doc.metadata.get("title", "Unknown"),
                "category": doc.metadata.get("category", "Unknown"),
                "type": doc.metadata.get("type", "Unknown")
            })
        return docs


# =============================================================================
# PERSONALIZATION ENGINE
# =============================================================================

class PersonalizationEngine:
    """
    Personalization engine using LlamaIndex for user profiling and recommendations.
    Part of Core #8 - Personalization Engine.
    """
    
    def __init__(self):
        self.knowledge_base = AffiliateKnowledgeBase()
        self.user_profiles = {}
    
    async def personalize(self, request: str, user_id: str = "default") -> Dict[str, Any]:
        """Generate personalized recommendations based on user profile and request"""
        
        # Get user profile
        profile = self.user_profiles.get(user_id, {
            "preferences": {},
            "history": [],
            "interests": []
        })
        
        # Query knowledge base for relevant context
        context = self.knowledge_base.query(request)
        
        # Generate personalized response
        response = {
            "user_id": user_id,
            "request": request,
            "personalized_response": context.get("answer", ""),
            "recommendations": self._generate_recommendations(profile, request),
            "sources": context.get("sources", [])
        }
        
        # Update user history
        profile["history"].append(request)
        self.user_profiles[user_id] = profile
        
        return response
    
    def _generate_recommendations(self, profile: Dict, request: str) -> List[str]:
        """Generate recommendations based on user profile"""
        # This would be enhanced with actual ML-based recommendations
        return [
            "Based on your history, consider exploring high-ticket offers",
            "Your engagement suggests interest in finance niche products",
            "Recommended: Review the Campaign Management SOP for optimization tips"
        ]
    
    def update_profile(self, user_id: str, preferences: Dict[str, Any]) -> bool:
        """Update user preferences"""
        if user_id not in self.user_profiles:
            self.user_profiles[user_id] = {
                "preferences": {},
                "history": [],
                "interests": []
            }
        
        self.user_profiles[user_id]["preferences"].update(preferences)
        return True


# =============================================================================
# FACTORY FUNCTIONS
# =============================================================================

def create_knowledge_base(storage_dir: str = None) -> AffiliateKnowledgeBase:
    """Factory function to create the knowledge base"""
    return AffiliateKnowledgeBase(storage_dir)


def create_personalization_engine() -> PersonalizationEngine:
    """Factory function to create the personalization engine"""
    return PersonalizationEngine()


# =============================================================================
# CLI FOR TESTING
# =============================================================================

if __name__ == "__main__":
    kb = create_knowledge_base()
    
    # Test query
    result = kb.query("What are the criteria for selecting affiliate offers?")
    print("Query Result:")
    print(result["answer"])
    print("\nSources:")
    for source in result["sources"]:
        print(f"  - {source['title']} ({source['category']})")
