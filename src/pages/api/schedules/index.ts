import { NextApiRequest, NextApiResponse } from "next";
import formidable, { File } from "formidable";
import * as XLSX from "xlsx";
import { Db, ObjectId } from "mongodb";
import fs from "fs";
import { getDb } from "../../../../lib/mongodb";

export const config = {
  api: {
    bodyParser: false,
  },
};

interface ScheduleRow {
  employeeID: string;
  startDate: string | number;
  Mon?: string;
  Tue?: string;
  Wed?: string;
  Thu?: string;
  Fri?: string;
  Sat?: string;
  Sun?: string;
  schoolID: string;
}

type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
const days: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = formidable({
    multiples: false,
    maxFileSize: 2 * 1024 * 1024,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err);
      return res.status(400).json({ error: "Invalid file" });
    }

    try {
      const uploaded = files.file;
      if (!uploaded) {
        return res.status(400).json({ error: "No file received" });
      }

      const file: File = Array.isArray(uploaded) ? uploaded[0] : uploaded;

      const workbook = XLSX.readFile(file.filepath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: ScheduleRow[] =
        XLSX.utils.sheet_to_json<ScheduleRow>(sheet);

      const db: Db = await getDb();
      let insertedCount = 0;

      /**
       * Detect all the weerks to clear first
       */
      const weeksToClear = new Map<
        string,
        { userId: ObjectId; start: Date; end: Date }
      >();

      for (const row of rows) {
        const { employeeID, startDate } = row;
        if (!employeeID || !startDate) continue;

        const employeeIDClean = String(employeeID).trim();

        const user = await db
          .collection("users")
          .findOne({ employeeID: employeeIDClean });
        if (!user) continue;

        let weekStart: Date;

        if (typeof startDate === "number") {
          const d = XLSX.SSF.parse_date_code(startDate);
          weekStart = new Date(Date.UTC(d.y, d.m - 1, d.d));
        } else {
          const [y, m, d] = startDate.split("-").map(Number);
          weekStart = new Date(Date.UTC(y, m - 1, d));
        }

        weekStart.setUTCHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
        weekEnd.setUTCHours(23, 59, 59, 999);

        const key = `${user._id}_${weekStart.toISOString()}`;

        if (!weeksToClear.has(key)) {
          weeksToClear.set(key, {
            userId: user._id,
            start: weekStart,
            end: weekEnd,
          });
        }
      }

      /**
       * Delete previous schedules for the detected weeks
       */
      for (const [, w] of weeksToClear) {
        await db.collection("schedules").deleteMany({
          userId: w.userId,
          date: {
            $gte: w.start,
            $lte: w.end,
          },
        });
      }

      /**
       * Insert new schedules
       */
      for (const row of rows) {
        const { employeeID, startDate, schoolID } = row;
        if (!employeeID || !startDate || !schoolID) continue;

        const employeeIDClean = String(employeeID).trim();

        const user = await db
          .collection("users")
          .findOne({ employeeID: employeeIDClean });
        if (!user) continue;

        const school = await db
          .collection("schools")
          .findOne({ _id: new ObjectId(schoolID) });
        if (!school) continue;

        let weekStart: Date;

        if (typeof startDate === "number") {
          const d = XLSX.SSF.parse_date_code(startDate);
          weekStart = new Date(Date.UTC(d.y, d.m - 1, d.d));
        } else {
          const [y, m, d] = startDate.split("-").map(Number);
          weekStart = new Date(Date.UTC(y, m - 1, d));
        }

        weekStart.setUTCHours(0, 0, 0, 0);

        for (const dayName of days) {
          const time = row[dayName];
          if (!time || typeof time !== "string") continue;

          const [startTime, endTime] = time.split("-").map(t => t.trim());
          if (!startTime || !endTime) continue;

          const scheduleDate = new Date(weekStart);
          scheduleDate.setUTCDate(
            weekStart.getUTCDate() + days.indexOf(dayName),
          );
          scheduleDate.setUTCHours(0, 0, 0, 0);

          await db.collection("schedules").insertOne({
            userId: user._id,
            employeeID: employeeIDClean,
            schoolId: school._id,
            day: dayName,
            date: scheduleDate,
            startTime,
            endTime,
            createdAt: new Date(),
          });

          insertedCount++;
        }
      }

      fs.unlinkSync(file.filepath);

      return res.status(200).json({
        success: true,
        message: `${insertedCount} horarios cargados correctamente`,
        
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error procesando archivo" });
    }
    
  });
  
}
