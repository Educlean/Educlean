interface PerformanceMetric {
  operation: string;
  collection: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics
  private readonly slowQueryThreshold = 1000; // 1 second

  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Keep only the last maxMetrics entries
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow queries
    if (metric.duration > this.slowQueryThreshold) {
      console.warn(`Slow query detected:`, {
        operation: metric.operation,
        collection: metric.collection,
        duration: `${metric.duration}ms`,
        timestamp: metric.timestamp.toISOString(),
        success: metric.success,
        error: metric.error,
      });
    }
  }

  getMetrics(limit?: number): PerformanceMetric[] {
    const metrics = this.metrics.slice().reverse(); // Most recent first
    return limit ? metrics.slice(0, limit) : metrics;
  }

  getSlowQueries(threshold?: number): PerformanceMetric[] {
    const slowThreshold = threshold || this.slowQueryThreshold;
    return this.metrics.filter(metric => metric.duration > slowThreshold);
  }

  getAverageResponseTime(collection?: string, operation?: string): number {
    let filteredMetrics = this.metrics.filter(metric => metric.success);
    
    if (collection) {
      filteredMetrics = filteredMetrics.filter(metric => metric.collection === collection);
    }
    
    if (operation) {
      filteredMetrics = filteredMetrics.filter(metric => metric.operation === operation);
    }

    if (filteredMetrics.length === 0) return 0;

    const totalDuration = filteredMetrics.reduce((sum, metric) => sum + metric.duration, 0);
    return totalDuration / filteredMetrics.length;
  }

  getErrorRate(collection?: string, operation?: string): number {
    let filteredMetrics = this.metrics;
    
    if (collection) {
      filteredMetrics = filteredMetrics.filter(metric => metric.collection === collection);
    }
    
    if (operation) {
      filteredMetrics = filteredMetrics.filter(metric => metric.operation === operation);
    }

    if (filteredMetrics.length === 0) return 0;

    const errorCount = filteredMetrics.filter(metric => !metric.success).length;
    return (errorCount / filteredMetrics.length) * 100;
  }

  getStats() {
    const totalQueries = this.metrics.length;
    const successfulQueries = this.metrics.filter(metric => metric.success).length;
    const failedQueries = totalQueries - successfulQueries;
    const slowQueries = this.getSlowQueries().length;
    const averageResponseTime = this.getAverageResponseTime();

    return {
      totalQueries,
      successfulQueries,
      failedQueries,
      slowQueries,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      errorRate: Math.round(this.getErrorRate() * 100) / 100,
      slowQueryThreshold: this.slowQueryThreshold,
    };
  }

  clearMetrics() {
    this.metrics = [];
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Utility function to measure and record database operations
export async function measureDatabaseOperation<T>(
  operation: string,
  collection: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  let success = true;
  let error: string | undefined;

  try {
    const result = await fn();
    return result;
  } catch (err) {
    success = false;
    error = err instanceof Error ? err.message : 'Unknown error';
    throw err;
  } finally {
    const duration = Date.now() - startTime;
    performanceMonitor.recordMetric({
      operation,
      collection,
      duration,
      timestamp: new Date(),
      success,
      error,
    });
  }
}

// Decorator for automatic performance monitoring
export function withPerformanceMonitoring<T extends any[], R>(
  operation: string,
  collection: string,
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    return measureDatabaseOperation(operation, collection, () => fn(...args));
  };
}