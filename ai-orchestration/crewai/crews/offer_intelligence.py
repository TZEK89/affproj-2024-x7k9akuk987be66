"""
CrewAI Offer Intelligence Crew
Core #1 - Discovers, analyzes, and scores affiliate offers
"""

from crewai import Agent, Crew, Task, Process
from crewai.project import CrewBase, agent, crew, task
from crewai_tools import SerperDevTool, ScrapeWebsiteTool
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from shared.config import Config, CoreType


# =============================================================================
# OUTPUT SCHEMAS
# =============================================================================

class ProductScore(BaseModel):
    """Schema for product scoring output"""
    product_name: str
    platform: str
    niche: str
    price: float
    commission_rate: float
    gravity_score: float
    ai_score: int
    recommendation: str
    reasoning: str


class OfferIntelligenceOutput(BaseModel):
    """Schema for the complete offer intelligence output"""
    total_products_analyzed: int
    top_products: List[ProductScore]
    market_insights: str
    recommended_action: str


# =============================================================================
# CREW DEFINITION
# =============================================================================

@CrewBase
class OfferIntelligenceCrew:
    """
    Offer Intelligence Crew - Discovers and scores affiliate products
    
    This crew consists of three specialized agents:
    1. Market Researcher - Finds products across affiliate networks
    2. Competitor Analyst - Analyzes competition and market positioning
    3. Scoring Agent - Calculates AI scores and rankings
    """
    
    agents_config = 'config/agents.yaml'
    tasks_config = 'config/tasks.yaml'
    
    def __init__(self):
        self.search_tool = SerperDevTool()
        self.scrape_tool = ScrapeWebsiteTool()
    
    # =========================================================================
    # AGENTS
    # =========================================================================
    
    @agent
    def market_researcher(self) -> Agent:
        """Agent that discovers affiliate products across networks"""
        return Agent(
            role="Senior Market Researcher",
            goal="Discover high-potential affiliate products across multiple networks including Hotmart, ClickBank, Impact, and JVZoo",
            backstory="""You are an expert affiliate market researcher with 10+ years of experience. 
            You have deep knowledge of affiliate networks and know exactly what makes a product successful.
            You specialize in finding hidden gems - products with high commission rates, strong conversion 
            potential, and growing demand. You're particularly skilled at identifying trends before they peak.""",
            tools=[self.search_tool, self.scrape_tool],
            verbose=Config.CREWAI_VERBOSE,
            allow_delegation=True
        )
    
    @agent
    def competitor_analyst(self) -> Agent:
        """Agent that analyzes competition and market positioning"""
        return Agent(
            role="Competitive Intelligence Analyst",
            goal="Analyze competitor strategies, market saturation, and identify unique positioning opportunities",
            backstory="""You are a strategic analyst who specializes in competitive intelligence for affiliate marketing.
            You can quickly assess market saturation, identify gaps in competitor offerings, and find angles 
            that others miss. Your analysis has helped affiliates avoid oversaturated markets and find 
            profitable niches that others overlook.""",
            tools=[self.search_tool],
            verbose=Config.CREWAI_VERBOSE,
            allow_delegation=False
        )
    
    @agent
    def scoring_agent(self) -> Agent:
        """Agent that calculates AI scores and rankings"""
        return Agent(
            role="AI Scoring Specialist",
            goal="Calculate comprehensive AI scores for affiliate products based on multiple factors",
            backstory="""You are a data-driven scoring specialist who has developed proprietary algorithms 
            for ranking affiliate products. Your scoring system considers commission rates, conversion potential,
            market demand, competition level, and trend trajectory. Your scores have a 85% accuracy rate 
            in predicting product success for affiliates.""",
            verbose=Config.CREWAI_VERBOSE,
            allow_delegation=False
        )
    
    # =========================================================================
    # TASKS
    # =========================================================================
    
    @task
    def research_products_task(self) -> Task:
        """Task to research and discover affiliate products"""
        return Task(
            description="""Research and discover affiliate products based on the following criteria:
            
            Input: {input}
            
            Your task:
            1. Search for products in the specified niche across major affiliate networks
            2. Identify at least 20 potential products
            3. Gather key data: name, price, commission rate, platform, category
            4. Note any trending products or emerging opportunities
            
            Focus on products with:
            - Commission rates above 30%
            - Positive reviews or ratings
            - Active promotional materials available
            - Growing search interest""",
            expected_output="""A comprehensive list of 20+ affiliate products with:
            - Product name and platform
            - Price and commission rate
            - Category/niche
            - Initial assessment of potential""",
            agent=self.market_researcher()
        )
    
    @task
    def analyze_competition_task(self) -> Task:
        """Task to analyze competition for discovered products"""
        return Task(
            description="""Analyze the competitive landscape for the products discovered:
            
            1. Assess market saturation for each product category
            2. Identify top affiliates promoting similar products
            3. Analyze their strategies and positioning
            4. Find gaps and opportunities for differentiation
            5. Rate competition level (Low/Medium/High) for each product""",
            expected_output="""Competition analysis report including:
            - Market saturation assessment per product
            - Competitor strategy summary
            - Opportunity gaps identified
            - Competition rating for each product""",
            agent=self.competitor_analyst(),
            context=[self.research_products_task()]
        )
    
    @task
    def score_products_task(self) -> Task:
        """Task to calculate AI scores for all products"""
        return Task(
            description="""Calculate comprehensive AI scores for all analyzed products:
            
            Scoring Factors (weighted):
            - Commission Rate (25%): Higher is better
            - Price Point (15%): Sweet spot $47-$297
            - Competition Level (20%): Lower is better
            - Market Demand (20%): Higher is better
            - Trend Trajectory (10%): Growing is better
            - Platform Reliability (10%): Established platforms score higher
            
            For each product:
            1. Calculate individual factor scores (0-100)
            2. Apply weights to get final AI Score (0-100)
            3. Provide recommendation: Strong Buy / Buy / Hold / Avoid
            4. Write brief reasoning for the score""",
            expected_output="""Final scored product list with:
            - Product name and platform
            - AI Score (0-100)
            - Recommendation (Strong Buy/Buy/Hold/Avoid)
            - Brief reasoning
            - Top 10 products highlighted""",
            agent=self.scoring_agent(),
            context=[self.research_products_task(), self.analyze_competition_task()],
            output_pydantic=OfferIntelligenceOutput
        )
    
    # =========================================================================
    # CREW
    # =========================================================================
    
    @crew
    def crew(self) -> Crew:
        """Creates the Offer Intelligence crew"""
        return Crew(
            agents=[
                self.market_researcher(),
                self.competitor_analyst(),
                self.scoring_agent()
            ],
            tasks=[
                self.research_products_task(),
                self.analyze_competition_task(),
                self.score_products_task()
            ],
            process=Process.sequential,
            verbose=Config.CREWAI_VERBOSE
        )
    
    # =========================================================================
    # EXECUTION
    # =========================================================================
    
    async def execute(self, request: str) -> Dict[str, Any]:
        """Execute the crew with the given request"""
        result = self.crew().kickoff(inputs={"input": request})
        return {
            "core": CoreType.OFFER_INTELLIGENCE.value,
            "status": "completed",
            "result": result.model_dump() if hasattr(result, 'model_dump') else str(result)
        }
    
    def execute_sync(self, request: str) -> Dict[str, Any]:
        """Synchronous execution wrapper"""
        import asyncio
        return asyncio.run(self.execute(request))


# =============================================================================
# CLI FOR TESTING
# =============================================================================

if __name__ == "__main__":
    crew = OfferIntelligenceCrew()
    result = crew.execute_sync("Find top 10 finance affiliate products with high commissions")
    print(result)
