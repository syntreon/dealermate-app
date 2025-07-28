import React, { memo, useMemo, useCallback } from 'react';
import MetricsSummaryCards from '@/components/dashboard/MetricsSummaryCards';

interface MemoizedMetricsSummaryCardsProps {
  metrics: {
    totalCalls: number;
    averageHandleTime: string;
    callsTransferred: number;
    totalLeads: number;
    callsGrowth?: number;
    timeGrowth?: number;
    transferGrowth?: number;
    leadsGrowth?: number;
    todaysCalls?: number;
    linesAvailable?: number;
    agentsAvailable?: number;
    callsInQueue?: number;
  };
  isLoading?: boolean;
}

/**
 * Memoized version of MetricsSummaryCards that prevents unnecessary re-renders
 * when metrics haven't changed. This is especially important for dashboard components
 * that may receive frequent updates.
 */
const MemoizedMetricsSummaryCards: React.FC<MemoizedMetricsSummaryCardsProps> = memo(({
  metrics,
  isLoading = false
}) => {
  // Memoize the metrics object to prevent unnecessary re-renders
  const memoizedMetrics = useMemo(() => {
    return {
      totalCalls: metrics.totalCalls,
      averageHandleTime: metrics.averageHandleTime,
      callsTransferred: metrics.callsTransferred,
      totalLeads: metrics.totalLeads,
      callsGrowth: metrics.callsGrowth,
      timeGrowth: metrics.timeGrowth,
      transferGrowth: metrics.transferGrowth,
      leadsGrowth: metrics.leadsGrowth,
      todaysCalls: metrics.todaysCalls,
      linesAvailable: metrics.linesAvailable,
      agentsAvailable: metrics.agentsAvailable,
      callsInQueue: metrics.callsInQueue,
    };
  }, [
    metrics.totalCalls,
    metrics.averageHandleTime,
    metrics.callsTransferred,
    metrics.totalLeads,
    metrics.callsGrowth,
    metrics.timeGrowth,
    metrics.transferGrowth,
    metrics.leadsGrowth,
    metrics.todaysCalls,
    metrics.linesAvailable,
    metrics.agentsAvailable,
    metrics.callsInQueue,
  ]);

  return (
    <MetricsSummaryCards
      metrics={memoizedMetrics}
      isLoading={isLoading}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  
  // Compare all metric values
  const prevMetrics = prevProps.metrics;
  const nextMetrics = nextProps.metrics;
  
  return (
    prevMetrics.totalCalls === nextMetrics.totalCalls &&
    prevMetrics.averageHandleTime === nextMetrics.averageHandleTime &&
    prevMetrics.callsTransferred === nextMetrics.callsTransferred &&
    prevMetrics.totalLeads === nextMetrics.totalLeads &&
    prevMetrics.callsGrowth === nextMetrics.callsGrowth &&
    prevMetrics.timeGrowth === nextMetrics.timeGrowth &&
    prevMetrics.transferGrowth === nextMetrics.transferGrowth &&
    prevMetrics.leadsGrowth === nextMetrics.leadsGrowth &&
    prevMetrics.todaysCalls === nextMetrics.todaysCalls &&
    prevMetrics.linesAvailable === nextMetrics.linesAvailable &&
    prevMetrics.agentsAvailable === nextMetrics.agentsAvailable &&
    prevMetrics.callsInQueue === nextMetrics.callsInQueue
  );
});

MemoizedMetricsSummaryCards.displayName = 'MemoizedMetricsSummaryCards';

export default MemoizedMetricsSummaryCards;