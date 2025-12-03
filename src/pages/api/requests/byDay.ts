import { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "../../../../lib/mongodb";

export function getVancouverMidnightRange(queryDate: string) {
  // Medianoche en Vancouver (ajusta a -07:00 o -08:00 según la época)
  const start = new Date(`${queryDate}T00:00:00-07:00`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
}

export default async function getRequestByDay(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const db = await getDb();

    console.log("Connected DB in requestByDay:", db.databaseName);
    console.log("Count documents in requests:", await db.collection("requests").countDocuments());

    const queryDate = req.query.date as string;
    const { start, end } = getVancouverMidnightRange(queryDate);

    console.log("Filter for Vancouver day:", { start, end });

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

