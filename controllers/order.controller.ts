import ejs from "ejs";
import { NextFunction, Request, Response } from "express";
import path from "path";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import CourseModel, { ICourse } from "../models/course.model";
import NotificationModel from "../models/notification.model";
import { IOrder } from "../models/order.model";
import UserModel from "../models/user.model";
import { getAllOrdersService, newOrder } from "../services/order.service";
import ErrorHandler from "../utils/ErrorHandler";
import { redis } from "../utils/redis";
import { sendMail } from "../utils/sendMail";
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// create order
export const createOrder = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, payment_info } = req.body as IOrder;

      if (payment_info) {
        if ("id" in payment_info) {
          const paymentIntentId = payment_info.id;
          const paymentIntent = await stripe.paymentIntents.retrieve(
            paymentIntentId
          );
          if (paymentIntent.status !== "succeeded") {
            return next(new ErrorHandler("Payment failed", 400));
          }
        }
      }

      const user = await UserModel.findById(req.user?._id);

      const courseExistInUser = user?.courses.some(
        (course: any) => course._id.toString() === courseId
      );

      if (courseExistInUser) {
        return next(
          new ErrorHandler("You have already purchased this course", 400)
        );
      }

      const course = (await CourseModel.findById(courseId)) as ICourse;

      if (!course) {
        return next(new ErrorHandler("Course not found", 400));
      }

      const data: any = {
        courseId: course._id,
        userId: user?._id,
        payment_info,
      };

      const orderMailData = {
        order: {
          _id: (course._id as string).toString().slice(0, 6),
          name: course.name,
          user_name: user?.name,
          price: course.price,
          date: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        },
      };

      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/order-confirmation.ejs"),
        { order: orderMailData }
      );

      try {
        if (user) {
          await sendMail({
            email: user?.email,
            subject: "Order Confirmation",
            template: "order-confirmation.ejs",
            data: orderMailData,
          });
        }
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
      }

      user?.courses.push({courseId: data?.courseId});

      await redis.set(req.user?._id as string, JSON.stringify(user));

      await user?.save();

      const notification = await NotificationModel.create({
        user: user?._id,
        title: "New Order",
        message: `You have a new order from ${course?.name}`,
      });

      course.sold = (course.sold as number) + 1;

      await course.save();

      const isExistRedis = await redis.get(courseId);
      if (isExistRedis) {
        redis.del(courseId);

        await redis.set(courseId, JSON.stringify(course));
      }

      const isExistUserRedis = await redis.get(user?._id as string);
      if (isExistUserRedis) {
        redis.del(user?._id as string);

        await redis.set(user?._id as string, JSON.stringify(user));
      }

      const isAllCoursesCache = await redis.get("allCourses");

      if (isAllCoursesCache) {
        const courses = await CourseModel.find().select(
          "-courseData.videoUrl -courseData.links -courseData.suggestion -courseData.questions"
        );

        await redis.set("allCourses", JSON.stringify(courses));
      }

      newOrder(data, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Get all orders - only admin
export const getAllOrders = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllOrdersService(res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// send stripe publishable key
export const sendStripePublishableKey = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({
        stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// new payment
export const newPayment = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const myPayment = await stripe.paymentIntents.create({
        amount: req.body.amount,
        currency: "usd",
        metadata: {
          company: "10mCoders",
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.status(201).json({
        success: true,
        clientSecret: myPayment.client_secret,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
