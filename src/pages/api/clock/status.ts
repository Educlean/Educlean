import { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "../../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { getVancouverDateString } from "../../../../lib/timezone";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { employeeID, schoolId } = req.query;

    if (!employeeID || !schoolId) {
      return res.status(400).json({ error: "Missing employeeID or schoolId" });
    }

    const db = await getDb();
    const today = getVancouverDateString(); // Get today's date in Vancouver timezone

    // Get today's clock record
    const clockRecord = await db.collection("clock_records").findOne({
      employeeID: employeeID as string,
      schoolId: new ObjectId(schoolId as string),
      date: today
    });

    // Get school information
    const school = await db.collection("schools").findOne({ 
      _id: new ObjectId(schoolId as string) 
    });

    if (!school) {
      return res.status(404).json({ error: "School not found" });
    }

    let status = 'not_started';
    let clockInTime = null;
    let clockOutTime = null;

    if (clockRecord) {
      if (clockRecord.status === 'clocked_in') {
        status = 'clocked_in';
        clockInTime = clockRecord.clockInTime;
      } else if (clockRecord.status === 'completed') {
        status = 'completed';
        clockInTime = clockRecord.clockInTime;
        clockOutTime = clockRecord.clockOutTime;
      }
    }

    return res.status(200).json({
      status,
      clockInTime,
      clockOutTime,
      school: {
        id: school._id,
        name: school.name,
        address: school.address,
        coordinates: {
          latitude: school.lat,
          longitude: school.lng
        }
      },
      date: today
    });

  } catch (error) {
    console.error("Clock status API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}