/**
 * Test Agent Executor
 * Simple test to verify browser automation and agent execution
 */

const AgentExecutor = require('./services/agents/AgentExecutor');

async function testAgentExecutor() {
  console.log('🧪 Testing Agent Executor...\n');

  const executor = new AgentExecutor();

  // Mock mission object
  const mockMission = {
    id: 999,
    user_id: 1,
    mission_type: 'research',
    platform: 'hotmart',
    prompt: 'Find top 5 products in the weight loss niche',
    parameters: JSON.stringify({
      maxProducts: 5,
      language: 'pt',
      getDetails: false
    }),
    status: 'pending'
  };

  // Mock credentials (replace with real credentials for actual test)
  const mockCredentials = {
    email: process.env.HOTMART_TEST_EMAIL || 'test@example.com',
    password: process.env.HOTMART_TEST_PASSWORD || 'password123'
  };

  try {
    console.log('📋 Mock Mission:');
    console.log(JSON.stringify(mockMission, null, 2));
    console.log('\n🔑 Using credentials:', mockCredentials.email);
    console.log('\n⚠️  NOTE: This is a DRY RUN. Database operations will fail without real DB connection.\n');

    // Execute mission
    const results = await executor.executeMission(mockMission, mockCredentials);

    console.log('\n✅ Test Results:');
    console.log(JSON.stringify(results, null, 2));

  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    console.error(error.stack);
  }
}

// Run test if executed directly
if (require.main === module) {
  testAgentExecutor()
    .then(() => {
      console.log('\n✅ Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = testAgentExecutor;
