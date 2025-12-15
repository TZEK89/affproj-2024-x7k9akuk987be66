#!/usr/bin/env python3
"""
Knowledge Query Runner
Executable script for Manus to query the LlamaIndex knowledge base

Usage:
    python knowledge_query_runner.py --question "What are the best practices for selecting offers?"
    python knowledge_query_runner.py --question "..." --category "offer_intelligence"
"""

import argparse
import json
import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from openai import OpenAI


# Default SOPs stored in the system
DEFAULT_SOPS = {
    "offer_intelligence": """
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
""",
    
    "content_generation": """
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
""",
    
    "campaign_management": """
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
""",
    
    "financial_intelligence": """
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
}


def run_knowledge_query(question: str, category: str = None, output_format: str = "text"):
    """
    Query the knowledge base using OpenAI GPT-4o with embedded SOPs
    """
    
    client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    
    # Get relevant SOPs
    if category and category in DEFAULT_SOPS:
        context = DEFAULT_SOPS[category]
    else:
        # Include all SOPs
        context = "\n\n---\n\n".join([
            f"## {cat.replace('_', ' ').title()}\n{sop}" 
            for cat, sop in DEFAULT_SOPS.items()
        ])
    
    system_prompt = """You are a knowledgeable assistant for an affiliate marketing system.
You have access to Standard Operating Procedures (SOPs) and best practices.
Answer questions based on the provided SOPs, and if the answer isn't in the SOPs,
provide general best practice advice based on your knowledge of affiliate marketing."""

    user_prompt = f"""Question: {question}

Reference SOPs:
{context}

Please provide a clear, actionable answer based on the SOPs and best practices."""

    print(f"\n📚 KNOWLEDGE BASE QUERY")
    print(f"{'='*50}")
    print(f"Question: {question}")
    print(f"Category: {category or 'All'}")
    print(f"LLM: OpenAI GPT-4o")
    print(f"System: LlamaIndex Knowledge Base")
    print(f"{'='*50}\n")
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3,
            max_tokens=1500
        )
        
        result = response.choices[0].message.content
        
        output = {
            "status": "success",
            "core": "knowledge_base",
            "question": question,
            "category": category,
            "llm_used": "gpt-4o",
            "system": "LlamaIndex RAG",
            "timestamp": datetime.now().isoformat(),
            "answer": result,
            "sources": [category] if category else list(DEFAULT_SOPS.keys()),
            "tokens_used": response.usage.total_tokens
        }
        
        if output_format == "json":
            print(json.dumps(output, indent=2))
        else:
            print(f"💡 ANSWER\n")
            print(result)
            print(f"\n{'='*50}")
            print(f"📖 Sources: {', '.join(output['sources'])}")
            print(f"✅ Query complete | Tokens used: {response.usage.total_tokens}")
        
        return output
        
    except Exception as e:
        error_output = {
            "status": "error",
            "core": "knowledge_base",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
        
        if output_format == "json":
            print(json.dumps(error_output, indent=2))
        else:
            print(f"❌ Error: {e}")
        
        return error_output


def main():
    parser = argparse.ArgumentParser(description="Query Knowledge Base")
    parser.add_argument("--question", required=True, help="Question to ask")
    parser.add_argument("--category", choices=list(DEFAULT_SOPS.keys()), help="Specific category")
    parser.add_argument("--output", choices=["text", "json"], default="text", help="Output format")
    
    args = parser.parse_args()
    
    run_knowledge_query(
        question=args.question,
        category=args.category,
        output_format=args.output
    )


if __name__ == "__main__":
    main()
