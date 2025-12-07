// performance.ts

/**
 * Interfaz para una única métrica de rendimiento de una operación de base de datos.
 */
export interface PerformanceMetric {
  operation: string; // Ej: 'findOne', 'updateOne', 'aggregate'
  collection: string; // Nombre de la colección
  duration: number; // Duración en milisegundos (ms)
  timestamp: Date;
  success: boolean;
  error?: string; // Mensaje de error si la operación falló
}

/**
 * Clase para gestionar la recopilación, almacenamiento y análisis de métricas de rendimiento.
 */
class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000; // Mantener las últimas 1000 métricas
  private readonly slowQueryThreshold = 1000; // Umbral para consultas lentas (1 segundo)

  /**
   * Registra una nueva métrica de rendimiento.
   * @param metric La métrica a registrar.
   */
  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Mantener solo las últimas entradas 'maxMetrics'
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Registrar consultas lentas (Slow Queries)
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

  /**
   * Obtiene las métricas registradas, ordenadas de las más recientes a las más antiguas.
   * @param limit Límite opcional de métricas a devolver.
   * @returns Array de PerformanceMetric.
   */
  getMetrics(limit?: number): PerformanceMetric[] {
    const metrics = this.metrics.slice().reverse(); // Las más recientes primero
    return limit ? metrics.slice(0, limit) : metrics;
  }

  /**
   * Obtiene todas las consultas lentas (aquellas que superan el umbral).
   * @param threshold Umbral de duración en ms.
   * @returns Array de PerformanceMetric que son lentas.
   */
  getSlowQueries(threshold?: number): PerformanceMetric[] {
    const slowThreshold = threshold || this.slowQueryThreshold;
    return this.metrics.filter(metric => metric.duration > slowThreshold);
  }

  /**
   * Calcula el tiempo promedio de respuesta para operaciones exitosas.
   * @param collection Filtra por nombre de colección.
   * @param operation Filtra por tipo de operación.
   * @returns El tiempo promedio de respuesta en ms.
   */
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

  /**
   * Calcula la tasa de errores (porcentaje de fallos).
   * @param collection Filtra por nombre de colección.
   * @param operation Filtra por tipo de operación.
   * @returns La tasa de errores como porcentaje (0-100).
   */
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

  /**
   * Devuelve un resumen estadístico de alto nivel.
   */
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
      // Redondea a dos decimales
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      errorRate: Math.round(this.getErrorRate() * 100) / 100,
      slowQueryThreshold: this.slowQueryThreshold,
    };
  }

  /**
   * Limpia todas las métricas registradas.
   */
  clearMetrics() {
    this.metrics = [];
  }
}

// Instancia global del monitor de rendimiento
export const performanceMonitor = new PerformanceMonitor();

// ------------------- FUNCIONES DE UTILIDAD -------------------

/**
 * Mide el tiempo de ejecución de una operación asíncrona y registra la métrica.
 * @param operation Nombre de la operación (e.g., 'find', 'insert').
 * @param collection Nombre de la colección de la BD.
 * @param fn Función asíncrona que envuelve la operación de la base de datos.
 * @returns El resultado de la función envuelta.
 */
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

/**
 * Decorador (Higher-Order Function) para envolver una función asíncrona
 * y monitorear su rendimiento automáticamente.
 * @param operation Nombre de la operación.
 * @param collection Nombre de la colección.
 * @param fn La función asíncrona a decorar.
 * @returns La función decorada.
 */
export function withPerformanceMonitoring<T extends unknown[], R>(
  operation: string,
  collection: string,
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    // Usamos measureDatabaseOperation para ejecutar y monitorear la función
    return measureDatabaseOperation<R>(operation, collection, () => fn(...args));
  };
}