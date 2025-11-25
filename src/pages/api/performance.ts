import type { NextApiRequest, NextApiResponse } from "next";
import { performanceMonitor } from "../../../lib/performance";

interface PerformanceResponse {
  success: boolean;
  data?: {
    stats?: any;
    slowQueries?: any[];
    recentMetrics?: any[];
  };
  message?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PerformanceResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const { action, limit, threshold } = req.query;

    switch (action) {
      case "stats":
        const stats = performanceMonitor.getStats();
        return res.status(200).json({
          success: true,
          data: { stats },
        });

      case "slow-queries":
        const slowThreshold = threshold ? parseInt(threshold as string) : undefined;
        const slowQueries = performanceMonitor.getSlowQueries(slowThreshold);
        return res.status(200).json({
          success: true,
          data: { slowQueries },
        });

      case "recent":
        const limitNum = limit ? parseInt(limit as string) : 50;
        const recentMetrics = performanceMonitor.getMetrics(limitNum);
        return res.status(200).json({
          success: true,
          data: { recentMetrics },
        });

      case "clear":
        performanceMonitor.clearMetrics();
        return res.status(200).json({
          success: true,
          message: "Performance metrics cleared",
        });

      default:
        // Return comprehensive performance data
        const allStats = performanceMonitor.getStats();
        const allSlowQueries = performanceMonitor.getSlowQueries();
        const allRecentMetrics = performanceMonitor.getMetrics(20);

        return res.status(200).json({
          success: true,
          data: {
            stats: allStats,
            slowQueries: allSlowQueries,
            recentMetrics: allRecentMetrics,
          },
        });
    }
  } catch (error) {
    console.error("Performance API error:", error);
    return res.status(500).json({
      success: false,
      message: `Performance monitoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
}