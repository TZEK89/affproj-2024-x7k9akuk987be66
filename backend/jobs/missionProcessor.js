/**
 * Mission Processor Worker - INTEGRATED VERSION
 * 
 * This worker processes agent research missions from the BullMQ queue.
 * It integrates with Manus's AgentExecutor for browser automation.
 * 
 * Flow:
 * 1. Receives mission from queue
 * 2. Gets platform credentials
 * 3. Calls AgentExecutor.executeMission()
 * 4. Handles results and notifications
 * 
 * The AgentExecutor handles:
 * - Browser automation (Playwright)
 * - Platform login
 * - Product research
 * - AI analysis
 * - Database updates
 */

const { Worker } = require('bullmq');
const { QUEUE_NAMES, addNotificationJob, getConnection } = require('./queues');
const db = require('../db');

// Import Manus's AgentExecutor for browser automation
let AgentExecutor = null;
try {
  AgentExecutor = require('../services/agents/AgentExecutor');
  console.log('✅ AgentExecutor loaded');
} catch (error) {
  console.warn('⚠️ AgentExecutor not available:', error.message);
}

// Mission status constants (match database enum)
const MISSION_STATUS = {
  PENDING: 'pending',
  QUEUED: 'queued',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

/**
 * Update mission status in the database
 */
const updateMissionStatus = async (missionId, status, additionalFields = {}) => {
  const fields = ['status = $2', 'updated_at = CURRENT_TIMESTAMP'];
  const values = [missionId, status];
  let paramIndex = 3;
  
  if (additionalFields.startedAt) {
    fields.push(`started_at = $${paramIndex}`);
    values.push(additionalFields.startedAt);
    paramIndex++;
  }
  
  if (additionalFields.completedAt) {
    fields.push(`completed_at = $${paramIndex}`);
    values.push(additionalFields.completedAt);
    paramIndex++;
  }
  
  if (additionalFields.errorMessage) {
    fields.push(`error_message = $${paramIndex}`);
    values.push(additionalFields.errorMessage);
    paramIndex++;
  }
  
  if (additionalFields.results) {
    fields.push(`results = $${paramIndex}`);
    values.push(JSON.stringify(additionalFields.results));
    paramIndex++;
  }
  
  const query = `UPDATE agent_missions SET ${fields.join(', ')} WHERE id = $1`;
  await db.query(query, values);
  
  console.log(`📝 Mission ${missionId} status updated to: ${status}`);
};

/**
 * Add a log entry for the mission
 */
const addMissionLog = async (missionId, action, details, level = 'info') => {
  try {
    await db.query(`
      INSERT INTO agent_logs (mission_id, action, details, level, created_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
    `, [missionId, action, JSON.stringify(details), level]);
  } catch (error) {
    console.error('Failed to log action:', error.message);
  }
};

/**
 * Get platform credentials for a user
 * In production, these would come from encrypted storage
 */
const getCredentials = async (userId, platform) => {
  // Try to get credentials from integrations table
  try {
    const result = await db.query(`
      SELECT credentials FROM integrations 
      WHERE user_id = $1 AND platform = $2 AND status = 'active'
    `, [userId, platform]);
    
    if (result.rows.length > 0 && result.rows[0].credentials) {
      const creds = typeof result.rows[0].credentials === 'string' 
        ? JSON.parse(result.rows[0].credentials)
        : result.rows[0].credentials;
      return creds;
    }
  } catch (error) {
    console.warn(`Could not get credentials from database: ${error.message}`);
  }
  
  // Fallback to environment variables
  const platformUpper = platform.toUpperCase();
  return {
    email: process.env[`${platformUpper}_EMAIL`] || process.env[`${platformUpper}_USERNAME`],
    password: process.env[`${platformUpper}_PASSWORD`]
  };
};

/**
 * Get the mission object from database
 */
const getMission = async (missionId) => {
  const result = await db.query(`
    SELECT * FROM agent_missions WHERE id = $1
  `, [missionId]);
  
  if (result.rows.length === 0) {
    throw new Error(`Mission ${missionId} not found`);
  }
  
  return result.rows[0];
};

/**
 * The main mission processing function
 * This is called by the worker for each job
 */
const processMission = async (job) => {
  const { missionId, platform, prompt, agents, parameters } = job.data;
  
  console.log(`\n🚀 Processing mission ${missionId} from queue`);
  console.log(`   Platform: ${platform}`);
  console.log(`   Prompt: ${prompt.substring(0, 80)}...`);
  
  // Check if mission was cancelled before starting
  if (job.data.cancelled) {
    await updateMissionStatus(missionId, MISSION_STATUS.CANCELLED);
    await addMissionLog(missionId, 'job_cancelled', { reason: 'Cancelled before processing' });
    return { cancelled: true };
  }
  
  try {
    // Update progress: Starting
    await job.updateProgress(5);
    
    // Get the full mission object from database
    const mission = await getMission(missionId);
    
    // Check if AgentExecutor is available
    if (!AgentExecutor) {
      throw new Error('AgentExecutor not available - browser automation not configured');
    }
    
    // Get credentials for the platform
    const userId = parameters?.userId || mission.user_id;
    const credentials = await getCredentials(userId, platform);
    
    if (!credentials.email || !credentials.password) {
      throw new Error(`No credentials configured for ${platform}. Please add credentials in Settings > Integrations.`);
    }
    
    await job.updateProgress(10);
    await addMissionLog(missionId, 'credentials_loaded', { platform });
    
    // Create executor instance
    const executor = new AgentExecutor();
    
    // Log that we're starting browser automation
    await addMissionLog(missionId, 'starting_browser_automation', { 
      platform,
      headless: process.env.NODE_ENV === 'production'
    });
    
    await job.updateProgress(15);
    
    // Execute the mission using Manus's AgentExecutor
    // This handles: browser launch, login, research, AI analysis, saving products
    const result = await executor.executeMission(mission, credentials);
    
    // Update progress based on results
    await job.updateProgress(90);
    
    // Check if job was cancelled during execution
    const refreshedJob = await job.queue.getJob(job.id);
    if (refreshedJob?.data?.cancelled) {
      await updateMissionStatus(missionId, MISSION_STATUS.CANCELLED);
      return { cancelled: true };
    }
    
    await job.updateProgress(95);
    
    // Queue success notification
    await addNotificationJob({
      type: 'mission_completed',
      missionId,
      userId,
      data: {
        productsFound: result.productsFound || 0,
        duration: result.duration,
        platform,
        topProducts: result.products?.slice(0, 3).map(p => p.name)
      }
    });
    
    await job.updateProgress(100);
    
    console.log(`✅ Mission ${missionId} completed via queue`);
    
    return {
      success: true,
      missionId,
      productsFound: result.productsFound || 0,
      duration: result.duration,
      summary: `Found ${result.productsFound} products in ${result.duration}s`
    };
    
  } catch (error) {
    console.error(`❌ Mission ${missionId} failed in queue:`, error);
    
    // Log the error
    await addMissionLog(missionId, 'queue_job_failed', {
      error: error.message,
      stack: error.stack?.substring(0, 500)
    }, 'error');
    
    // Status is likely already updated by AgentExecutor, but ensure it's set
    await updateMissionStatus(missionId, MISSION_STATUS.FAILED, {
      errorMessage: error.message
    }).catch(() => {}); // Ignore if already updated
    
    // Queue failure notification
    const userId = parameters?.userId;
    if (userId) {
      await addNotificationJob({
        type: 'mission_failed',
        missionId,
        userId,
        data: {
          error: error.message,
          platform
        }
      });
    }
    
    // Rethrow to trigger retry if applicable
    throw error;
  }
};

/**
 * Fallback processor when AgentExecutor is not available
 * Uses mock data for development/testing
 */
const processMissionFallback = async (job) => {
  const { missionId, platform, prompt, parameters } = job.data;
  
  console.log(`\n⚠️ Processing mission ${missionId} in FALLBACK mode (no browser automation)`);
  
  try {
    await updateMissionStatus(missionId, MISSION_STATUS.RUNNING, {
      startedAt: new Date().toISOString()
    });
    
    await job.updateProgress(20);
    await addMissionLog(missionId, 'fallback_mode', { reason: 'AgentExecutor not available' });
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await job.updateProgress(50);
    
    // Generate mock products
    const mockProducts = [];
    const niche = prompt.match(/(?:about|in|for)\s+(\w+\s?\w*)/i)?.[1] || 'general';
    
    for (let i = 0; i < 5; i++) {
      mockProducts.push({
        name: `${niche} Product ${i + 1} (Mock)`,
        description: `Mock product for testing - ${prompt.substring(0, 50)}`,
        price: (Math.random() * 200 + 50).toFixed(2),
        platform,
        commission: (Math.random() * 50 + 10).toFixed(1),
        aiScore: Math.floor(Math.random() * 40 + 60)
      });
    }
    
    await job.updateProgress(70);
    
    // Save mock products
    for (const product of mockProducts) {
      await db.query(`
        INSERT INTO discovered_products (
          mission_id, platform, name, description, price, 
          commission_rate, ai_score, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'discovered', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        missionId, 
        platform, 
        product.name, 
        product.description, 
        product.price,
        product.commission,
        product.aiScore
      ]).catch(err => console.error('Mock product save error:', err.message));
    }
    
    await job.updateProgress(90);
    
    // Complete mission
    await updateMissionStatus(missionId, MISSION_STATUS.COMPLETED, {
      completedAt: new Date().toISOString(),
      results: {
        productsFound: mockProducts.length,
        mode: 'fallback',
        note: 'Used mock data - browser automation not available'
      }
    });
    
    await job.updateProgress(100);
    
    console.log(`✅ Mission ${missionId} completed (fallback mode)`);
    
    return {
      success: true,
      missionId,
      productsFound: mockProducts.length,
      mode: 'fallback'
    };
    
  } catch (error) {
    await updateMissionStatus(missionId, MISSION_STATUS.FAILED, {
      errorMessage: error.message
    });
    throw error;
  }
};

/**
 * Create and start the mission worker
 */
const createMissionWorker = () => {
  const connection = getConnection();
  
  if (!connection) {
    console.warn('Cannot create worker - Redis not configured');
    return null;
  }
  
  // Choose processor based on AgentExecutor availability
  const processor = AgentExecutor ? processMission : processMissionFallback;
  
  if (!AgentExecutor) {
    console.warn('⚠️ Mission worker running in FALLBACK mode (no browser automation)');
  }
  
  const worker = new Worker(
    QUEUE_NAMES.MISSIONS,
    processor,
    {
      connection,
      concurrency: 1, // Process one mission at a time (browser can't handle concurrent sessions)
      lockDuration: 600000, // 10 minutes (browser automation can be slow)
      stalledInterval: 120000 // Check for stalled jobs every 2 minutes
    }
  );
  
  // Event handlers
  worker.on('completed', (job, result) => {
    console.log(`✅ Job ${job.id} completed:`, result?.summary || 'Success');
  });
  
  worker.on('failed', (job, error) => {
    console.error(`❌ Job ${job?.id} failed:`, error.message);
  });
  
  worker.on('progress', (job, progress) => {
    console.log(`📊 Job ${job.id} progress: ${progress}%`);
  });
  
  worker.on('stalled', (jobId) => {
    console.warn(`⚠️ Job ${jobId} stalled - will be retried`);
  });
  
  worker.on('error', (error) => {
    console.error('Worker error:', error);
  });
  
  console.log(`🤖 Mission worker started (mode: ${AgentExecutor ? 'FULL' : 'FALLBACK'})`);
  
  return worker;
};

/**
 * Create the results processor worker
 */
const createResultsWorker = () => {
  const connection = getConnection();
  
  if (!connection) {
    return null;
  }
  
  const worker = new Worker(
    QUEUE_NAMES.RESULTS,
    async (job) => {
      const { missionId, products } = job.data;
      console.log(`📊 Processing results for mission ${missionId}`);
      
      // Additional processing could happen here:
      // - Cross-mission deduplication
      // - Trend analysis
      // - Generating insights
      
      return { processed: true, missionId };
    },
    { connection, concurrency: 2 }
  );
  
  console.log('📊 Results worker started');
  
  return worker;
};

/**
 * Create the notifications worker
 */
const createNotificationsWorker = () => {
  const connection = getConnection();
  
  if (!connection) {
    return null;
  }
  
  const worker = new Worker(
    QUEUE_NAMES.NOTIFICATIONS,
    async (job) => {
      const { type, missionId, userId, data } = job.data;
      
      console.log(`🔔 Sending notification: ${type} for mission ${missionId}`);
      
      // TODO: Implement actual notification sending
      // - Email via SendGrid
      // - In-app notification (store in notifications table)
      // - Webhook to external system
      
      // For now, create an in-app notification if we had a notifications table
      console.log(`📧 Notification would be sent to user ${userId}: ${type}`, data);
      
      return { sent: true, type };
    },
    { connection, concurrency: 5 }
  );
  
  console.log('🔔 Notifications worker started');
  
  return worker;
};

// Export all functions
module.exports = {
  MISSION_STATUS,
  processMission,
  processMissionFallback,
  createMissionWorker,
  createResultsWorker,
  createNotificationsWorker,
  updateMissionStatus,
  addMissionLog,
  getCredentials
};
