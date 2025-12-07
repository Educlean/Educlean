import type { NextApiHandler, NextApiResponse, NextApiRequest } from 'next';

export function allowCors(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const allowed = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
      : [];

    const origin = req.headers.origin as string | undefined;

    if (allowed.length === 0) {
      // No policy set. If an Origin header is present (likely running frontend from a different host/port),
      // allow that origin and enable credentials for development convenience. Otherwise fall back to allow-all.
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
      }
    } else if (origin && allowed.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    return handler(req, res);
  };
}

export default allowCors;
