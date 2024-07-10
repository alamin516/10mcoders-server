import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import CourseModel from "../models/course.model";
import UserModel from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { generateLast12MonthsData } from "../utils/analytics.generator";
import OrderModel from "../models/order.model";

// Get users analytics ==> only for admin
export const getUsersAnalytics = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await generateLast12MonthsData(UserModel);
      const totalMonth = users.last12Months.length;

      res.status(200).json({
        success: true,
        payload: {
          totalMonth,
          users,
        },
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Get Course analytics ==> only for admin
export const getCourseAnalytics = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const course = await generateLast12MonthsData(CourseModel);
      const totalMonth = course.last12Months.length;

      res.status(200).json({
        success: true,
        payload: {
          totalMonth,
          course,
        },
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);


// Get Order analytics ==> only for admin
export const getOrderAnalytics = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const order = await generateLast12MonthsData(OrderModel);
        const totalMonth = order.last12Months.length;
  
        res.status(200).json({
          success: true,
          payload: {
            totalMonth,
            order,
          },
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    }
  );
 