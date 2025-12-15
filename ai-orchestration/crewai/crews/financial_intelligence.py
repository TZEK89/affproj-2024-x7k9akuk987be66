"""
CrewAI Financial Intelligence Crew
Core #6 - Tracks revenue, expenses, and profitability
"""

from crewai import Agent, Crew, Task, Process
from crewai.project import CrewBase, agent, crew, task
from typing import List, Dict, Any
from pydantic import BaseModel
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from shared.config import Config, CoreType


# =============================================================================
# OUTPUT SCHEMAS
# =============================================================================

class RevenueReport(BaseModel):
    """Schema for revenue tracking"""
    total_revenue: float
    revenue_by_platform: Dict[str, float]
    revenue_by_product: Dict[str, float]
    growth_rate: float
    top_performers: List[str]


class ExpenseReport(BaseModel):
    """Schema for expense tracking"""
    total_expenses: float
    expenses_by_category: Dict[str, float]
    ad_spend: float
    tools_and_software: float
    other_costs: float


class ProfitabilityAnalysis(BaseModel):
    """Schema for profitability analysis"""
    gross_profit: float
    net_profit: float
    profit_margin: float
    roi: float
    break_even_point: float


class FinancialIntelligenceOutput(BaseModel):
    """Complete financial intelligence output"""
    revenue: RevenueReport
    expenses: ExpenseReport
    profitability: ProfitabilityAnalysis
    recommendations: List[str]
    forecast: Dict[str, float]


# =============================================================================
# CREW DEFINITION
# =============================================================================

@CrewBase
class FinancialIntelligenceCrew:
    """
    Financial Intelligence Crew - Tracks and analyzes financial performance
    
    This crew consists of three specialized agents:
    1. Revenue Tracker - Monitors income across all platforms
    2. Expense Analyzer - Categorizes and tracks all costs
    3. Profit Calculator - Calculates profitability and ROI
    """
    
    def __init__(self):
        pass
    
    # =========================================================================
    # AGENTS
    # =========================================================================
    
    @agent
    def revenue_tracker(self) -> Agent:
        """Agent that tracks revenue across platforms"""
        return Agent(
            role="Revenue Tracking Specialist",
            goal="Accurately track and report all affiliate revenue across multiple platforms and products",
            backstory="""You are a meticulous financial analyst specializing in affiliate marketing revenue.
            You have experience tracking earnings from Hotmart, ClickBank, Impact, Amazon Associates, and 
            dozens of other networks. You know how to reconcile payments, track pending commissions, and 
            identify revenue trends. Your reports are always accurate to the penny.""",
            verbose=Config.CREWAI_VERBOSE,
            allow_delegation=True
        )
    
    @agent
    def expense_analyzer(self) -> Agent:
        """Agent that analyzes and categorizes expenses"""
        return Agent(
            role="Expense Analysis Expert",
            goal="Categorize, track, and optimize all business expenses for maximum efficiency",
            backstory="""You are a cost optimization specialist who has helped affiliates reduce their 
            expenses by 30% while maintaining performance. You understand the difference between 
            necessary investments and wasteful spending. You categorize expenses properly for tax 
            purposes and identify opportunities to cut costs without hurting results.""",
            verbose=Config.CREWAI_VERBOSE,
            allow_delegation=False
        )
    
    @agent
    def profit_calculator(self) -> Agent:
        """Agent that calculates profitability and ROI"""
        return Agent(
            role="Profitability Analyst",
            goal="Calculate true profitability, ROI, and provide actionable financial recommendations",
            backstory="""You are a financial strategist who sees the big picture. You don't just 
            calculate numbers - you interpret them. You understand that a 100% ROI campaign might 
            be worse than a 50% ROI campaign at scale. You factor in opportunity costs, lifetime 
            value, and growth potential. Your recommendations have helped affiliates 10x their profits.""",
            verbose=Config.CREWAI_VERBOSE,
            allow_delegation=False
        )
    
    # =========================================================================
    # TASKS
    # =========================================================================
    
    @task
    def track_revenue_task(self) -> Task:
        """Task to track and report revenue"""
        return Task(
            description="""Analyze and report on revenue based on:
            
            Input: {input}
            
            Track revenue from:
            1. All affiliate platforms (Hotmart, ClickBank, Impact, etc.)
            2. Individual products/offers
            3. Traffic sources
            
            Calculate:
            - Total revenue for the period
            - Revenue breakdown by platform
            - Revenue breakdown by product
            - Month-over-month growth rate
            - Top 5 performing products""",
            expected_output="""Revenue report including:
            - Total revenue
            - Platform breakdown
            - Product breakdown
            - Growth metrics
            - Top performers""",
            agent=self.revenue_tracker()
        )
    
    @task
    def analyze_expenses_task(self) -> Task:
        """Task to analyze and categorize expenses"""
        return Task(
            description="""Analyze all business expenses:
            
            Categories to track:
            1. Advertising spend (Facebook, Google, Native, etc.)
            2. Tools and software (email, landing pages, tracking)
            3. Content creation costs
            4. Outsourcing and VA costs
            5. Other operational expenses
            
            For each category:
            - Calculate total spend
            - Compare to previous period
            - Identify any unusual expenses
            - Flag potential waste""",
            expected_output="""Expense report including:
            - Total expenses
            - Category breakdown
            - Period comparison
            - Waste identification
            - Optimization opportunities""",
            agent=self.expense_analyzer(),
            context=[self.track_revenue_task()]
        )
    
    @task
    def calculate_profitability_task(self) -> Task:
        """Task to calculate profitability and provide recommendations"""
        return Task(
            description="""Calculate comprehensive profitability metrics:
            
            Metrics to calculate:
            1. Gross Profit = Revenue - Direct Costs (ad spend)
            2. Net Profit = Gross Profit - All Expenses
            3. Profit Margin = Net Profit / Revenue
            4. ROI = Net Profit / Total Investment
            5. ROAS = Revenue / Ad Spend
            6. Break-even point
            
            Provide:
            - 3-month profit forecast
            - Top 3 recommendations to improve profitability
            - Risk assessment
            - Scaling recommendations""",
            expected_output="""Profitability analysis including:
            - All calculated metrics
            - 3-month forecast
            - Actionable recommendations
            - Risk assessment""",
            agent=self.profit_calculator(),
            context=[self.track_revenue_task(), self.analyze_expenses_task()],
            output_pydantic=FinancialIntelligenceOutput
        )
    
    # =========================================================================
    # CREW
    # =========================================================================
    
    @crew
    def crew(self) -> Crew:
        """Creates the Financial Intelligence crew"""
        return Crew(
            agents=[
                self.revenue_tracker(),
                self.expense_analyzer(),
                self.profit_calculator()
            ],
            tasks=[
                self.track_revenue_task(),
                self.analyze_expenses_task(),
                self.calculate_profitability_task()
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
            "core": CoreType.FINANCIAL_INTELLIGENCE.value,
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
    crew = FinancialIntelligenceCrew()
    result = crew.execute_sync("Analyze my financial performance for December 2024")
    print(result)
