import type { NextApiRequest, NextApiResponse } from "next";
import { clearCache, getCacheStats } from "../../../lib/helpers";

interface CacheResponse {
  success: boolean;
  message: string;
  stats: {
    size: number;
    keys: string[];
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CacheResponse>
) {
  try {
    if (req.method === "GET") {
      // Get cache statistics
      const stats = getCacheStats();
      return res.status(200).json({
        success: true,
        message: "Cache statistics retrieved successfully",
        stats,
      });
    } else if (req.method === "DELETE") {
      // Clear cache
      clearCache();
      const stats = getCacheStats();
      return res.status(200).json({
        success: true,
        message: "Cache cleared successfully",
        stats,
      });
    } else {
      return res.status(405).json({
        success: false,
        message: "Method not allowed",
        stats: { size: 0, keys: [] },
      });
    }
  } catch (error) {
    console.error("Cache management error:", error);
    return res.status(500).json({
      success: false,
      message: `Cache operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      stats: { size: 0, keys: [] },
    });
  }
}