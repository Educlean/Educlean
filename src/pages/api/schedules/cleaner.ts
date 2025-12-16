import { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "../../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { getUtcWeekBounds, getUtcDayBounds } from "../../../../lib/timezone";

// Tipo exacto del filtro de fecha usado en tus helpers
type DateFilter = {
  date: {
    $gte: Date;
    $lt?: Date;
    $lte?: Date;
  };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = await getDb();

  if (req.method === "GET") {
    try {
      const { employeeID, date, startDate, endDate } = req.query;

      if (!employeeID) {
        return res.status(400).json({ error: "employeeID is required" });
      }

      let dateFilter: DateFilter;

      if (date) {
        // Get schedules for a specific date in UTC
        const { startOfDay, endOfDay } = getUtcDayBounds(date as string);

        dateFilter = {
          date: {
            $gte: startOfDay,
            $lt: endOfDay,
          },
        };
      } else if (startDate && endDate) {
        // Get schedules for a date range in UTC
        const { startOfDay: rangeStart } = getUtcDayBounds(startDate as string);
        const { endOfDay: rangeEnd } = getUtcDayBounds(endDate as string);

        dateFilter = {
          date: {
            $gte: rangeStart,
            $lte: rangeEnd,
          },
        };
      } else {
        // Default to current week in UTC
        const { startOfWeek, endOfWeek } = getUtcWeekBounds();

        dateFilter = {
          date: {
            $gte: startOfWeek,
            $lte: endOfWeek,
          },
        };
      }

      // Get schedules with school information
      const { getSchedulesWithSchoolInfo } = await import("../../../../lib/helpers");

      const schedulesWithSchoolInfo = await getSchedulesWithSchoolInfo(
        employeeID as string,
        dateFilter,
        { useCache: true, cacheTtl: 2 * 60 * 1000 }
      );

      return res.status(200).json(schedulesWithSchoolInfo);

    } catch (error) {
      console.error("Get cleaner schedules error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }

  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
