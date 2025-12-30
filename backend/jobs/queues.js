/**
 * Agent Mission Queue Configuration
 * 
 * This module sets up BullMQ queues for processing agent research missions.
 * It handles job scheduling, retry logic, and provides utilities for queue management.
 * 
 * Queue Architecture:
 * - agent-missions: Main queue for research missions
 * - agent-results: Queue for processing mission results
 * - agent-notifications: Queue for sending alerts about completed missions
 */

const { Queue, Worker, QueueScheduler, QueueEvents } = require('bullmq');

// Redis connection configuration
// Uses the REDIS_URL from environment, which should be an Upstash Redis URL
const getRedisConnection = () => {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    console.warn('REDIS_URL not set. Queue system will not function.');
    return null;
  }
  
  // Parse the Redis URL to extract connection details
  // Upstash URLs look like: rediss://default:PASSWORD@HOST:PORT
  try {
    const url = new URL(redisUrl);
    return {
      host: url.hostname,
      port: parseInt(url.port) || 6379,
      password: url.password,
      // Enable TLS for Upstash (rediss:// protocol)
      tls: url.protocol === 'rediss:' ? {} : undefined,
      // Upstash requires this for compatibility
      maxRetriesPerRequest: null,
      enableReadyCheck: false
    };
  } catch (error) {
    console.error('Failed to parse REDIS_URL:', error.message);
    return null;
  }
};

// Queue names as constants for consistency
const QUEUE_NAMES = {
  MISSIONS: 'agent-missions',
  RESULTS: 'agent-results',
  NOTIFICATIONS: 'agent-notifications',
  SCRAPE: 'marketplace-scrape'
};

// Job options with retry configuration
const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 60000 // Start with 1 minute, then 2 min, then 4 min
  },
  removeOnComplete: {
    age: 86400, // Keep completed jobs for 24 hours
    count: 1000 // Keep last 1000 completed jobs
  },
  removeOnFail: {
    age: 604800 // Keep failed jobs for 7 days for debugging
  }
};

// Queue instances (initialized lazily)
let queues = {};
let connection = null;

/**
 * Initialize the queue system
 * Call this once when the server starts
 */
const initializeQueues = () => {
  connection = getRedisConnection();
  
  if (!connection) {
    console.warn('Queue system not initialized - Redis not configured');
    return false;
  }
  
  try {
    // Create the main mission queue
    queues.missions = new Queue(QUEUE_NAMES.MISSIONS, {
      connection,
      defaultJobOptions: DEFAULT_JOB_OPTIONS
    });
    
    // Create the results processing queue
    queues.results = new Queue(QUEUE_NAMES.RESULTS, {
      connection,
      defaultJobOptions: {
        ...DEFAULT_JOB_OPTIONS,
        attempts: 1 // Results processing shouldn't need retries
      }
    });
    
    // Create the notifications queue
    queues.notifications = new Queue(QUEUE_NAMES.NOTIFICATIONS, {
      connection,
      defaultJobOptions: {
        ...DEFAULT_JOB_OPTIONS,
        attempts: 2
      }
    });

    // Create the marketplace scrape queue
    queues.scrape = new Queue(QUEUE_NAMES.SCRAPE, {
      connection,
      defaultJobOptions: {
        ...DEFAULT_JOB_OPTIONS,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000 // Start with 5 seconds for scrape retries
        }
      }
    });

    console.log('✅ Queue system initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize queues:', error);
    return false;
  }
};

/**
 * Add a new mission to the processing queue
 * 
 * @param {Object} missionData - The mission details
 * @param {number} missionData.missionId - Database ID of the mission
 * @param {string} missionData.platform - Target platform (hotmart, impact, etc.)
 * @param {string} missionData.prompt - User's research prompt
 * @param {string[]} missionData.agents - List of agents to use
 * @param {Object} missionData.parameters - Additional parameters
 * @param {Object} options - Optional job configuration overrides
 * @returns {Promise<Object>} The created job
 */
