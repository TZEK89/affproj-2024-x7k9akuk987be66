#!/usr/bin/env python3
"""
Content Generation Runner
Executable script for Manus to run the Content Generation CrewAI agents

Usage:
    python content_generation_runner.py --product "Wealth Builder Pro" --price 297 --niche "finance"
    python content_generation_runner.py --product "..." --types "ad,email,social,video"
"""

import argparse
import json
import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from openai import OpenAI


def run_content_generation(product: str, price: float = None, niche: str = None, 
                           content_types: list = None, output_format: str = "text"):
    """
    Run the Content Generation analysis using OpenAI GPT-4o
    """
    
    client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    
    # Default content types
    if not content_types:
        content_types = ["ad", "email", "social", "video"]
    
    system_prompt = """You are a world-class direct response copywriter and content strategist.
You've written copy that has generated over $100M in sales for affiliate marketers.

Your expertise includes:
1. Ad Copy - Facebook, Google, Native ads with proven frameworks (AIDA, PAS, BAB)
2. Email Sequences - 5-email nurture sequences that convert
3. Social Media - Platform-specific content for Twitter, LinkedIn, Instagram, TikTok
4. Video Scripts - VSL scripts with hooks, stories, and CTAs

You understand the psychology of persuasion and create content that converts cold traffic into buyers."""

    content_requests = []
    if "ad" in content_types:
        content_requests.append("Create 3 Facebook/Instagram ad variations and 2 Google ad variations")
    if "email" in content_types:
        content_requests.append("Create a 5-email nurture sequence (Welcome, Value, Story, Solution, Urgency)")
    if "social" in content_types:
        content_requests.append("Create social posts for Twitter (3), LinkedIn (2), Instagram (2)")
    if "video" in content_types:
        content_requests.append("Create a 2-minute video script with hook, problem, solution, benefits, CTA")

    user_prompt = f"""Create marketing content for:
Product: {product}
{f'Price: ${price}' if price else ''}
{f'Niche: {niche}' if niche else ''}

Content Requested:
{chr(10).join(f'- {req}' for req in content_requests)}

For each piece of content, include:
- The actual copy/script
- Platform specifications
- Character counts where relevant
- Best practices notes"""

    print(f"\n✍️ CONTENT GENERATION")
    print(f"{'='*50}")
    print(f"Product: {product}")
    print(f"Price: ${price or 'Not specified'}")
    print(f"Niche: {niche or 'General'}")
    print(f"Content Types: {', '.join(content_types)}")
    print(f"LLM: OpenAI GPT-4o")
    print(f"Agents: Copywriter → Email Specialist → Social Media Expert → Video Scripter")
    print(f"{'='*50}\n")
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.8,
            max_tokens=3000
        )
        
        result = response.choices[0].message.content
        
        output = {
            "status": "success",
            "core": "content_generation",
            "product": product,
            "price": price,
            "niche": niche,
            "content_types": content_types,
            "llm_used": "gpt-4o",
            "agents_executed": ["Copywriter", "Email Specialist", "Social Media Expert", "Video Scripter"],
            "timestamp": datetime.now().isoformat(),
            "result": result,
            "tokens_used": response.usage.total_tokens
        }
        
        if output_format == "json":
            print(json.dumps(output, indent=2))
        else:
            print(f"📝 GENERATED CONTENT\n")
            print(result)
            print(f"\n{'='*50}")
            print(f"✅ Content generation complete | Tokens used: {response.usage.total_tokens}")
        
        return output
        
    except Exception as e:
        error_output = {
            "status": "error",
            "core": "content_generation",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
        
        if output_format == "json":
            print(json.dumps(error_output, indent=2))
        else:
            print(f"❌ Error: {e}")
        
        return error_output


def main():
    parser = argparse.ArgumentParser(description="Run Content Generation")
    parser.add_argument("--product", required=True, help="Product name to create content for")
    parser.add_argument("--price", type=float, help="Product price")
    parser.add_argument("--niche", help="Product niche")
    parser.add_argument("--types", help="Content types (comma-separated: ad,email,social,video)")
    parser.add_argument("--output", choices=["text", "json"], default="text", help="Output format")
    
    args = parser.parse_args()
    
    content_types = args.types.split(",") if args.types else None
    
    run_content_generation(
        product=args.product,
        price=args.price,
        niche=args.niche,
        content_types=content_types,
        output_format=args.output
    )


if __name__ == "__main__":
    main()
