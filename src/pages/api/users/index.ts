import type { NextApiRequest, NextApiResponse } from "next";
import { findOne } from "../../../../lib/helpers";
import type { User } from "../../../../lib/types";


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { accountId } = req.query;

  if (!accountId || typeof accountId !== "string") {
    return res.status(400).json({ message: "accountId is required" });
  }

  try {
    const user = await findOne<User>("users", { accountId });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      _id: user._id?.toString(),
      accountId: user.accountId,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      DOB: user.DOB,
      allergies: user.allergies,
      RH: user.RH,
      employeeID: user.employeeID
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}