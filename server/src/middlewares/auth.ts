import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "@/config/env.js";
import { AuthenticationError } from "@/errors/AuthenticationError.js";

// Augment Express Request to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

interface JwtPayload {
  userId: string;
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AuthenticationError("Missing or invalid authorization header");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new AuthenticationError("Token not provided");
    }

    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.userId = decoded.userId;

    next();
  } catch (err) {
    if (err instanceof AuthenticationError) {
      next(err);
      return;
    }

    if (err instanceof jwt.JsonWebTokenError) {
      next(new AuthenticationError("Invalid or expired token"));
      return;
    }

    next(err);
  }
}
