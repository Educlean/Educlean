import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { findOne } from "../../../../lib/helpers";
import { ObjectId } from "mongodb";
import allowCors from "../../../lib/allowCors";
// import types
// import { Account, User } from "../../../../lib/types";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = req.cookies.token;

  if (!token) return res.status(401).json({ message: "Not authenticated" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      accountId: string;
      role: string;
    };

    // Search for the account with caching
    const account = await findOne("accounts", {
      _id: new ObjectId(decoded.accountId),
    }, { useCache: true, cacheTtl: 15 * 60 * 1000 }); // Cache for 15 minutes
    if (!account) return res.status(404).json({ message: "Account not found" });

    // Search the associated user to the account with caching
    const user = await findOne("users", { accountId: decoded.accountId }, { useCache: true, cacheTtl: 15 * 60 * 1000 });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Return data from users collection
    res.status(200).json({
      accountId: account._id,
      employeeID: account.employeeID,
      role: account.role,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      DOB: user.DOB,
      allergies: user.allergies,
      RH: user.RH,
    });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Invalid token" });
  }
}

export default allowCors(handler);
