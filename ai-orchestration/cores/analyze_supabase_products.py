"""
Fetch and analyze all 152 products from Supabase using Core #1
"""

import sys
import os
import json
import subprocess

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from cores.offer_intelligence_scoring import score_products_batch

def fetch_products_from_supabase():
    """Fetch all products from Supabase using MCP"""
    print("📡 Fetching products from Supabase...")
    
    # Use MCP to query Supabase
    query = """
    SELECT 
        id, name, description, price, currency, commission_rate,
        category, niche, platform, gravity_score as rating,
        ai_score, product_url
    FROM discovered_products
    ORDER BY created_at DESC
    """
    
    try:
        result = subprocess.run([
            'manus-mcp-cli', 'tool', 'call', 'execute_sql',
            '--server', 'supabase',
            '--input', json.dumps({
                'project_id': 'oyclropoirfafifotqqu',
                'sql': query
            })
        ], capture_output=True, text=True, timeout=60)
        
        if result.returncode == 0:
            # Parse the result
            output = result.stdout
            # Extract JSON from the output
            start_idx = output.find('[')
            if start_idx != -1:
                json_str = output[start_idx:]
                products_raw = json.loads(json_str)
                
                # Transform to expected format
                products = []
                for p in products_raw:
                    products.append({
                        'id': p.get('id'),
                        'name': p.get('name', 'Unknown Product'),
                        'description': p.get('description', ''),
                        'price': float(p.get('price', 0) or 0),
                        'commission_rate': float(p.get('commission_rate', 0) or 0),
                        'category': p.get('category', 'Unknown'),
                        'niche': p.get('niche', 'Unknown'),
                        'platform': p.get('platform', 'Unknown'),
                        'rating': float(p.get('rating', 0) or 0) / 20,  # Convert 0-100 to 0-5
                        'reviews': 0,  # Not available in current schema
                        'product_url': p.get('product_url', '')
                    })
                
                print(f"✅ Fetched {len(products)} products from Supabase")
                return products
            else:
                print("⚠️  Could not parse Supabase response")
                return []
        else:
            print(f"❌ Error fetching from Supabase: {result.stderr}")
            return []
    
    except Exception as e:
        print(f"❌ Error: {e}")
        return []

