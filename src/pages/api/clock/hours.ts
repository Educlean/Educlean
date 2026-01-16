import { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "../../../../lib/mongodb";
import { getLocalDateString, getUtcDateString } from "../../../../lib/timezone";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { startDate, endDate, date } = req.query;

    let start = typeof startDate === "string" ? startDate : undefined;
    let end = typeof endDate === "string" ? endDate : undefined;

    if (!start && !end && typeof date === "string") {
      start = date;
      end = date;
    }

    if (!start && !end) {
      const today = getLocalDateString();
      start = today;
      end = today;
    } else if (start && !end) {
      end = start;
    } else if (!start && end) {
      start = end;
    }

    const db = await getDb();

    const pipeline = [
      {
        $match: {
          status: "completed",
          date: {
            $gte: start,
            $lte: end,
          },
          clockInTime: { $ne: null },
          clockOutTime: { $ne: null },
        },
      },
      {
        $lookup: {
          from: "schools",
          localField: "schoolId",
          foreignField: "_id",
          as: "school",
        },
      },
      {
        $unwind: {
          path: "$school",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "employeeID",
          foreignField: "employeeID",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          employeeID: 1,
          date: 1,
          clockInTime: 1,
          clockOutTime: 1,
          userId: "$user._id",
          name: "$user.name",
          schoolName: "$school.name",
          hoursWorked: {
            $divide: [
              { $subtract: ["$clockOutTime", "$clockInTime"] },
              1000 * 60 * 60,
            ],
          },
        },
      },
      {
        $group: {
          _id: {
            employeeID: "$employeeID",
            date: "$date",
            userId: "$userId",
            name: "$name",
            schoolName: "$schoolName",
          },
          hoursWorked: { $sum: "$hoursWorked" },
        },
      },
      {
        $project: {
          _id: 0,
          employeeID: "$_id.employeeID",
          date: "$_id.date",
          userId: "$_id.userId",
          name: "$_id.name",
          schoolName: "$_id.schoolName",
          hoursWorked: { $round: ["$hoursWorked", 2] },
        },
      },
      {
        $sort: {
          name: 1,
          employeeID: 1,
          date: 1,
        },
      },
    ];

    const result = await db
      .collection("clock_records")
      .aggregate(pipeline)
      .toArray();

    return res.status(200).json(result);
  } catch (error) {
    console.error("Clock hours API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
