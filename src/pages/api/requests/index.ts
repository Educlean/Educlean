import type { NextApiRequest, NextApiResponse } from "next";
import { findAll, insertOne } from "../../../../lib/helpers";
import { findById } from "../../../../lib/helpers";
import { Request } from "../../../../lib/types";
import {getDb} from '../../../../lib/mongodb'
import { time } from "console";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {

  
  if (req.method === "GET") {
    const requests = await findAll<Request>("requests");
    res.status(200).json(requests);
  } else if (req.method === "POST") {
    const insertRequest = await insertOne<Request>("requests", {
      ...req.body,
      time: new Date()
    });
    if (!insertRequest) {
      return res.status(500).json({ message: "Failed to create request" });
    }
    res.status(200).json(insertRequest);
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export async function getRequestById(id: string) {
  const request = await findById("requests", id);
  return request;
}


export  async function getRequestByDay(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const db = await getDb();
    const today = new Date().toISOString().split("T")[0];

    const start = new Date(today);
    const end = new Date(today);
    end.setDate(end.getDate() + 1);

    const requests = await db
      .collection("requests")
      .find({ time: { $gte: start, $lt: end } })
      .toArray();

    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ error: "Error fetching requests" });
  }
}