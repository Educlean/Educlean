import { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "../../../../lib/mongodb";
import allowCors from '../../../lib/allowCors';
// import { findMany } from "../../../../lib/helpers";

function getUtcMidnightRange(queryDate: string) {
    const start = new Date(`${queryDate}T00:00:00Z`);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    return { start, end };
}

async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method === "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

else if (req.method === "GET") {
  console.log("Received GET request with query from schedules:", req.query);

  const queryDate = req.query.date as string;
  const { start, end } = getUtcMidnightRange(queryDate);

  try {
    const db = await getDb();
    const schedules = await db.collection("schedules").aggregate([
      {
        $match: { date: { $gte: start, $lt: end } }
      },
      {
        $lookup: {
          from: "schools",
          localField: "schoolId",
          foreignField: "_id",
          as: "school"
        }
      },
      {
        $unwind: "$school"
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      {
        $project: {
          _id: 1,
          date: 1,
          "school._id": 1,
          "school.name": 1,
          "user._id": 1,
          "user.name": 1
        }
      }
    ]).toArray();

    console.log("Schedules with joins:", schedules);
    return res.status(200).json(schedules);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return res.status(500).json({ error: "Error fetching schedules" });
  }
}

}
export default allowCors(handler);
