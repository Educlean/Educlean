import type { NextApiRequest, NextApiResponse } from "next";
import { findOne } from "../../../../lib/helpers";
import bcrypt from "bcryptjs";
import { Account } from "../../../../lib/types";
import * as jwt from "jsonwebtoken";
import { serialize } from "cookie";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { employeeID, password } = req.body;

    const userCredentials = await findOne<Account>("accounts", { employeeID });

    if (!userCredentials) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(
      password,
      userCredentials.passwordHash,
    );

    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect credentials" });
    }

    const token = jwt.sign(
      { accountId: userCredentials._id, role: userCredentials.role },
      JWT_SECRET,
      { expiresIn: "1d" },
    );

    // Save token in HTTP Only
    const cookie = serialize("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 30, //Cookie will lasts 1 month
      path: "/",
    });

    res.setHeader("Set-Cookie", cookie);
    res
      .status(200)
      .json({ message: "Login successful", role: userCredentials.role });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return res
        .status(500)
        .json({ message: "Server error", error: error.message });
    }
    return res.status(500).json({ message: "Unknown server error" });
  }
}
