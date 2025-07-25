// Core interfaces for AI Accuracy Analytics

// Model type definition
export type ModelType = 'llm' | 'voice' | 'transcriber';
export interface AIAccuracyAnalyticsData {
  modelPerformance: ModelPerformanceMetrics;
  accuracyTrends: AccuracyTrendData[];
  failurePatterns: FailurePatternData;
  keywordAnalysis: KeywordAnalysisData;
  conversationQuality: ConversationQualityMetrics;
  technicalMetrics: TechnicalMetricsData;
}

export interface ModelPerformanceMetrics {
  totalCalls: number;
  modelsUsed: ModelUsageData[];
  averageAccuracy: number;
  bestPerformingModel: string;
  worstPerformingModel: string;
  performanceComparison: ModelComparisonData[];
  modelType?: ModelType;
}

export interface ModelUsageData {
  modelName: string;
  callCount: number;
  usagePercentage: number;
  averageAccuracy: number;
  averageQualityScore: number;
  failureRate: number;
  averageAdherenceScore: number;
  costEfficiency: number;
  responseTime: number;
  modelType?: ModelType;
  provider?: string;
}

export interface ModelComparisonData {
  modelName: string;
  accuracyScore: number;
  qualityScore: number;
  adherenceScore: number;
  failureRate: number;
  costPerCall: number;
  statisticalSignificance: boolean;
  confidenceInterval?: { lower: number; upper: number };
  sampleSize?: number;
  standardDeviation?: number;
}

export interface FailurePatternData {
  commonFailures: FailureCategory[];
  criticalFailures: CriticalFailureData[];
  failuresByModel: ModelFailureBreakdown[];
  failureTrends: FailureTrendData[];
}

export interface FailureCategory {
  category: string;
  count: number;
  percentage: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  examples: string[];
}

export interface CriticalFailureData {
  description: string;
  count: number;
  affectedModels: string[];
  firstOccurrence: string;
  lastOccurrence: string;
}

export interface ModelFailureBreakdown {
  modelName: string;
  totalFailures: number;
  failureRate: number;
  failureCategories: { [category: string]: number };
}

export interface FailureTrendData {
  date: string;
  totalFailures: number;
  failuresByModel: { [modelName: string]: number };
  criticalFailures: number;
}

export interface KeywordAnalysisData {
  topFailureKeywords: KeywordFrequency[];
  failureCategories: FailureCategoryBreakdown[];
  trendingIssues: TrendingIssueData[];
}

export interface KeywordFrequency {
  keyword: string;
  frequency: number;
  category: 'hallucination' | 'transcriber' | 'rules' | 'protocol' | 'other';
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface FailureCategoryBreakdown {
  category: string;
  count: number;
  percentage: number;
  keywords: string[];
}

export interface TrendingIssueData {
  issue: string;
  frequency: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  affectedModels: string[];
}

export interface AccuracyTrendData {
  date: string;
  overallAccuracy: number;
  modelAccuracies: { [modelName: string]: number };
  qualityScore: number;
  adherenceScore: number;
  failureCount: number;
}

export interface ConversationQualityMetrics {
  overallQualityScore: number;
  qualityByModel: { [modelName: string]: number };
  sentimentDistribution: { [sentiment: string]: number };
  qualityTrends: QualityTrendData[];
  // Enhanced correlation data
  qualityDimensionsByModel?: { [modelName: string]: QualityDimensions };
  modelQualityComparison?: ModelQualityComparison[];
  qualityCorrelationMatrix?: QualityCorrelationMatrix;
  qualityThresholdAnalysis?: QualityThresholdAnalysis;
}

export interface QualityTrendData {
  date: string;
  averageQuality: number;
  sentimentScores: { [sentiment: string]: number };
  modelQuality: { [modelName: string]: number };
}

export interface TechnicalMetricsData {
  averageResponseTime: number;
  tokenUsageStats: TokenUsageStats;
  costEfficiencyMetrics: CostEfficiencyMetrics;
  performanceDiagnostics: PerformanceDiagnostic[];
}

export interface TokenUsageStats {
  averageInputTokens: number;
  averageOutputTokens: number;
  totalTokensUsed: number;
  tokensByModel: { [modelName: string]: { input: number; output: number } };
}

export interface CostEfficiencyMetrics {
  averageCostPerCall: number;
  costByModel: { [modelName: string]: number };
  costTrends: CostTrendData[];
  costVsAccuracyCorrelation: number;
}

export interface CostTrendData {
  date: string;
  totalCost: number;
  costByModel: { [modelName: string]: number };
  costPerAccuracyPoint: number;
}

export interface PerformanceDiagnostic {
  metric: string;
  value: number;
  threshold: number;
  status: 'good' | 'warning' | 'critical';
  recommendation: string;
}

export interface AIAccuracyFilters {
  startDate?: string;
  endDate?: string;
  clientId?: string;
  modelType?: string;
  accuracyThreshold?: number;
}

export interface StatisticalTestResult {
  isSignificant: boolean;
  pValue: number;
  effectSize: number;
  testType: string;
  confidenceLevel?: number;
}

export interface ModelPerformanceTrend {
  date: string;
  modelName: string;
  accuracyScore: number;
  qualityScore: number;
  adherenceScore: number;
  callCount: number;
  movingAverage?: number;
  modelType?: ModelType;
  provider?: string;
}

// Enhanced conversation quality correlation types
export interface QualityDataPoint {
  overallScore: number;
  clarityPoliteness: number;
  naturalness: number;
  relevanceQuestions: number;
  objectionHandling: number;
  leadIntent: number;
  sentiment: string;
  timestamp: string;
}

export interface QualityDimensions {
  clarityPoliteness: number;
  naturalness: number;
  relevanceQuestions: number;
  objectionHandling: number;
  leadIntent: number;
  sentimentDistribution: { [sentiment: string]: number };
}

export interface ModelQualityComparison {
  modelName: string;
  averageQualityScore: number;
  sampleSize: number;
  standardDeviation: number;
  confidenceInterval: { lower: number; upper: number };
  qualityConsistency: number;
  strengthAreas: string[];
  improvementAreas: string[];
}

export interface QualityCorrelationMatrix {
  clarityVsNaturalness: number;
  clarityVsRelevance: number;
  clarityVsObjection: number;
  clarityVsLeadIntent: number;
  naturalnessVsRelevance: number;
  naturalnessVsObjection: number;
  naturalnessVsLeadIntent: number;
  relevanceVsObjection: number;
  relevanceVsLeadIntent: number;
  objectionVsLeadIntent: number;
}

export interface QualityThresholdAnalysis {
  thresholdPerformance: { [modelName: string]: { [threshold: number]: number } };
  modelRankings: ModelQualityRanking[];
  qualityDistribution: { [modelName: string]: QualityDistributionBuckets };
}

export interface ModelQualityRanking {
  modelName: string;
  averageScore: number;
  sampleSize: number;
  aboveExcellent: number; // Percentage above 9.0
  aboveGood: number; // Percentage above 8.0
}

export interface QualityDistributionBuckets {
  excellent: number; // 9.0+
  good: number; // 8.0-8.9
  satisfactory: number; // 7.0-7.9
  needsImprovement: number; // <7.0
}