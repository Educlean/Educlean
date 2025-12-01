import { NextApiRequest, NextApiResponse } from "next";

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export class DatabaseError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number = 500, code: string = "DATABASE_ERROR") {
    super(message);
    this.name = "DatabaseError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class ValidationError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number = 400, code: string = "VALIDATION_ERROR") {
    super(message);
    this.name = "ValidationError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class AuthenticationError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number = 401, code: string = "AUTHENTICATION_ERROR") {
    super(message);
    this.name = "AuthenticationError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function logError(error: Error, req: NextApiRequest, context?: string) {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const userAgent = req.headers['user-agent'];
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  console.error(`[${timestamp}] ERROR in ${context || 'API'}:`, {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    request: {
      method,
      url,
      userAgent,
      ip,
    },
  });
}

export function handleApiError(error: unknown, req: NextApiRequest, res: NextApiResponse, context?: string) {
  logError(error as Error, req, context);

  if (error instanceof DatabaseError || error instanceof ValidationError || error instanceof AuthenticationError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  if (error instanceof Error) {
    // MongoDB specific errors
    if (error.name === 'MongoServerError' || error.name === 'MongoNetworkError') {
      return res.status(503).json({
        success: false,
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'Database service is temporarily unavailable. Please try again later.',
        },
      });
    }

    // MongoDB timeout errors
    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      return res.status(504).json({
        success: false,
        error: {
          code: 'DATABASE_TIMEOUT',
          message: 'Database operation timed out. Please try again.',
        },
      });
    }

    // Connection errors
    if (error.message.includes('connection') || error.message.includes('ECONNREFUSED')) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'CONNECTION_ERROR',
          message: 'Unable to connect to database. Please try again later.',
        },
      });
    }
  }

  // Generic server error
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred. Please try again later.',
    },
  });
}

export function withErrorHandler(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>, context?: string) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error) {
      handleApiError(error, req, res, context);
    }
  };
}