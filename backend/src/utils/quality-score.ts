/**
 * Quality Score Calculation Utility
 * 
 * Calculates a quality score (0-100) for affiliate offers based on multiple factors.
 * Higher scores indicate better offers with higher potential profitability.
 */

interface QualityScoreInputs {
  epc?: number; // Earnings Per Click
  conversionRate?: number; // Conversion rate percentage
  refundRate?: number; // Refund rate percentage
  gravity?: number; // ClickBank gravity score
  commissionValue?: number; // Commission amount
  commissionPercentage?: number; // Commission percentage
}

/**
 * Calculate quality score for an offer
 * 
 * Scoring algorithm:
 * - EPC: 30 points (higher is better, max at $3.00)
 * - Conversion Rate: 25 points (higher is better, max at 10%)
 * - Refund Rate: 20 points (lower is better, penalty for high refunds)
 * - Gravity: 15 points (ClickBank specific, max at 100)
 * - Commission: 10 points (higher is better)
 * 
 * @param inputs Offer metrics
 * @returns Quality score (0-100)
 */
export const calculateQualityScore = (inputs: QualityScoreInputs): number => {
  let score = 0;

  // EPC Score (0-30 points)
  // $0.50 = 5 points, $1.00 = 10 points, $2.00 = 20 points, $3.00+ = 30 points
  if (inputs.epc !== undefined && inputs.epc > 0) {
    const epcScore = Math.min((inputs.epc / 3.0) * 30, 30);
    score += epcScore;
  }

  // Conversion Rate Score (0-25 points)
  // 1% = 2.5 points, 5% = 12.5 points, 10%+ = 25 points
  if (inputs.conversionRate !== undefined && inputs.conversionRate > 0) {
    const conversionScore = Math.min((inputs.conversionRate / 10) * 25, 25);
    score += conversionScore;
  }

  // Refund Rate Score (0-20 points, inverted - lower is better)
  // 0% = 20 points, 5% = 15 points, 10% = 10 points, 20%+ = 0 points
  if (inputs.refundRate !== undefined) {
    const refundScore = Math.max(20 - (inputs.refundRate / 20) * 20, 0);
    score += refundScore;
  } else {
    // If no refund rate data, assume average (10%)
    score += 10;
  }

  // Gravity Score (0-15 points, ClickBank specific)
  // 20 = 3 points, 50 = 7.5 points, 100+ = 15 points
  if (inputs.gravity !== undefined && inputs.gravity > 0) {
    const gravityScore = Math.min((inputs.gravity / 100) * 15, 15);
    score += gravityScore;
  }

  // Commission Score (0-10 points)
  // Based on either fixed value or percentage
  if (inputs.commissionValue !== undefined && inputs.commissionValue > 0) {
    // $10 = 2 points, $50 = 5 points, $100+ = 10 points
    const commissionScore = Math.min((inputs.commissionValue / 100) * 10, 10);
    score += commissionScore;
  } else if (inputs.commissionPercentage !== undefined && inputs.commissionPercentage > 0) {
    // 20% = 2 points, 50% = 5 points, 75%+ = 10 points
    const commissionScore = Math.min((inputs.commissionPercentage / 75) * 10, 10);
    score += commissionScore;
  }

  // Round to nearest integer
  return Math.round(score);
};

/**
 * Get quality score rating
 * @param score Quality score (0-100)
 * @returns Rating string
 */
export const getQualityRating = (score: number): string => {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Fair';
  if (score >= 40) return 'Poor';
  return 'Very Poor';
};

/**
 * Get quality score color (for UI)
 * @param score Quality score (0-100)
 * @returns Color code
 */
export const getQualityColor = (score: number): string => {
  if (score >= 85) return '#10b981'; // green
  if (score >= 70) return '#3b82f6'; // blue
  if (score >= 55) return '#f59e0b'; // yellow
  if (score >= 40) return '#ef4444'; // red
  return '#991b1b'; // dark red
};

/**
 * Validate quality score inputs
 * @param inputs Quality score inputs
 * @returns True if inputs are valid
 */
export const validateQualityInputs = (inputs: QualityScoreInputs): boolean => {
  // At least one metric must be provided
  const hasMetrics = 
    inputs.epc !== undefined ||
    inputs.conversionRate !== undefined ||
    inputs.gravity !== undefined ||
    inputs.commissionValue !== undefined ||
    inputs.commissionPercentage !== undefined;

  if (!hasMetrics) {
    return false;
  }

  // Validate ranges
  if (inputs.epc !== undefined && inputs.epc < 0) return false;
  if (inputs.conversionRate !== undefined && (inputs.conversionRate < 0 || inputs.conversionRate > 100)) return false;
  if (inputs.refundRate !== undefined && (inputs.refundRate < 0 || inputs.refundRate > 100)) return false;
  if (inputs.gravity !== undefined && inputs.gravity < 0) return false;
  if (inputs.commissionValue !== undefined && inputs.commissionValue < 0) return false;
  if (inputs.commissionPercentage !== undefined && (inputs.commissionPercentage < 0 || inputs.commissionPercentage > 100)) return false;

  return true;
};

