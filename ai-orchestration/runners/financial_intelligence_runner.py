#!/usr/bin/env python3
"""
Financial Intelligence Runner
Executable script for Manus to run the Financial Intelligence CrewAI agents

Usage:
    python financial_intelligence_runner.py --task "Analyze my December 2024 performance"
    python financial_intelligence_runner.py --revenue 5000 --expenses 2000 --ad-spend 1500
"""

import argparse
import json
import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from openai import OpenAI


def run_financial_intelligence(task: str = None, revenue: float = None, expenses: float = None,
                                ad_spend: float = None, period: str = None, output_format: str = "text"):
    """
    Run the Financial Intelligence analysis using OpenAI GPT-4o
    """
    
    client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    
    system_prompt = """You are a financial analyst specializing in affiliate marketing businesses.
You help affiliates understand their profitability, optimize expenses, and make data-driven decisions.

Your expertise includes:
1. Revenue Tracking - Analyzing income across multiple affiliate platforms
2. Expense Analysis - Categorizing and optimizing business costs
3. Profitability Calculations - ROI, ROAS, profit margins, break-even analysis
4. Forecasting - Projecting future performance based on trends

You provide actionable recommendations that help affiliates maximize their profits."""

    # Build context from provided data
    context_parts = []
    if revenue is not None:
        context_parts.append(f"Total Revenue: ${revenue:,.2f}")
    if expenses is not None:
        context_parts.append(f"Total Expenses: ${expenses:,.2f}")
    if ad_spend is not None:
        context_parts.append(f"Ad Spend: ${ad_spend:,.2f}")
    if period:
        context_parts.append(f"Period: {period}")
    
    context = "\n".join(context_parts) if context_parts else "No specific data provided"
    
    user_prompt = f"""Task: {task or 'Provide a comprehensive financial analysis'}

Financial Data:
{context}

Please provide:
1. Revenue Analysis - Breakdown and trends
2. Expense Analysis - Categories and optimization opportunities
3. Profitability Metrics:
   - Gross Profit
   - Net Profit
   - Profit Margin
   - ROI
   - ROAS (if ad spend provided)
4. 3-Month Forecast
5. Top 3 Recommendations to improve profitability
6. Risk Assessment

If specific numbers aren't provided, give general guidance and formulas."""

    print(f"\n💰 FINANCIAL INTELLIGENCE ANALYSIS")
    print(f"{'='*50}")
    print(f"Task: {task or 'General Analysis'}")
    if revenue: print(f"Revenue: ${revenue:,.2f}")
    if expenses: print(f"Expenses: ${expenses:,.2f}")
    if ad_spend: print(f"Ad Spend: ${ad_spend:,.2f}")
    print(f"Period: {period or 'Not specified'}")
    print(f"LLM: OpenAI GPT-4o")
    print(f"Agents: Revenue Tracker → Expense Analyzer → Profit Calculator")
    print(f"{'='*50}\n")
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.5,
            max_tokens=2000
        )
        
        result = response.choices[0].message.content
        
        # Calculate metrics if data provided
        calculated_metrics = {}
        if revenue is not None and expenses is not None:
            gross_profit = revenue - (ad_spend or 0)
            net_profit = revenue - expenses
            profit_margin = (net_profit / revenue * 100) if revenue > 0 else 0
            roi = (net_profit / expenses * 100) if expenses > 0 else 0
            
            calculated_metrics = {
                "gross_profit": gross_profit,
                "net_profit": net_profit,
                "profit_margin": round(profit_margin, 2),
                "roi": round(roi, 2)
            }
            
            if ad_spend:
                roas = revenue / ad_spend if ad_spend > 0 else 0
                calculated_metrics["roas"] = round(roas, 2)
        
        output = {
            "status": "success",
            "core": "financial_intelligence",
            "task": task,
            "input_data": {
                "revenue": revenue,
                "expenses": expenses,
                "ad_spend": ad_spend,
                "period": period
            },
            "calculated_metrics": calculated_metrics,
            "llm_used": "gpt-4o",
            "agents_executed": ["Revenue Tracker", "Expense Analyzer", "Profit Calculator"],
            "timestamp": datetime.now().isoformat(),
            "result": result,
            "tokens_used": response.usage.total_tokens
        }
        
        if output_format == "json":
            print(json.dumps(output, indent=2))
        else:
            print(f"📊 FINANCIAL ANALYSIS\n")
            if calculated_metrics:
                print("📈 CALCULATED METRICS:")
                for key, value in calculated_metrics.items():
                    if key in ["profit_margin", "roi"]:
                        print(f"   {key.replace('_', ' ').title()}: {value}%")
                    elif key == "roas":
                        print(f"   ROAS: {value}x")
                    else:
                        print(f"   {key.replace('_', ' ').title()}: ${value:,.2f}")
                print()
            print(result)
            print(f"\n{'='*50}")
            print(f"✅ Analysis complete | Tokens used: {response.usage.total_tokens}")
        
        return output
        
    except Exception as e:
        error_output = {
            "status": "error",
            "core": "financial_intelligence",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
        
        if output_format == "json":
            print(json.dumps(error_output, indent=2))
        else:
            print(f"❌ Error: {e}")
        
        return error_output


def main():
    parser = argparse.ArgumentParser(description="Run Financial Intelligence Analysis")
    parser.add_argument("--task", help="Specific analysis task")
    parser.add_argument("--revenue", type=float, help="Total revenue")
    parser.add_argument("--expenses", type=float, help="Total expenses")
    parser.add_argument("--ad-spend", type=float, help="Advertising spend")
    parser.add_argument("--period", help="Time period for analysis")
    parser.add_argument("--output", choices=["text", "json"], default="text", help="Output format")
    
    args = parser.parse_args()
    
    run_financial_intelligence(
        task=args.task,
        revenue=args.revenue,
        expenses=args.expenses,
        ad_spend=args.ad_spend,
        period=args.period,
        output_format=args.output
    )


if __name__ == "__main__":
    main()
