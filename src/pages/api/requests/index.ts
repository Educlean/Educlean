import type { NextApiRequest, NextApiResponse } from "next";
import { findAll, insertOne } from "../../../../lib/helpers";
import { findById } from "../../../../lib/helpers";
import { Request } from "../../../../lib/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const requests = await findAll<Request>("requests");
    res.status(200).json(requests);
  } else if (req.method === "POST") {
    const insertRequest = await insertOne<Request>("requests", req.body);
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