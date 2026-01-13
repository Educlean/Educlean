import { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "../../../../lib/mongodb";
import allowCors from "../../../lib/allowCors";

export async function getUtcMidnightRange(
  queryDate: string,
  timeZone = "UTC"
): Promise<{ start: Date; end: Date }> {
  // Find the UTC instant such that in `timeZone` the local time is `queryDate` at 00:00:00.
  // We avoid external tz libs by using Intl to format candidate UTC instants
  // and searching within a reasonable hour window.
  const [yStr, mStr, dStr] = queryDate.split("-");
  const year = Number(yStr);
  const month = Number(mStr);
  const day = Number(dStr);

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const baseUtc = Date.UTC(year, month - 1, day, 0, 0, 0);

  // Search within -24..+24 hours (this covers all timezone offsets and DST shifts)
  let found: Date | null = null;
  for (let h = -24; h <= 24; h++) {
    const cand = new Date(baseUtc + h * 3600_000);
    const parts = formatter.formatToParts(cand).reduce((acc: any, p: any) => {
      acc[p.type] = p.value;
      return acc;
    }, {});

    const cy = Number(parts.year);
    const cm = Number(parts.month);
    const cd = Number(parts.day);
    const ch = Number(parts.hour);
    const cmn = Number(parts.minute);
    const cs = Number(parts.second);

    if (cy === year && cm === month && cd === day && ch === 0 && cmn === 0 && cs === 0) {
      found = cand;
      break;
    }
  }

  if (!found) {
    // Fallback: treat the date as UTC midnight
    const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const end = new Date(start.getTime() + 24 * 3600_000);
    return { start, end };
  }

  const start = found;
  const end = new Date(start.getTime() + 24 * 3600_000);
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
    const tz = (req.query.tz as string) || "UTC";
    const { start, end } = await getUtcMidnightRange(queryDate, tz);

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
