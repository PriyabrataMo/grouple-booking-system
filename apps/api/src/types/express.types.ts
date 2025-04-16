import { Request, Response, NextFunction } from "express";
import { JwtPayload } from "./user.types";
import { ParsedQs } from "qs";

/**
 * Extended Express request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

/**
 * Typed request body interface
 */
export interface TypedRequestBody<T> extends Request {
  body: T;
}

/**
 * Typed request with both auth and body
 */
export interface AuthenticatedRequestBody<T> extends AuthenticatedRequest {
  body: T;
}

/**
 * Express request with query params
 */
export interface TypedRequestQuery<T extends ParsedQs> extends Request {
  query: T;
}
/**
 * Custom handler type for authenticated routes
 */
export type AuthRequestHandler<
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any,
> = (
  req: AuthenticatedRequest & { params: P; body: ReqBody; query: ReqQuery },
  res: Response<ResBody>,
  next?: NextFunction
) => Promise<void> | void;

/**
 * Authentication request body types
 */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  role?: string;
}
