/**
 * Mission Processor Worker
 * 
 * This worker processes agent research missions from the queue.
 * It orchestrates the entire mission lifecycle:
 * 1. Receives mission from queue
 * 2. Updates mission status to 'running'
 * 3. Dispatches to appropriate agent executor
 * 4. Monitors progress and handles updates
 * 5. Collects and stores results
 * 6. Triggers notifications on completion
 * 
 * The worker is designed to be fault-tolerant and can be scaled horizontally.
 */

const { Worker } = require('bullmq');
const { QUEUE_NAMES, addResultJob, addNotificationJob, getConnection } = require('./queues');
const AgentDispatcher = require('./agentDispatcher');
const db = require('../db');

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
 * 
 * @param {number} missionId - The mission ID
 * @param {string} status - New status
 * @param {Object} additionalFields - Optional fields to update
 */
const updateMissionStatus = async (missionId, status, additionalFields = {}) => {
  const fields = ['status = $2', 'updated_at = CURRENT_TIMESTAMP'];
  const values = [missionId, status];
  let paramIndex = 3;
  
  // Add optional fields
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
 * 
 * @param {number} missionId - The mission ID
 * @param {string} agentName - Which agent generated this log
 * @param {string} action - What action was performed
 * @param {string} details - Additional details
 * @param {string} level - Log level (info, warning, error)
 */
const addMissionLog = async (missionId, agentName, action, details, level = 'info') => {
  await db.query(`
    INSERT INTO agent_logs (mission_id, agent_name, action, details, level, created_at)
    VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
  `, [missionId, agentName, action, details, level]);
};

/**
 * Store discovered products from a mission
 * 
 * @param {number} missionId - The mission ID
 * @param {Array} products - Array of discovered product objects
 */
const storeDiscoveredProducts = async (missionId, products) => {
  if (!products || products.length === 0) {
    return 0;
  }
  
  let insertedCount = 0;
  
  for (const product of products) {
    try {
      // Check if product already exists for this mission
      const existing = await db.query(`
        SELECT id FROM discovered_products 
        WHERE mission_id = $1 AND external_id = $2
      `, [missionId, product.externalId || product.id]);
      
      if (existing.rows.length > 0) {
        // Update existing
        await db.query(`
          UPDATE discovered_products SET
            ai_score = COALESCE($3, ai_score),
            ai_analysis = COALESCE($4, ai_analysis),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $5
        `, [
          product.aiScore,
          JSON.stringify(product.aiAnalysis || {}),
          existing.rows[0].id
        ]);
      } else {
        // Insert new
        await db.query(`
          INSERT INTO discovered_products (
            mission_id, external_id, platform, name, description,
            price, currency, commission_rate, commission_type,
            category, niche, product_url, image_url,
            ai_score, ai_analysis, status, metadata,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9,
            $10, $11, $12, $13,
            $14, $15, 'discovered', $16,
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
        `, [
          missionId,
          product.externalId || product.id,
          product.platform,
          product.name,
          product.description,
          product.price,
          product.currency || 'BRL',
          product.commissionRate,
          product.commissionType || 'percentage',
          product.category,
          product.niche,
          product.productUrl,
          product.imageUrl,
          product.aiScore,
          JSON.stringify(product.aiAnalysis || {}),
          JSON.stringify(product.metadata || {})
        ]);
        insertedCount++;
      }
    } catch (error) {
      console.error(`Failed to store product ${product.name}:`, error.message);
    }
  }
  
  return insertedCount;
};

/**
 * The main mission processing function
 * This is called by the worker for each job
 * 
 * @param {Object} job - The BullMQ job object
 * @returns {Promise<Object>} The mission results
 */
const processMission = async (job) => {
  const { missionId, platform, prompt, agents, parameters } = job.data;
  
  console.log(`\n🚀 Starting mission ${missionId}`);
  console.log(`   Platform: ${platform}`);
  console.log(`   Prompt: ${prompt.substring(0, 100)}...`);
  console.log(`   Agents: ${agents.join(', ')}`);
  
  // Check if mission was cancelled
  if (job.data.cancelled) {
    await updateMissionStatus(missionId, MISSION_STATUS.CANCELLED);
    return { cancelled: true };
  }
  
  try {
    // Update status to running
    await updateMissionStatus(missionId, MISSION_STATUS.RUNNING, {
      startedAt: new Date().toISOString()
    });
    
    // Log mission start
    await addMissionLog(missionId, 'orchestrator', 'mission_started', 
      `Mission started with agents: ${agents.join(', ')}`);
    
    // Update progress
    await job.updateProgress(10);
    
    // Initialize the agent dispatcher
    const dispatcher = new AgentDispatcher({
      missionId,
      platform,
      prompt,
      agents,
      parameters,
      // Progress callback for the worker
      onProgress: async (progress, message) => {
        await job.updateProgress(progress);
        await addMissionLog(missionId, 'orchestrator', 'progress', message);
      },
      // Log callback
      onLog: async (agentName, action, details, level) => {
        await addMissionLog(missionId, agentName, action, details, level);
      }
    });
    
    // Execute the mission
    // This is where the actual agent work happens
    const results = await dispatcher.execute();
    
    // Check again for cancellation
    const refreshedJob = await job.queue.getJob(job.id);
    if (refreshedJob?.data?.cancelled) {
      await updateMissionStatus(missionId, MISSION_STATUS.CANCELLED);
      return { cancelled: true };
    }
    
    await job.updateProgress(80);
    
    // Store discovered products
    const productsStored = await storeDiscoveredProducts(missionId, results.products);
    
    await addMissionLog(missionId, 'orchestrator', 'products_stored',
      `Stored ${productsStored} new products from ${results.products?.length || 0} discovered`);
    
    await job.updateProgress(90);
    
    // Update mission as completed
    await updateMissionStatus(missionId, MISSION_STATUS.COMPLETED, {
      completedAt: new Date().toISOString(),
      results: {
        productsFound: results.products?.length || 0,
        productsStored,
        agentResults: results.agentResults,
        summary: results.summary
      }
    });
    
    // Log completion
    await addMissionLog(missionId, 'orchestrator', 'mission_completed',
      `Mission completed. Found ${results.products?.length || 0} products.`);
    
    await job.updateProgress(95);
    
    // Queue notification
    await addNotificationJob({
      type: 'mission_completed',
      missionId,
      userId: parameters?.userId,
      data: {
        productsFound: results.products?.length || 0,
        topProduct: results.products?.[0]?.name,
        platform
      }
    });
    
    await job.updateProgress(100);
    
    console.log(`✅ Mission ${missionId} completed successfully`);
    
    return {
      success: true,
      missionId,
      productsFound: results.products?.length || 0,
      productsStored,
      summary: results.summary
    };
    
  } catch (error) {
    console.error(`❌ Mission ${missionId} failed:`, error);
    
    // Log the error
    await addMissionLog(missionId, 'orchestrator', 'mission_failed',
      error.message, 'error');
    
    // Update status to failed
    await updateMissionStatus(missionId, MISSION_STATUS.FAILED, {
      errorMessage: error.message
    });
    
    // Queue failure notification
    await addNotificationJob({
      type: 'mission_failed',
      missionId,
      userId: parameters?.userId,
      data: {
        error: error.message,
        platform
      }
    });
    
    // Rethrow to trigger retry if applicable
    throw error;
  }
};

/**
 * Create and start the mission worker
 * 
 * @returns {Worker} The BullMQ worker instance
 */
const createMissionWorker = () => {
  const connection = getConnection();
  
  if (!connection) {
    console.warn('Cannot create worker - Redis not configured');
    return null;
  }
  
  const worker = new Worker(
    QUEUE_NAMES.MISSIONS,
    processMission,
    {
      connection,
      // Process one job at a time per worker instance
      // Scale by running multiple worker instances
      concurrency: 1,
      // Lock duration - how long before job is considered stalled
      lockDuration: 300000, // 5 minutes (browser automation can be slow)
      // How often to check for stalled jobs
      stalledInterval: 60000
    }
  );
  
  // Event handlers for monitoring
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
    console.warn(`⚠️ Job ${jobId} stalled`);
  });
  
  worker.on('error', (error) => {
    console.error('Worker error:', error);
  });
  
  console.log('🤖 Mission worker started');
  
  return worker;
};

/**
 * Create the results processor worker
 * Handles post-processing of mission results
 * 
 * @returns {Worker} The BullMQ worker instance
 */
const createResultsWorker = () => {
  const connection = getConnection();
  
  if (!connection) {
    return null;
  }
  
  const worker = new Worker(
    QUEUE_NAMES.RESULTS,
    async (job) => {
      const { missionId, products, agentResults } = job.data;
      
      console.log(`📊 Processing results for mission ${missionId}`);
      
      // Additional processing could happen here:
      // - AI scoring of products
      // - Deduplication across missions
      // - Enrichment with additional data
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
 * Handles sending alerts to users
 * 
 * @returns {Worker} The BullMQ worker instance
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
      // - Push notification
      // - In-app notification (database insert)
      // - Webhook to external system
      
      // For now, just log and store in database
      if (userId) {
        // Create in-app notification
        // This would require a notifications table
        console.log(`📧 Would notify user ${userId}: ${type}`);
      }
      
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
  createMissionWorker,
  createResultsWorker,
  createNotificationsWorker,
  updateMissionStatus,
  addMissionLog,
  storeDiscoveredProducts
};