const addMissionJob = async (missionData, options = {}) => {
  if (!queues.missions) {
    throw new Error('Queue system not initialized');
  }
  
  const jobId = `mission-${missionData.missionId}`;
  
  // Check if this mission is already queued
  const existingJob = await queues.missions.getJob(jobId);
  if (existingJob) {
    console.log(`Mission ${missionData.missionId} already queued`);
    return existingJob;
  }
  
  const job = await queues.missions.add(
    'research-mission',
    {
      ...missionData,
      queuedAt: new Date().toISOString()
    },
    {
      jobId,
      priority: options.priority || 0, // Lower number = higher priority
      ...options
    }
  );
  
  console.log(`📋 Mission ${missionData.missionId} queued with job ID: ${job.id}`);
  return job;
};

/**
 * Add a result processing job
 * Called when an agent completes its research
 * 
 * @param {Object} resultData - The mission results
 * @returns {Promise<Object>} The created job
 */
const addResultJob = async (resultData) => {
  if (!queues.results) {
    throw new Error('Queue system not initialized');
  }
  
  const job = await queues.results.add(
    'process-results',
    {
      ...resultData,
      receivedAt: new Date().toISOString()
    }
  );
  
  return job;
};

/**
 * Add a notification job
 * Used to alert users about mission completion or important discoveries
 * 
 * @param {Object} notificationData - The notification details
 * @returns {Promise<Object>} The created job
 */
const addNotificationJob = async (notificationData) => {
  if (!queues.notifications) {
    throw new Error('Queue system not initialized');
  }
  
  const job = await queues.notifications.add(
    'send-notification',
    notificationData
  );
  
  return job;
};

/**
 * Get the status of a mission job
 * 
 * @param {number} missionId - The mission ID
 * @returns {Promise<Object|null>} Job status or null if not found
 */
const getMissionJobStatus = async (missionId) => {
  if (!queues.missions) {
    return null;
  }
  
  const jobId = `mission-${missionId}`;
  const job = await queues.missions.getJob(jobId);
  
  if (!job) {
    return null;
  }
  
  const state = await job.getState();
  const progress = job.progress;
  
  return {
    jobId: job.id,
    state, // 'waiting', 'active', 'completed', 'failed', 'delayed'
    progress,
    attemptsMade: job.attemptsMade,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
    failedReason: job.failedReason
  };
};

/**
 * Cancel a pending mission
 * 
 * @param {number} missionId - The mission ID to cancel
 * @returns {Promise<boolean>} True if cancelled successfully
 */
const cancelMissionJob = async (missionId) => {
  if (!queues.missions) {
    return false;
  }
  
  const jobId = `mission-${missionId}`;
  const job = await queues.missions.getJob(jobId);
  
  if (!job) {
    return false;
  }
  
  const state = await job.getState();
  
  // Can only cancel if waiting or delayed
  if (state === 'waiting' || state === 'delayed') {
    await job.remove();
    return true;
  }
  
  // If active, we need to signal the worker to stop
  // This is handled by the worker checking for cancellation
  if (state === 'active') {
    await job.update({ ...job.data, cancelled: true });
    return true;
  }
  
  return false;
};

/**
 * Add a scrape job to the queue
 *
 * @param {Object} scrapeData - The scrape job details
 * @param {string} scrapeData.sessionId - Scrape session ID
 * @param {number} scrapeData.marketplaceId - Marketplace ID
 * @param {number} scrapeData.userId - User ID
 * @param {Object} scrapeData.config - Scraper configuration
 * @param {Object} options - Optional job configuration overrides
 * @returns {Promise<Object>} The created job
 */
