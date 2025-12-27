#!/usr/bin/env node

/**
 * Test Script for AI Product Scorer
 * 
 * Tests both V1 (rule-based) and V2 (AI-enhanced) scoring.
 * Run with: node tests/test-ai-scorer.js
 */

require('dotenv').config();

const aiProductScorer = require('../services/ai-product-scorer');

// Sample products for testing
const testProducts = [
  {
    name: 'Digital Marketing Mastery Course',
    price: 197,
    commission: 98.50,  // 50% commission
    temperature: 85,
    category: 'Marketing'
  },
  {
    name: 'Weight Loss Program',
    price: 47,
    commission: 23.50,  // 50% commission
    temperature: 120,
    category: 'Health & Fitness'
  },
  {
    name: 'Premium Trading Signals',
    price: 497,
    commission: 149.10, // 30% commission
    temperature: 45,
    category: 'Finance'
  },
  {
    name: 'Language Learning App',
    price: 97,
    commission: 48.50,  // 50% commission
    temperature: 95,
    category: 'Education'
  },
  {
    name: 'Productivity Software Suite',
    price: 297,
    commission: 89.10,  // 30% commission
    temperature: 60,
    category: 'Software'
  }
];

async function runTests() {
  console.log('='.repeat(60));
  console.log('AI Product Scorer Test Suite');
  console.log('='.repeat(60));
  console.log();

  // Test 1: V1 Scoring (Rule-based)
  console.log('TEST 1: V1 Scoring (Rule-based, Fast)');
  console.log('-'.repeat(40));
  
  for (const product of testProducts) {
    const result = aiProductScorer.scoreProductV1(product);
    console.log(`${product.name}`);
    console.log(`  Price: $${product.price}, Commission: $${product.commission}, Temp: ${product.temperature}`);
    console.log(`  V1 Score: ${result.score}`);
    console.log();
  }

  // Test 2: Component Scores
  console.log('TEST 2: Individual Component Scores');
  console.log('-'.repeat(40));
  
  for (const product of testProducts) {
    const baseScore = aiProductScorer.calculateBaseScore(product);
    const priceScore = aiProductScorer.calculatePriceOptimizationScore(product);
    const demandScore = aiProductScorer.calculateMarketDemandScore(product);
    const nicheScore = aiProductScorer.estimateNicheCompetitiveness(product);
    const sustainScore = aiProductScorer.estimateCommissionSustainability(product);
    
    console.log(`${product.name}`);
    console.log(`  Base Score: ${(baseScore * 100).toFixed(1)}%`);
    console.log(`  Price Optimization: ${(priceScore * 100).toFixed(1)}%`);
    console.log(`  Market Demand: ${(demandScore * 100).toFixed(1)}%`);
    console.log(`  Niche Competitiveness: ${(nicheScore * 100).toFixed(1)}%`);
    console.log(`  Commission Sustainability: ${(sustainScore * 100).toFixed(1)}%`);
    console.log();
  }

  // Test 3: V2 AI-Enhanced Scoring (if API key available)
  console.log('TEST 3: V2 AI-Enhanced Scoring');
  console.log('-'.repeat(40));
  
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
  console.log(`Anthropic API Key: ${hasApiKey ? 'Available' : 'Not set (will use fallback)'}`);
  console.log();

  if (hasApiKey) {
    console.log('Testing AI-enhanced scoring for first product...');
    try {
      const result = await aiProductScorer.scoreProductEnhanced(testProducts[0]);
      console.log(`${testProducts[0].name}`);
      console.log(`  Final Score: ${result.score}/100`);
      console.log(`  Grade: ${result.grade}`);
      console.log(`  Breakdown:`);
      Object.entries(result.breakdown).forEach(([key, value]) => {
        console.log(`    ${key}: ${value}`);
      });
      console.log();
    } catch (error) {
      console.log(`  Error: ${error.message}`);
      console.log();
    }
  }

  // Test 4: Batch Scoring
  console.log('TEST 4: Batch Scoring');
  console.log('-'.repeat(40));
  
  console.log(`Batch scoring ${testProducts.length} products...`);
  const batchResults = await aiProductScorer.batchScoreProducts(testProducts, {
    useAI: hasApiKey,
    parallel: false
  });

  console.log();
  console.log('Results (sorted by score):');
  console.log();
  
  batchResults.forEach((product, index) => {
    console.log(`${index + 1}. ${product.name}`);
    console.log(`   Score: ${product.ai_score}/100 | Grade: ${product.ai_grade || 'N/A'} | Version: ${product.score_version}`);
  });

  // Test 5: Statistics
  console.log();
  console.log('TEST 5: Scorer Statistics');
  console.log('-'.repeat(40));
  
  const stats = aiProductScorer.getStats();
  console.log(`Cache Size: ${stats.cacheSize}`);
  console.log(`Weights:`, stats.weights);
  console.log(`Temperature Thresholds:`, stats.temperatureThresholds);
  console.log(`Price Categories:`, stats.priceCategories);

  console.log();
  console.log('='.repeat(60));
  console.log('Tests Complete');
  console.log('='.repeat(60));
}

// Run tests
runTests().catch(console.error);
