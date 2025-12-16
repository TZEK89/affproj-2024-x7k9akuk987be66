"""
Core #1: Offer Intelligence Runner
Analyzes all products in the database and provides top recommendations
"""

import sys
import os
import json

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from cores.offer_intelligence_scoring import score_products_batch

def get_products_from_supabase():
    """Fetch all products from Supabase"""
    # For now, return mock data. In production, this would query Supabase.
    # You can integrate with Supabase MCP or use the Supabase Python client
    
    # Mock products (in production, replace with actual Supabase query)
    products = [
        {
            'id': 1,
            'name': 'Personal Finance Mastery Course',
            'description': 'Complete guide to managing personal finances, budgeting, and wealth building',
            'price': 197,
            'commission_rate': 50,
            'category': 'Finance',
            'niche': 'Personal Finance',
            'platform': 'ClickBank',
            'rating': 4.8,
            'reviews': 342
        },
        {
            'id': 2,
            'name': 'Crypto Investment Starter Kit',
            'description': 'Learn cryptocurrency investing from scratch with proven strategies',
            'price': 147,
            'commission_rate': 45,
            'category': 'Finance',
            'niche': 'Investing',
            'platform': 'Hotmart',
            'rating': 4.5,
            'reviews': 128
        },
        {
            'id': 3,
            'name': 'Weight Loss Blueprint',
            'description': 'Science-based weight loss program with meal plans and workout routines',
            'price': 67,
            'commission_rate': 40,
            'category': 'Health',
            'niche': 'Weight Loss',
            'platform': 'ClickBank',
            'rating': 4.2,
            'reviews': 892
        },
        {
            'id': 4,
            'name': 'AI Automation Mastery',
            'description': 'Master AI tools and automation to 10x your productivity',
            'price': 297,
            'commission_rate': 50,
            'category': 'Technology',
            'niche': 'AI',
            'platform': 'Impact',
            'rating': 4.9,
            'reviews': 67
        },
        {
            'id': 5,
            'name': 'Get Rich Quick System',
            'description': 'Make $10,000 in 30 days with this secret method',
            'price': 997,
            'commission_rate': 75,
            'category': 'Business',
            'niche': 'Make Money Online',
            'platform': 'Unknown',
            'rating': 2.8,
            'reviews': 12
        }
    ]
    
    return products

def main():
    print("=" * 80)
    print("CORE #1: OFFER INTELLIGENCE - PRODUCT ANALYSIS")
    print("=" * 80)
    print()
    
    # Fetch products
    print("📦 Fetching products from database...")
    products = get_products_from_supabase()
    print(f"✅ Found {len(products)} products")
    print()
    
    # Score all products
    print("🤖 Analyzing products with AI scoring engine...")
    scored_products = score_products_batch(products)
    print("✅ Analysis complete")
    print()
    
    # Display results
    print("=" * 80)
    print("TOP RECOMMENDATIONS")
    print("=" * 80)
    print()
    
    for i, product in enumerate(scored_products[:10], 1):  # Top 10
        scoring = product['scoring']
        
        print(f"#{i}. {product['name']}")
        print(f"   Platform: {product['platform']} | Price: ${product['price']} | Commission: {product['commission_rate']}%")
        print(f"   Score: {scoring['total_score']}/100 ({scoring['grade']}) | Risk: {scoring['risk_assessment']['level']}")
        print(f"   Recommendation: {scoring['recommendation']['action']} (Priority: {scoring['recommendation']['priority']}/10)")
        print(f"   Profitability: {scoring['profitability']['profitability_level']} (Est. ROI: {scoring['profitability']['estimated_roi']}%)")
        print(f"   💡 {scoring['ai_analysis']}")
        print()
    
    # Save results
    output_file = '/home/ubuntu/offer_intelligence_results.json'
    with open(output_file, 'w') as f:
        json.dump(scored_products, f, indent=2)
    print(f"📄 Full results saved to: {output_file}")
    print()
    
    # Summary statistics
    promote_count = sum(1 for p in scored_products if p['scoring']['recommendation']['action'] == 'PROMOTE')
    test_count = sum(1 for p in scored_products if p['scoring']['recommendation']['action'] == 'TEST')
    skip_count = sum(1 for p in scored_products if p['scoring']['recommendation']['action'] == 'SKIP')
    
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"✅ PROMOTE: {promote_count} products")
    print(f"⚠️  TEST: {test_count} products")
    print(f"❌ SKIP: {skip_count} products")
    print()
    
    # Top recommendation
    if scored_products:
        top = scored_products[0]
        print("🏆 TOP RECOMMENDATION:")
        print(f"   {top['name']}")
        print(f"   Score: {top['scoring']['total_score']}/100")
        print(f"   Estimated Profit per Sale: ${top['scoring']['profitability']['estimated_profit_per_sale']}")
        print(f"   Estimated ROI: {top['scoring']['profitability']['estimated_roi']}%")
        print()
        print(f"   ⚡ NEXT STEP: Create ad campaign for this product")
    
    print("=" * 80)

if __name__ == "__main__":
    main()
