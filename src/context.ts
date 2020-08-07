import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface PropertyArgs {
  uuid?: string;
  title?: string;
}

export interface AuthUser {
  sub: string;
  role?: string; // TODO: how to get this from Auth0
}

export interface MyRequest extends Request {
  user?: AuthUser;
}

export interface MyContext {
  req: MyRequest;
  res: Response;
  prisma: PrismaClient;
}

export function createContext(req: MyRequest, res: Response): MyContext {
  return {
    prisma,
    req,
    res,
  };
}

export default prisma;
