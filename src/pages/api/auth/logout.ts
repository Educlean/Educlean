import type { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";
import allowCors from "../../../lib/allowCors";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const isProd = process.env.NODE_ENV === "production";
  const shouldUseNone = isProd && Boolean(process.env.ALLOWED_ORIGINS);

  const cookie = serialize("token", "", {
    httpOnly: true,
    secure: isProd,
    sameSite: shouldUseNone ? "none" : "strict",
    maxAge: 0,
    path: "/",
  });

  res.setHeader("Set-Cookie", cookie);
  return res.status(200).json({ message: "Logged out" });
}

export default allowCors(handler);
