import { NextApiRequest, NextApiResponse } from "next";
import { findOne, insertOne, updateOne } from "../../../../lib/helpers";
import { ObjectId } from "mongodb";
import { getLocalDateString, getUtcDateString } from "../../../../lib/timezone";

interface ClockRequest {
  employeeID: string;
  schoolId: string;
  latitude: number;
  longitude: number;
  action: 'clock_in' | 'clock_out';
}

interface ClockRecord {
  _id?: ObjectId;
  employeeID: string;
  schoolId: ObjectId;
  clockInTime?: Date;
  clockOutTime?: Date;
  clockInLocation?: {
    latitude: number;
    longitude: number;
  };
  clockOutLocation?: {
    latitude: number;
    longitude: number;
  };
  date: string; // YYYY-MM-DD format
  status: 'clocked_in' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { employeeID, schoolId, latitude, longitude, action }: ClockRequest = req.body;

    if (!employeeID || !schoolId || !latitude || !longitude || !action) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get school coordinates with caching
    const school = await findOne("schools", { _id: new ObjectId(schoolId) }, { useCache: true, cacheTtl: 30 * 60 * 1000 }); // Cache for 30 minutes
    if (!school) {
      return res.status(404).json({ error: "School not found" });
    }

    // Verify geolocation (150 meter radius)
    const distance = calculateDistance(latitude, longitude, school.lat, school.lng);
    const maxDistance = 150; // meters

    if (distance > maxDistance) {
      return res.status(403).json({ 
        error: "Location verification failed", 
        message: `You must be within ${maxDistance} meters of the school to clock in/out. Current distance: ${Math.round(distance)} meters.`,
        distance: Math.round(distance),
        maxDistance
      });
    }

    const today = getLocalDateString(); // Get today's date in UTC
    const now = new Date();

    if (action === 'clock_in') {
      // Check if already clocked in today
      const existingRecord = await findOne("clock_records", {
        employeeID,
        schoolId: new ObjectId(schoolId),
        date: today,
        status: 'clocked_in'
      }, { useCache: false }); // Don't cache this query as it's time-sensitive

      if (existingRecord) {
        return res.status(400).json({ error: "Already clocked in for today" });
      }

      // Create new clock in record
      const clockRecord: ClockRecord = {
        employeeID,
        schoolId: new ObjectId(schoolId),
        clockInTime: now,
        clockInLocation: { latitude, longitude },
        date: today,
        status: 'clocked_in',
        createdAt: now,
        updatedAt: now
      };

      const result = await insertOne("clock_records", clockRecord);
      
      return res.status(200).json({
        success: true,
        message: "Successfully clocked in",
        recordId: result.insertedId,
        clockInTime: now,
        school: school.name
      });

    } else if (action === 'clock_out') {
      // Find today's clock in record
      const clockRecord = await findOne("clock_records", {
        employeeID,
        schoolId: new ObjectId(schoolId),
        date: today,
        status: 'clocked_in'
      }, { useCache: false }); // Don't cache this query as it's time-sensitive

      if (!clockRecord) {
        return res.status(400).json({ error: "No active clock in record found for today" });
      }

      // Update record with clock out information
      await updateOne("clock_records", 
        clockRecord._id!.toString(),
        {
          clockOutTime: now,
          clockOutLocation: { latitude, longitude },
          status: 'completed',
          updatedAt: now
        }
      );

      return res.status(200).json({
        success: true,
        message: "Successfully clocked out",
        clockOutTime: now,
        clockInTime: clockRecord.clockInTime,
        school: school.name
      });
    }

    return res.status(400).json({ error: "Invalid action" });

  } catch (error) {
    console.error("Clock API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
