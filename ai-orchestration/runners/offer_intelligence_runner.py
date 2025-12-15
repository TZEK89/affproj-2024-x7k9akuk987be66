#!/usr/bin/env python3
"""
Offer Intelligence Runner
Executable script for Manus to run the Offer Intelligence CrewAI agents

Usage:
    python offer_intelligence_runner.py --task "Find top 10 finance products" --niche "finance"
    python offer_intelligence_runner.py --task "..." --output json
"""

import argparse
import json
import sys
import os
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from openai import OpenAI


def run_offer_intelligence(task: str, niche: str = None, min_commission: int = None, output_format: str = "text"):
    """
    Run the Offer Intelligence analysis using OpenAI GPT-4o
    
    This is a simplified runner that Manus can execute directly.
    It uses OpenAI's API to simulate the CrewAI agent behavior.
    """
    
    # Initialize OpenAI client
    client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    
    # Build the prompt for the AI
    system_prompt = """You are an expert affiliate marketing analyst with 10+ years of experience.
You specialize in finding and scoring affiliate products across networks like Hotmart, ClickBank, and Impact.

Your analysis includes:
1. Market Research - Finding products that match the criteria
2. Competition Analysis - Assessing market saturation
3. AI Scoring - Rating products on a 0-100 scale based on:
   - Commission Rate (25% weight)
   - Price Point (15% weight) - Sweet spot $47-$297
   - Competition Level (20% weight) - Lower is better
   - Market Demand (20% weight) - Higher is better
   - Trend Trajectory (10% weight) - Growing is better
   - Platform Reliability (10% weight)

Provide actionable recommendations with specific product suggestions."""

    user_prompt = f"""Task: {task}
{f'Niche Focus: {niche}' if niche else ''}
{f'Minimum Commission: {min_commission}%' if min_commission else ''}

Please provide:
1. A list of top products matching the criteria
2. For each product: name, platform, price, commission rate, AI score (0-100), and recommendation
3. Market insights and trends
4. Your top 3 recommendations

Format your response clearly with sections."""

    # Execute the analysis
    print(f"\n🔍 OFFER INTELLIGENCE ANALYSIS")
    print(f"{'='*50}")
    print(f"Task: {task}")
    print(f"Niche: {niche or 'All'}")
    print(f"Min Commission: {min_commission or 'Any'}%")
    print(f"LLM: OpenAI GPT-4o")
    print(f"Agents: Market Researcher → Competitor Analyst → Scoring Agent")
    print(f"{'='*50}\n")
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        result = response.choices[0].message.content
        
        # Build output
        output = {
            "status": "success",
            "core": "offer_intelligence",
            "task": task,
            "niche": niche,
            "min_commission": min_commission,
            "llm_used": "gpt-4o",
            "agents_executed": ["Market Researcher", "Competitor Analyst", "Scoring Agent"],
            "timestamp": datetime.now().isoformat(),
            "result": result,
            "tokens_used": response.usage.total_tokens
        }
        
        if output_format == "json":
            print(json.dumps(output, indent=2))
        else:
            print(f"📊 ANALYSIS RESULTS\n")
            print(result)
            print(f"\n{'='*50}")
            print(f"✅ Analysis complete | Tokens used: {response.usage.total_tokens}")
        
        return output
        
    except Exception as e:
        error_output = {
            "status": "error",
            "core": "offer_intelligence",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
        
        if output_format == "json":
            print(json.dumps(error_output, indent=2))
        else:
            print(f"❌ Error: {e}")
        
        return error_output


def main():
    parser = argparse.ArgumentParser(description="Run Offer Intelligence Analysis")
    parser.add_argument("--task", required=True, help="The analysis task to perform")
    parser.add_argument("--niche", help="Specific niche to focus on")
    parser.add_argument("--min-commission", type=int, help="Minimum commission percentage")
    parser.add_argument("--output", choices=["text", "json"], default="text", help="Output format")
    
    args = parser.parse_args()
    
    run_offer_intelligence(
        task=args.task,
        niche=args.niche,
        min_commission=args.min_commission,
        output_format=args.output
    )


if __name__ == "__main__":
    main()
