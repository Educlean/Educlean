import { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "../../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { getVancouverDateString, getVancouverDayBounds } from "../../../../lib/timezone";

interface RequestUpdateBody {
  requestId: string;
  status: "todo" | "in_progress" | "done";
  employeeID: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const db = await getDb();

  if (req.method === "GET") {
    try {
      const { employeeID, schoolId } = req.query;

      if (!employeeID) {
        return res.status(400).json({ error: "employeeID is required" });
      }

      const filter: any = {};

      // If schoolId is provided, filter by school
      if (schoolId) {
        filter.schoolId = new ObjectId(schoolId as string);
      } else {
        // If no schoolId provided, get all schools where this employee works
        // First, get today's schedules for this employee in Vancouver timezone
        const today = getVancouverDateString();
        const { startOfDay } = getVancouverDayBounds(today);
        const schedules = await db
          .collection("schedules")
          .find({
            employeeID: employeeID as string,
            date: { $gte: startOfDay },
          })
          .toArray();

        const schoolIds = schedules.map((schedule) =>
          schedule.schoolId.toString()
        );

        if (schoolIds.length > 0) {
          filter.schoolId = { $in: schoolIds };
        } else {
          // No schedules found, return empty array
          return res.status(200).json([]);
        }
      }

      // Get requests with school information using optimized aggregation
      const { getRequestsWithSchoolInfo } = await import("../../../../lib/helpers");
      const requestsWithSchoolInfo = await getRequestsWithSchoolInfo(
        filter,
        { useCache: true, cacheTtl: 1 * 60 * 1000 } // Cache for 1 minute
      );

      return res.status(200).json(requestsWithSchoolInfo);
    } catch (error) {
      console.error("Get cleaner requests error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else if (req.method === "PUT") {
    try {
      const { requestId, status, employeeID }: RequestUpdateBody = req.body;

      if (!requestId || !status || !employeeID) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (!["todo", "in_progress", "done"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      // Import helper functions
      const { findById, updateOne } = await import("../../../../lib/helpers");

      // Check if request exists
      const request = await findById("requests", requestId);
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }

      // Prepare update data
      const updateData: any = {
        status,
        updatedAt: new Date(),
      };

      // Add timestamps based on status
      if (status === "in_progress" && request.status === "todo") {
        updateData.startedAt = new Date();
        updateData.assignedTo = employeeID;
      } else if (status === "done" && request.status === "in_progress") {
        updateData.completedAt = new Date();
      }

      // Update the request using optimized helper
      const result = await updateOne("requests", requestId, updateData);

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Request not found" });
      }

      // Get updated request with school info using aggregation
      const { getRequestsWithSchoolInfo } = await import("../../../../lib/helpers");
      const [updatedRequestWithSchool] = await getRequestsWithSchoolInfo(
        { _id: new ObjectId(requestId) },
        { useCache: false } // Don't cache single request lookups
      );

      return res.status(200).json({
        success: true,
        message: `Request status updated to ${status}`,
        request: updatedRequestWithSchool,
      });
    } catch (error) {
      console.error("Update request status error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
