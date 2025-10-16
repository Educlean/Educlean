import { NextApiRequest, NextApiResponse } from "next";
import formidable, { File } from "formidable";
import * as XLSX from "xlsx";
import { Db, ObjectId } from "mongodb";
import fs from "fs";
import { getDb } from "../../../../lib/mongodb";
import { findMany } from "../../../../lib/helpers";

export const config = {
  api: {
    bodyParser: false, // Needed for formidable to handle file uploads
  },
};

// Interfaz que define las columnas de tu Excel
interface ScheduleRow {
  employeeID: string;
  startDate: string | number; // can be Excel date number or string
  Mon?: string;
  Tue?: string;
  Wed?: string;
  Thu?: string;
  Fri?: string;
  schoolID: string;
}

type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";
const days: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method == "POST") {
    const form = formidable({
      multiples: false,
      maxFileSize: 2 * 1024 * 1024, // 2MB max
      filter: ({ mimetype }) =>
        mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        mimetype === "application/vnd.ms-excel",
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Error parsing file:", err);
        return res.status(400).json({ error: "Invalid file" });
      }

      try {
        const uploaded = files.file;
        if (!uploaded)
          return res.status(400).json({ error: "No file received" });
        const file: File = Array.isArray(uploaded) ? uploaded[0] : uploaded;

        // Read Excel
        const workbook = XLSX.readFile(file.filepath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: ScheduleRow[] = XLSX.utils.sheet_to_json<ScheduleRow>(sheet);

        const db: Db = await getDb();
        let insertedCount = 0;

        for (const row of rows) {
          const { employeeID, startDate, schoolID } = row;
          if (!employeeID || !startDate || !schoolID) {
            console.warn("Fila inválida, se ignora:", row);
            continue;
          }

          // Normaliza employeeID
          const employeeIDClean = String(employeeID).trim();
          const user = await db
            .collection("users")
            .findOne({ employeeID: employeeIDClean });
          if (!user) {
            console.warn(
              `No se encontró usuario con employeeId ${employeeIDClean}`,
            );
            continue;
          }

          const school = await db
            .collection("schools")
            .findOne({ _id: new ObjectId(schoolID) });
          if (!school) {
            console.warn(`No se encontró escuela con ID ${schoolID}`);
            continue;
          }

          // Fecha inicial de la semana robusta
          let weekStart: Date;
          if (typeof startDate === "number") {
            // Número de Excel
            const d = XLSX.SSF.parse_date_code(startDate);
            weekStart = new Date(d.y, d.m - 1, d.d);
          } else if (typeof startDate === "string") {
            const [year, month, day] = startDate.split("-").map(Number);
            weekStart = new Date(year, month - 1, day);
          } else {
            console.warn("startDate inválido, se ignora fila:", row);
            continue;
          }

          for (const dayName of days) {
            const time = row[dayName];
            if (!time || typeof time !== "string") continue;

            const [startTime, endTime] = time.split("-").map((t) => t.trim());
            if (!startTime || !endTime) continue;

            const scheduleDate = new Date(weekStart);
            scheduleDate.setDate(weekStart.getDate() + days.indexOf(dayName));

            // Guardar en MongoDB
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

        // Eliminar archivo temporal
        fs.unlinkSync(file.filepath);

        return res.status(200).json({
          success: true,
          message: `${insertedCount} horarios cargados correctamente`,
        });
      } catch (error) {
        console.error("Error procesando Excel:", error);
        return res.status(500).json({ error: "Error procesando archivo" });
      }
    });
  } 
}