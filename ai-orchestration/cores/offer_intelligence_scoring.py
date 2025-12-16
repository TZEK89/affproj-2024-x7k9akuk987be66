"""
Core #1: Offer Intelligence - Product Scoring Algorithm
Provides AI-powered product analysis, risk assessment, and profitability prediction
"""

import os
from typing import Dict, List, Optional
from openai import OpenAI

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

class ProductScoringEngine:
    """
    Comprehensive product scoring system that analyzes multiple factors
    to determine which products are worth promoting
    """
    
    # Scoring weights (total = 100)
    WEIGHTS = {
        'market_demand': 20,        # How much people want this product
        'competition_level': 15,     # How saturated the market is
        'conversion_potential': 25,  # Likelihood of sales
        'commission_value': 15,      # How much money you make
        'vendor_reputation': 10,     # Trustworthiness of seller
        'refund_risk': 10,          # Likelihood of refunds/chargebacks
        'traffic_cost': 5           # How expensive ads will be
    }
    
    def __init__(self):
        self.client = client
    
    def score_product(self, product: Dict) -> Dict:
        """
        Main scoring function that analyzes a product and returns comprehensive scores
        
        Args:
            product: Product data from database
            
        Returns:
            Dict with scores, risk assessment, and recommendations
        """
        # Extract product details
        name = product.get('name', '')
        description = product.get('description', '')
        price = float(product.get('price', 0))
        commission_rate = float(product.get('commission_rate', 0))
        category = product.get('category', '')
        niche = product.get('niche', '')
        platform = product.get('platform', '')
        rating = float(product.get('rating', 0))
        reviews = int(product.get('reviews', 0))
        
        # Calculate individual scores
        market_demand_score = self._analyze_market_demand(name, category, niche, rating, reviews)
        competition_score = self._analyze_competition(category, niche, price)
        conversion_score = self._analyze_conversion_potential(name, description, price, rating, reviews)
        commission_score = self._analyze_commission_value(price, commission_rate)
        vendor_score = self._analyze_vendor_reputation(platform, rating, reviews)
        refund_score = self._analyze_refund_risk(category, price, rating)
        traffic_cost_score = self._analyze_traffic_cost(category, niche, price)
        
        # Calculate weighted total score (0-100)
        total_score = (
            market_demand_score * self.WEIGHTS['market_demand'] / 100 +
            competition_score * self.WEIGHTS['competition_level'] / 100 +
            conversion_score * self.WEIGHTS['conversion_potential'] / 100 +
            commission_score * self.WEIGHTS['commission_value'] / 100 +
            vendor_score * self.WEIGHTS['vendor_reputation'] / 100 +
            refund_score * self.WEIGHTS['refund_risk'] / 100 +
            traffic_cost_score * self.WEIGHTS['traffic_cost'] / 100
        )
        
        # Risk assessment
        risk_level, risk_factors = self._assess_risk(
            market_demand_score, competition_score, conversion_score,
            commission_score, vendor_score, refund_score, traffic_cost_score
        )
        
        # Profitability prediction
        profitability = self._predict_profitability(
            price, commission_rate, traffic_cost_score, conversion_score
        )
        
        # AI-powered deep analysis
        ai_analysis = self._ai_deep_analysis(product, {
            'market_demand': market_demand_score,
            'competition': competition_score,
            'conversion': conversion_score,
            'commission': commission_score,
            'vendor': vendor_score,
            'refund': refund_score,
            'traffic_cost': traffic_cost_score
        })
        
        # Generate recommendation
        recommendation = self._generate_recommendation(
            total_score, risk_level, profitability, ai_analysis
        )
        
        return {
            'total_score': round(total_score, 1),
            'grade': self._get_grade(total_score),
            'scores': {
                'market_demand': round(market_demand_score, 1),
                'competition': round(competition_score, 1),
                'conversion_potential': round(conversion_score, 1),
                'commission_value': round(commission_score, 1),
                'vendor_reputation': round(vendor_score, 1),
                'refund_risk': round(refund_score, 1),
                'traffic_cost': round(traffic_cost_score, 1)
            },
            'risk_assessment': {
                'level': risk_level,
                'factors': risk_factors
            },
            'profitability': profitability,
            'ai_analysis': ai_analysis,
            'recommendation': recommendation
        }
    
    def _analyze_market_demand(self, name: str, category: str, niche: str, rating: float, reviews: int) -> float:
        """Analyze market demand based on product popularity and niche trends"""
        score = 50  # Base score
        
        # High reviews = high demand
        if reviews > 500: score += 30
        elif reviews > 100: score += 20
        elif reviews > 20: score += 10
        elif reviews < 5: score -= 20
        
        # High rating = good product-market fit
        if rating >= 4.5: score += 15
        elif rating >= 4.0: score += 10
        elif rating >= 3.5: score += 5
        elif rating < 3.0: score -= 20
        
        # Hot niches (based on market trends)
        hot_niches = ['finance', 'investing', 'weight loss', 'digital marketing', 'ai', 'crypto']
        if any(hot in niche.lower() for hot in hot_niches):
            score += 10
        
        return min(100, max(0, score))
    
    def _analyze_competition(self, category: str, niche: str, price: float) -> float:
        """Analyze competition level (higher score = less competition = better)"""
        score = 60  # Base score
        
        # Price positioning
        if price > 200: score += 20  # High-ticket = less competition
        elif price > 100: score += 10
        elif price < 20: score -= 15  # Low-ticket = high competition
        
        # Saturated niches
        saturated = ['weight loss', 'make money online', 'dating']
        if any(sat in niche.lower() for sat in saturated):
            score -= 20
        
        # Emerging niches
        emerging = ['ai', 'web3', 'nft', 'metaverse', 'automation']
        if any(em in niche.lower() for em in emerging):
            score += 15
        
        return min(100, max(0, score))
    
    def _analyze_conversion_potential(self, name: str, description: str, price: float, rating: float, reviews: int) -> float:
        """Analyze likelihood of converting traffic to sales"""
        score = 50  # Base score
        
        # Social proof
        if reviews > 100 and rating >= 4.5: score += 25
        elif reviews > 50 and rating >= 4.0: score += 15
        elif reviews < 10: score -= 15
        
        # Price sweet spot
        if 47 <= price <= 197: score += 20  # Optimal price range
        elif price < 20: score -= 10  # Too cheap = perceived low value
        elif price > 500: score -= 15  # Too expensive = harder to convert cold traffic
        
        # Description quality (length as proxy)
        if description and len(description) > 200: score += 10
        elif not description: score -= 10
        
        return min(100, max(0, score))
    
    def _analyze_commission_value(self, price: float, commission_rate: float) -> float:
        """Analyze commission value (higher = better)"""
        commission_amount = price * (commission_rate / 100)
        
        score = 0
        if commission_amount >= 100: score = 100
        elif commission_amount >= 50: score = 85
        elif commission_amount >= 30: score = 70
        elif commission_amount >= 20: score = 55
        elif commission_amount >= 10: score = 40
        else: score = 25
        
        # Bonus for high commission rate
        if commission_rate >= 50: score = min(100, score + 10)
        
        return score
    
    def _analyze_vendor_reputation(self, platform: str, rating: float, reviews: int) -> float:
        """Analyze vendor trustworthiness"""
        score = 50  # Base score
        
        # Platform trust
        trusted_platforms = ['clickbank', 'impact', 'cj', 'amazon']
        if any(plat in platform.lower() for plat in trusted_platforms):
            score += 20
        
        # Rating and reviews
        if rating >= 4.5 and reviews > 100: score += 30
        elif rating >= 4.0 and reviews > 50: score += 20
        elif rating < 3.5: score -= 30
        
        return min(100, max(0, score))
    
    def _analyze_refund_risk(self, category: str, price: float, rating: float) -> float:
        """Analyze refund/chargeback risk (higher score = lower risk = better)"""
        score = 70  # Base score (assume low risk)
        
        # High-risk categories
        high_risk = ['make money', 'get rich', 'lose weight fast', 'miracle']
        if any(risk in category.lower() for risk in high_risk):
            score -= 30
        
        # High rating = satisfied customers = low refunds
        if rating >= 4.5: score += 20
        elif rating < 3.5: score -= 25
        
        # Price factor (higher price = higher refund risk)
        if price > 300: score -= 15
        elif price < 50: score += 10
        
        return min(100, max(0, score))
    
    def _analyze_traffic_cost(self, category: str, niche: str, price: float) -> float:
        """Analyze estimated traffic cost (higher score = lower cost = better)"""
        score = 60  # Base score
        
        # Expensive niches (high CPC)
        expensive = ['finance', 'insurance', 'legal', 'business', 'investing']
        if any(exp in niche.lower() for exp in expensive):
            score -= 25
        
        # Cheap niches (low CPC)
        cheap = ['hobbies', 'crafts', 'gaming', 'entertainment']
        if any(ch in niche.lower() for ch in cheap):
            score += 20
        
        # High-ticket products can afford higher CPC
        if price > 200: score += 15
        
        return min(100, max(0, score))
    
    def _assess_risk(self, market_demand: float, competition: float, conversion: float,
                     commission: float, vendor: float, refund: float, traffic_cost: float) -> tuple:
        """Assess overall risk level"""
        risk_factors = []
        
        # Check for red flags
        if market_demand < 40:
            risk_factors.append("Low market demand - product may not sell well")
        if competition < 30:
            risk_factors.append("High competition - difficult to stand out")
        if conversion < 40:
            risk_factors.append("Low conversion potential - may waste ad spend")
        if vendor < 50:
            risk_factors.append("Questionable vendor reputation - refund risk")
        if refund < 50:
            risk_factors.append("High refund risk - unstable income")
        if traffic_cost < 40:
            risk_factors.append("High traffic cost - low profit margins")
        
        # Determine risk level
        if len(risk_factors) >= 3:
            risk_level = "HIGH"
        elif len(risk_factors) >= 1:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
        
        if not risk_factors:
            risk_factors.append("No significant risks detected")
        
        return risk_level, risk_factors
    
    def _predict_profitability(self, price: float, commission_rate: float,
                               traffic_cost_score: float, conversion_score: float) -> Dict:
        """Predict profitability metrics"""
        commission_amount = price * (commission_rate / 100)
        
        # Estimate CPC based on traffic cost score (inverse relationship)
        estimated_cpc = 1.5 - (traffic_cost_score / 100)  # $0.50 - $1.50
        
        # Estimate conversion rate based on conversion score
        estimated_conversion_rate = (conversion_score / 100) * 0.05  # 0% - 5%
        
        # Calculate cost per sale
        if estimated_conversion_rate > 0:
            clicks_per_sale = 1 / estimated_conversion_rate
            cost_per_sale = clicks_per_sale * estimated_cpc
        else:
            cost_per_sale = 999  # Unrealistic high cost
        
        # Calculate profit per sale
        profit_per_sale = commission_amount - cost_per_sale
        
        # Calculate ROI
        if cost_per_sale > 0:
            roi = (profit_per_sale / cost_per_sale) * 100
        else:
            roi = 0
        
        # Determine profitability level
        if roi >= 200:
            profitability_level = "EXCELLENT"
        elif roi >= 100:
            profitability_level = "GOOD"
        elif roi >= 50:
            profitability_level = "MODERATE"
        elif roi >= 0:
            profitability_level = "LOW"
        else:
            profitability_level = "UNPROFITABLE"
        
        return {
            'commission_per_sale': round(commission_amount, 2),
            'estimated_cpc': round(estimated_cpc, 2),
            'estimated_conversion_rate': round(estimated_conversion_rate * 100, 2),
            'estimated_cost_per_sale': round(cost_per_sale, 2),
            'estimated_profit_per_sale': round(profit_per_sale, 2),
            'estimated_roi': round(roi, 1),
            'profitability_level': profitability_level
        }
    
    def _ai_deep_analysis(self, product: Dict, scores: Dict) -> str:
        """Use AI to provide deep analysis and insights"""
        prompt = f"""Analyze this affiliate product and provide strategic insights:

Product: {product.get('name', 'Unknown')}
Category: {product.get('category', 'Unknown')} / {product.get('niche', 'Unknown')}
Price: ${product.get('price', 0)}
Commission: {product.get('commission_rate', 0)}%
Rating: {product.get('rating', 0)}/5 ({product.get('reviews', 0)} reviews)

Scores:
- Market Demand: {scores['market_demand']}/100
- Competition: {scores['competition']}/100
- Conversion Potential: {scores['conversion']}/100
- Commission Value: {scores['commission']}/100
- Vendor Reputation: {scores['vendor']}/100
- Refund Risk: {scores['refund']}/100
- Traffic Cost: {scores['traffic_cost']}/100

Provide a 2-3 sentence analysis covering:
1. Why this product would or wouldn't be profitable
2. The biggest opportunity or risk
3. A specific strategy recommendation

Be direct and actionable."""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=200,
                temperature=0.7
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            return f"AI analysis unavailable: {str(e)}"
    
    def _generate_recommendation(self, total_score: float, risk_level: str,
                                  profitability: Dict, ai_analysis: str) -> Dict:
        """Generate final recommendation"""
        # Determine action
        if total_score >= 75 and risk_level == "LOW":
            action = "PROMOTE"
            confidence = "HIGH"
            reason = "Excellent scores across all metrics with low risk"
        elif total_score >= 60 and risk_level in ["LOW", "MEDIUM"]:
            action = "PROMOTE"
            confidence = "MEDIUM"
            reason = "Good overall scores, manageable risk"
        elif total_score >= 50:
            action = "TEST"
            confidence = "LOW"
            reason = "Moderate scores, test with small budget first"
        else:
            action = "SKIP"
            confidence = "N/A"
            reason = "Scores too low or risk too high"
        
        return {
            'action': action,
            'confidence': confidence,
            'reason': reason,
            'priority': self._get_priority(total_score, profitability['estimated_roi'])
        }
    
    def _get_priority(self, score: float, roi: float) -> int:
        """Calculate priority (1-10, higher = better)"""
        priority = (score / 10) + (min(roi, 500) / 100)
        return min(10, max(1, round(priority)))
    
    def _get_grade(self, score: float) -> str:
        """Convert score to letter grade"""
        if score >= 90: return "A+"
        elif score >= 85: return "A"
        elif score >= 80: return "A-"
        elif score >= 75: return "B+"
        elif score >= 70: return "B"
        elif score >= 65: return "B-"
        elif score >= 60: return "C+"
        elif score >= 55: return "C"
        elif score >= 50: return "C-"
        elif score >= 45: return "D+"
        elif score >= 40: return "D"
        else: return "F"


# Standalone function for easy import
def score_product(product: Dict) -> Dict:
    """Score a single product"""
    engine = ProductScoringEngine()
    return engine.score_product(product)


def score_products_batch(products: List[Dict]) -> List[Dict]:
    """Score multiple products and return sorted by total score"""
    engine = ProductScoringEngine()
    scored_products = []
    
    for product in products:
        try:
            score_result = engine.score_product(product)
            scored_products.append({
                **product,
                'scoring': score_result
            })
        except Exception as e:
            print(f"Error scoring product {product.get('name', 'Unknown')}: {e}")
    
    # Sort by total score (highest first)
    scored_products.sort(key=lambda x: x['scoring']['total_score'], reverse=True)
    
    return scored_products
