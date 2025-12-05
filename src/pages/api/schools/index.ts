import {
  findAll,
  insertOne,
  findOne,
  deleteOne,
  updateOne,
} from "../../../../lib/helpers";
import type { NextApiRequest, NextApiResponse } from "next";
import { School } from "../../../../lib/types";
import allowCors from '../../../lib/allowCors';



async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    const schools = await findAll<School>("schools");
    res.status(200).json(schools);
  } else if (req.method === "POST") {
    const isInDB = await findOne<School>("schools", {
      address: req.body.address.trim(),
    });
    if (isInDB) {
      return res
        .status(409)
        .json({ message: "School with this address already exists" });
    }
    const { name, address, phone, lat, lng } = req.body;
    if (!name || !address || !phone || !lat || !lng) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const school: School & { lat: number; lng: number } = {
      name,
      address,
      phone,
      lat,
      lng,
    };

    const insertSchool = await insertOne<School>("schools", school);
    if (!insertSchool) {
      return res.status(500).json({ message: "Failed to create school" });
    }
    res.status(201).json(insertSchool);
  } else if (req.method === "DELETE") {
    const { id } = req.query;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Missing or invalid id" });
    }

    const result = await deleteOne("schools", id);

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "School not found" });
    }

    return res.status(204).end();
  } else if (req.method === "PUT") {
    const { id } = req.query;
    const { name, address, phone } = req.body;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Missing or invalid id" });
    }

    if (!name && !address && !phone) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const updateData: Partial<School> = {};
    if (name) updateData.name = name;
    if (address) updateData.address = address;
    if (phone) updateData.phone = phone;

    const result = await updateOne<School>("schools", id, updateData);

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "School not found" });
    }

    return res.status(200).json({ message: "School updated successfully" });
  }
}

export default allowCors(handler);