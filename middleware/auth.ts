import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { CatchAsyncError } from "./catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import { redis } from "../utils/redis";


export const isAuthenticated = CatchAsyncError(
  async (req: any, res: Response, next: NextFunction) => {
    const access_token = req.cookies.access_token as string;

    if (!access_token) {
      return next(
        new ErrorHandler("Your access token is expired. Please login to access this resource", 401)
      );
    }

    try {
      const decoded = jwt.verify(access_token, process.env.ACCESS_TOKEN as string) as JwtPayload;

      if (!decoded) {
        return next(new ErrorHandler("Access token is not valid", 401));
      }

      const user = await redis.get(decoded.id);


      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }


      req.user = JSON.parse(user);

      next();

    } catch (err) {
      return next(new ErrorHandler("Invalid access token", 401));
    }
  }
);


// validate user role
export const authorizeRoles = (...roles: string[]) => {
    return (req: any, res: Response, next: NextFunction) => {
      if (!roles.includes(req.user?.role || "")) {
        return next(new ErrorHandler(`You don't have permission to access this resource.`, 403));
      }
      next();
    };
  };