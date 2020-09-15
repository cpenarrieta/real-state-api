import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface UserArgs {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  picture?: string;
  pictureLowRes?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  zipCode?: string;
  country?: string;
  username?: string;
}

export interface PropertyArgs {
  uuid?: string;
  title?: string;
  address1?: string;
  address2?: string;
  zipCode?: string;
  city?: string;
  province?: string;
  country?: string;
  community?: string;
  bathrooms?: number;
  bedrooms?: number;
  builtYear?: number;
  lotSize?: number;
  grossTaxesLastYear?: number;
  lat?: number;
  lon?: number;
  listingId?: string;
  description?: string;
  propertyType?:
    | "HOUSE"
    | "TOWNHOUSE"
    | "CONDO"
    | "LAND"
    | "OTHER"
    | undefined
    | null;
  mainPicture?: string;
  mainPictureLowRes?: string;
  price?: number;
  currency?: "CAD" | "USD" | undefined | null;
  status?: "ACTIVE" | "INACTIVE" | "SOLD" | "HOLD" | undefined | null;
  publishedStatus?: "DRAFT" | "PUBLISHED" | "INACTIVE" | undefined | null;
  videoUrl?: string;
  videoType?: "VIMEO" | "YOUTUBE" | undefined | null;
  mainImageId?: number;
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
