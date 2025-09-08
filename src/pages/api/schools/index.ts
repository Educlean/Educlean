import { findAll, insertOne } from "../../../../lib/helpers";
import type { NextApiRequest, NextApiResponse } from "next";
import { School } from "../../../../lib/types";


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const schools = await findAll<School>("schools");
    res.status(200).json(schools);
  } else if (req.method === "POST") {
    const insertSchool = await insertOne<School>("schools", req.body);
    if (!insertSchool) {
      return res.status(500).json({ message: "Failed to create school" });
    }
      res.status(201).json(insertSchool);
    } 
  }