import type { NextApiRequest, NextApiResponse } from "next";
import { checkConnection } from "../../../lib/mongodb";
import { getCacheStats } from "../../../lib/helpers";

interface HealthResponse {
  status: "healthy" | "unhealthy";
  timestamp: string;
  database: {
    connected: boolean;
    message: string;
  };
  cache: {
    size: number;
    keys: number;
  };
  uptime: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: { connected: false, message: "Method not allowed" },
      cache: { size: 0, keys: 0 },
      uptime: process.uptime(),
    });
  }

  try {
    // Check database connection
    const dbConnected = await checkConnection();
    
    // Get cache statistics
    const cacheStats = getCacheStats();
    
    const healthStatus: HealthResponse = {
      status: dbConnected ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      database: {
        connected: dbConnected,
        message: dbConnected ? "Database connection is healthy" : "Database connection failed",
      },
      cache: {
        size: cacheStats.size,
        keys: cacheStats.keys.length,
      },
      uptime: process.uptime(),
    };

    const statusCode = dbConnected ? 200 : 503;
    return res.status(statusCode).json(healthStatus);
  } catch (error) {
    console.error("Health check error:", error);
    return res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      cache: { size: 0, keys: 0 },
      uptime: process.uptime(),
    });
  }
}