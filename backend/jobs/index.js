/**
 * Agent Job System - Main Entry Point
 * 
 * This module initializes and manages the entire agent job processing system.
 * It provides a clean interface for the rest of the application to interact
 * with the agent system without knowing the internal details.
 * 
 * Usage in server.js:
 *   const agentJobs = require('./jobs');
 *   await agentJobs.initialize();
 * 
 * Usage in routes:
 *   const { queueMission, getMissionStatus } = require('./jobs');
 *   const job = await queueMission(missionData);
 */

const queues = require('./queues');
const {
  createMissionWorker,
  createResultsWorker,
  createNotificationsWorker,
  MISSION_STATUS
} = require('./missionProcessor');
const { createScrapeWorker } = require('./scrapeProcessor');

// Store worker instances for graceful shutdown
let workers = {
  mission: null,
  results: null,
  notifications: null,
  scrape: null
};

// Initialization status
let isInitialized = false;

/**
 * Initialize the entire job system
 * Call this once during server startup
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.startWorkers - Whether to start workers (default: true)
 * @returns {Promise<boolean>} True if initialization succeeded
 */
const initialize = async (options = {}) => {
  const { startWorkers = true } = options;
  
  console.log('🔧 Initializing Agent Job System...');
  
  // Initialize queues
  const queuesReady = queues.initializeQueues();
  
  if (!queuesReady) {
    console.warn('⚠️ Job system running in degraded mode (no Redis)');
    console.warn('   Missions will be created but not processed automatically');
    isInitialized = false;
    return false;
  }
  
  // Start workers if requested
  if (startWorkers) {
    const connection = queues.getConnection();
    workers.mission = createMissionWorker();
    workers.results = createResultsWorker();
    workers.notifications = createNotificationsWorker();
    workers.scrape = createScrapeWorker(connection);

    console.log('✅ Agent Job System initialized with workers');
  } else {
    console.log('✅ Agent Job System initialized (workers disabled)');
  }
  
  isInitialized = true;
  return true;
};

/**
 * Queue a new mission for processing
 * This is the main interface for creating new missions
 * 
 * @param {Object} missionData - The mission data
 * @param {number} missionData.missionId - Database ID of the mission
 * @param {string} missionData.platform - Target platform
 * @param {string} missionData.prompt - User's research prompt
 * @param {string[]} missionData.agents - List of agents to use
 * @param {Object} missionData.parameters - Additional parameters
 * @param {Object} options - Queue job options
 * @returns {Promise<Object>} The created job (or mock object if system not initialized)
 */
const queueMission = async (missionData, options = {}) => {
  if (!isInitialized || !queues.getQueues().missions) {
    console.warn('Job system not initialized - mission will remain pending');
    return {
      id: `pending-${missionData.missionId}`,
      data: missionData,
      state: 'pending',
      note: 'Job system not available'
    };
  }
  
  return queues.addMissionJob(missionData, options);
};

/**
 * Get the status of a mission job
 * 
 * @param {number} missionId - The mission ID
 * @returns {Promise<Object|null>} Job status or null
 */
const getMissionStatus = async (missionId) => {
  return queues.getMissionJobStatus(missionId);
};

/**
 * Cancel a pending or running mission
 *
 * @param {number} missionId - The mission ID
 * @returns {Promise<boolean>} True if cancelled
 */
const cancelMission = async (missionId) => {
  return queues.cancelMissionJob(missionId);
};

/**
 * Queue a scrape job for processing
 *
 * @param {Object} scrapeData - The scrape job data
 * @param {string} scrapeData.sessionId - Scrape session ID
 * @param {number} scrapeData.marketplaceId - Marketplace ID
 * @param {number} scrapeData.userId - User ID
 * @param {Object} scrapeData.config - Scraper configuration
 * @param {Object} options - Queue job options
 * @returns {Promise<Object>} The created job
 */
const queueScrape = async (scrapeData, options = {}) => {
  if (!isInitialized || !queues.getQueues().scrape) {
    console.warn('Job system not initialized - scrape job will not be processed');
    return {
      id: `pending-${scrapeData.sessionId}`,
      data: scrapeData,
      state: 'pending',
      note: 'Job system not available'
    };
  }

  return queues.addScrapeJob(scrapeData, options);
};

/**
 * Get the status of a scrape job
 *
 * @param {string} sessionId - The session ID
 * @returns {Promise<Object|null>} Job status or null
 */
const getScrapeStatus = async (sessionId) => {
  return queues.getScrapeJobStatus(sessionId);
};

/**
 * Get queue statistics
 * Useful for monitoring dashboard
 * 
 * @returns {Promise<Object|null>} Queue statistics
 */
const getStats = async () => {
  if (!isInitialized) {
    return {
      status: 'not_initialized',
      message: 'Job system not initialized (Redis not configured)'
    };
  }
  
  return queues.getQueueStats();
};

/**
 * Check if the job system is healthy
 * 
 * @returns {Promise<Object>} Health status
 */
const healthCheck = async () => {
  if (!isInitialized) {
    return {
      healthy: false,
      status: 'not_initialized',
      message: 'Job system not initialized'
    };
  }
  
  try {
    const stats = await queues.getQueueStats();
    
    // Check if any workers are running
    const workersRunning = Object.values(workers).some(w => w !== null);
    
    return {
      healthy: true,
      status: 'running',
      workersActive: workersRunning,
      queues: stats
    };
  } catch (error) {
    return {
      healthy: false,
      status: 'error',
      message: error.message
    };
  }
};

/**
 * Graceful shutdown
 * Call this when the server is shutting down
 */
const shutdown = async () => {
  console.log('🛑 Shutting down Agent Job System...');
  
  // Close workers first (let them finish current jobs)
  const workerPromises = Object.values(workers)
    .filter(w => w !== null)
    .map(w => w.close());
  
  await Promise.all(workerPromises);
  
  // Then close queues
  await queues.shutdownQueues();
  
  isInitialized = false;
  console.log('Agent Job System shut down');
};

/**
 * Run cleanup of old jobs
 * Should be called periodically (e.g., via cron)
 */
const cleanup = async () => {
  if (!isInitialized) {
    return;
  }
  
  return queues.cleanupOldJobs();
};

// Export the public API
module.exports = {
  // Initialization
  initialize,
  shutdown,

  // Mission operations
  queueMission,
  getMissionStatus,
  cancelMission,

  // Scrape operations
  queueScrape,
  getScrapeStatus,

  // Monitoring
  getStats,
  healthCheck,
  cleanup,

  // Constants
  MISSION_STATUS,

  // Internal access (for advanced use cases)
  getQueues: queues.getQueues,
  getWorkers: () => workers,
  isInitialized: () => isInitialized
};