const addScrapeJob = async (scrapeData, options = {}) => {
  if (!queues.scrape) {
    throw new Error('Queue system not initialized');
  }

  const jobId = `scrape-${scrapeData.sessionId}`;

  const job = await queues.scrape.add(
    'scrape-marketplace',
    {
      ...scrapeData,
      queuedAt: new Date().toISOString()
    },
    {
      jobId,
      priority: options.priority || 0,
      ...options
    }
  );

  console.log(`🔍 Scrape job queued: ${job.id}`);
  return job;
};

/**
 * Get scrape job status
 *
 * @param {string} sessionId - The session ID
 * @returns {Promise<Object|null>} Job status or null
 */
const getScrapeJobStatus = async (sessionId) => {
  if (!queues.scrape) {
    return null;
  }

  const jobId = `scrape-${sessionId}`;
  const job = await queues.scrape.getJob(jobId);

  if (!job) {
    return null;
  }

  const state = await job.getState();

  return {
    jobId: job.id,
    state,
    progress: job.progress,
    attemptsMade: job.attemptsMade,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
    failedReason: job.failedReason
  };
};

/**
 * Get queue statistics
 * Useful for monitoring and dashboard display
 *
 * @returns {Promise<Object>} Queue statistics
 */
const getQueueStats = async () => {
  if (!queues.missions) {
    return null;
  }

  const [missionStats, scrapeStats] = await Promise.all([
    Promise.all([
      queues.missions.getWaitingCount(),
      queues.missions.getActiveCount(),
      queues.missions.getCompletedCount(),
      queues.missions.getFailedCount(),
      queues.missions.getDelayedCount()
    ]),
    queues.scrape ? Promise.all([
      queues.scrape.getWaitingCount(),
      queues.scrape.getActiveCount(),
      queues.scrape.getCompletedCount(),
      queues.scrape.getFailedCount(),
      queues.scrape.getDelayedCount()
    ]) : [0, 0, 0, 0, 0]
  ]);

  return {
    missions: {
      waiting: missionStats[0],
      active: missionStats[1],
      completed: missionStats[2],
      failed: missionStats[3],
      delayed: missionStats[4]
    },
    scrape: {
      waiting: scrapeStats[0],
      active: scrapeStats[1],
      completed: scrapeStats[2],
      failed: scrapeStats[3],
      delayed: scrapeStats[4]
    },
    timestamp: new Date().toISOString()
  };
};

/**
 * Clean up old jobs
 * Should be called periodically (e.g., daily via cron)
 */
const cleanupOldJobs = async () => {
  if (!queues.missions) {
    return;
  }
  
  // Clean jobs older than 7 days
  const gracePeriod = 7 * 24 * 60 * 60 * 1000;
  
  await Promise.all([
    queues.missions.clean(gracePeriod, 1000, 'completed'),
    queues.missions.clean(gracePeriod, 1000, 'failed'),
    queues.results.clean(gracePeriod, 1000, 'completed'),
    queues.notifications.clean(gracePeriod, 1000, 'completed'),
    queues.scrape?.clean(gracePeriod, 1000, 'completed'),
    queues.scrape?.clean(gracePeriod, 1000, 'failed')
  ].filter(Boolean));
  
  console.log('🧹 Queue cleanup completed');
};

/**
 * Gracefully shutdown the queue system
 * Call this when the server is shutting down
 */
const shutdownQueues = async () => {
  console.log('Shutting down queue system...');
  
  const closePromises = Object.values(queues).map(queue => queue.close());
  await Promise.all(closePromises);
  
  console.log('Queue system shut down');
};

// Export everything needed by other modules
module.exports = {
  QUEUE_NAMES,
  initializeQueues,
  addMissionJob,
  addResultJob,
  addNotificationJob,
  getMissionJobStatus,
  cancelMissionJob,
  // Scrape queue functions
  addScrapeJob,
  getScrapeJobStatus,
  // Utilities
  getQueueStats,
  cleanupOldJobs,
  shutdownQueues,
  getConnection: () => connection,
  getQueues: () => queues
};
