import type { NextApiRequest, NextApiResponse } from "next";
import { findOne } from "../../../../lib/helpers";
import bcrypt from "bcryptjs";
import { Account } from "../../../../lib/types";
import * as jwt from "jsonwebtoken";
import { serialize } from "cookie";
import allowCors from "../../../lib/allowCors";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { employeeID, password } = req.body;

    const userCredentials = await findOne<Account>(
      "accounts",
      { employeeID },
      { useCache: true, cacheTtl: 10 * 60 * 1000 }
    );

    if (!userCredentials) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, userCredentials.passwordHash);

    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect credentials" });
    }

    const token = jwt.sign(
      { accountId: userCredentials._id, role: userCredentials.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    const isProd = process.env.NODE_ENV === "production";
    const shouldUseNone = isProd && Boolean(process.env.ALLOWED_ORIGINS);

    const cookie = serialize("token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: shouldUseNone ? "none" : "strict",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    res.setHeader("Set-Cookie", cookie);

    return res.status(200).json({
      message: "Login successful",
      role: userCredentials.role,
      accountId: userCredentials._id.toString(), 
    });

  } catch (error: unknown) {
    if (error instanceof Error) {
      return res.status(500).json({ message: "Server error", error: error.message });
    }
    return res.status(500).json({ message: "Unknown server error" });
  }
}

export default allowCors(handler);