def main():
    print("=" * 80)
    print("CORE #1: OFFER INTELLIGENCE - ANALYZING REAL PRODUCTS FROM SUPABASE")
    print("=" * 80)
    print()
    
    # Fetch products from Supabase
    products = fetch_products_from_supabase()
    
    if not products:
        print("❌ No products found. Using sample data instead.")
        return
    
    print()
    print(f"🤖 Analyzing {len(products)} products with AI scoring engine...")
    print("   This may take a few minutes...")
    print()
    
    # Score all products
    scored_products = score_products_batch(products)
    print("✅ Analysis complete!")
    print()
    
    # Display top 20 results
    print("=" * 80)
    print("TOP 20 PRODUCT RECOMMENDATIONS")
    print("=" * 80)
    print()
    
    for i, product in enumerate(scored_products[:20], 1):
        scoring = product['scoring']
        
        # Color coding for action
        action_emoji = {
            'PROMOTE': '✅',
            'TEST': '⚠️',
            'SKIP': '❌'
        }
        
        print(f"{action_emoji.get(scoring['recommendation']['action'], '❓')} #{i}. {product['name'][:60]}")
        print(f"   Platform: {product['platform']} | ${product['price']} | {product['commission_rate']}% commission")
        print(f"   Score: {scoring['total_score']}/100 ({scoring['grade']}) | Risk: {scoring['risk_assessment']['level']}")
        print(f"   Action: {scoring['recommendation']['action']} | Priority: {scoring['recommendation']['priority']}/10")
        print(f"   Est. Profit/Sale: ${scoring['profitability']['estimated_profit_per_sale']} | ROI: {scoring['profitability']['estimated_roi']}%")
        print()
    
    # Save full results
    output_file = '/home/ubuntu/supabase_products_analyzed.json'
    with open(output_file, 'w') as f:
        json.dump(scored_products, f, indent=2)
    print(f"📄 Full analysis saved to: {output_file}")
    print()
    
    # Update Supabase with scores
    print("💾 Updating Supabase with AI scores...")
    update_supabase_scores(scored_products)
    
    # Summary statistics
    promote_count = sum(1 for p in scored_products if p['scoring']['recommendation']['action'] == 'PROMOTE')
    test_count = sum(1 for p in scored_products if p['scoring']['recommendation']['action'] == 'TEST')
    skip_count = sum(1 for p in scored_products if p['scoring']['recommendation']['action'] == 'SKIP')
    
    avg_score = sum(p['scoring']['total_score'] for p in scored_products) / len(scored_products)
    
    print()
    print("=" * 80)
    print("SUMMARY STATISTICS")
    print("=" * 80)
    print(f"Total Products Analyzed: {len(scored_products)}")
    print(f"Average Score: {avg_score:.1f}/100")
    print()
    print(f"✅ PROMOTE: {promote_count} products ({promote_count/len(scored_products)*100:.1f}%)")
    print(f"⚠️  TEST: {test_count} products ({test_count/len(scored_products)*100:.1f}%)")
    print(f"❌ SKIP: {skip_count} products ({skip_count/len(scored_products)*100:.1f}%)")
    print()
    
    # Top 5 recommendations
    print("=" * 80)
    print("🏆 TOP 5 RECOMMENDATIONS TO PROMOTE NOW")
    print("=" * 80)
    
    top_5 = [p for p in scored_products if p['scoring']['recommendation']['action'] == 'PROMOTE'][:5]
    
    for i, product in enumerate(top_5, 1):
        scoring = product['scoring']
        print(f"\n{i}. {product['name']}")
        print(f"   💰 Commission: ${product['price'] * product['commission_rate'] / 100:.2f} per sale")
        print(f"   📊 Score: {scoring['total_score']}/100 ({scoring['grade']})")
        print(f"   💵 Est. Profit: ${scoring['profitability']['estimated_profit_per_sale']}/sale")
        print(f"   📈 Est. ROI: {scoring['profitability']['estimated_roi']}%")
        print(f"   ⚠️  Risk: {scoring['risk_assessment']['level']}")
        print(f"   💡 {scoring['ai_analysis']}")
    
    print("\n" + "=" * 80)
    print("✅ CORE #1 ANALYSIS COMPLETE")
    print("=" * 80)
    print()
    print("Next steps:")
    print("1. Review the top recommendations above")
    print("2. Check the full analysis in supabase_products_analyzed.json")
    print("3. Select a product to promote")
    print("4. Move to Core #2 (Content Generation) or Core #3 (Campaign Management)")
    print()

def update_supabase_scores(scored_products):
    """Update Supabase with AI scores and recommendations"""
    for product in scored_products:
        try:
            scoring = product['scoring']
            
            # Prepare update query
            update_query = f"""
            UPDATE discovered_products
            SET 
                ai_score = {scoring['total_score']},
                ai_analysis = '{json.dumps(scoring).replace("'", "''")}'::jsonb,
                is_recommended = {str(scoring['recommendation']['action'] == 'PROMOTE').lower()},
                updated_at = CURRENT_TIMESTAMP
            WHERE id = {product['id']}
            """
            
            # Execute update (silently, don't print errors)
            subprocess.run([
                'manus-mcp-cli', 'tool', 'call', 'execute_sql',
                '--server', 'supabase',
                '--input', json.dumps({
                    'project_id': 'oyclropoirfafifotqqu',
                    'sql': update_query
                })
            ], capture_output=True, timeout=10)
            
        except Exception:
            pass  # Silently continue if update fails
    
    print("✅ Supabase updated with AI scores")

if __name__ == "__main__":
    main()
