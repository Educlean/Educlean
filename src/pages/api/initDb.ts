// pages/api/initDb.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "../../../lib/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const db = await getDb();

    // 1️⃣ Accounts
    const accountsCollection = db.collection("accounts");
    await accountsCollection.insertOne({
      employeeID: "EMP001",
      passwordHash: "123456",
      role: "cleaner",
    });

    // 2️⃣ Users
    const usersCollection = db.collection("users");
    await usersCollection.insertOne({
      accountId: "EMP001", // temporary reference
      name: "Andres Castañeda",
      email: "andres@example.com",
      mobile: "+573001234567",
      DOB: new Date("1990-05-01"),
      allergies: [{ type: "pollen" }],
      RH: "O+",
    });

    // 3️⃣ Schools
    const schoolsCollection = db.collection("schools");
    await schoolsCollection.insertOne({
      schoolName: "Saint Patrick's School",
      schoolAddress: { street: "555 Slocan St", city: "Vancouver", zip: "V6P 4W5" },
      schoolPrimaryContact: "+573001112233",
      shortName: "SPS",
    });

    // 4️⃣ Requests
    const requestsCollection = db.collection("requests");
    await requestsCollection.insertOne({
      schoolId: "SCHOOL001", // temporary reference
      title: "Limpiar laboratorio",
      priority: "high",
      description: "El laboratorio de química necesita limpieza profunda",
      status: "not started",
      time: new Date("2025-09-10T10:00:00Z"),
    });

    // 5️⃣ Schedules
    const schedulesCollection = db.collection("schedules");
    await schedulesCollection.insertOne({
      userId: "EMP001", // temporary reference
      weekStart: new Date("2025-09-08"),
      shifts: [
        { startTime: "08:00", endTime: "12:00", schoolId: "SCHOOL001" },
        { startTime: "13:00", endTime: "17:00", schoolId: "SCHOOL001" },
      ],
    });

    res.status(200).json({ message: "All collections created with a demo document" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to initialize DB" });
  }
}
