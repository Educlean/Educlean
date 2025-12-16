import { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "../../../../lib/mongodb";
import allowCors from "../../../lib/allowCors";

export function getUtcMidnightRange(queryDate: string) {
  const start = new Date(`${queryDate}T00:00:00Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
}

async function getRequestByDay(req: NextApiRequest, res: NextApiResponse) {
  try {
    const db = await getDb();

    console.log("Connected DB in requestByDay:", db.databaseName);
    console.log(
      "Count documents in requests:",
      await db.collection("requests").countDocuments()
    );

    const queryDate = req.query.date as string;
    const { start, end } = getUtcMidnightRange(queryDate);

    console.log("Filter for UTC day:", { start, end });

    const requests = await db
      .collection("requests")
      .find({ time: { $gte: start, $lt: end } })
      .toArray();

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ error: "Error fetching requests" });
  }
}

export default allowCors(getRequestByDay);
