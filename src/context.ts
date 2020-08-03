import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface AuthUser {
  userId: string;
  email?: string;
  role?: string;
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
