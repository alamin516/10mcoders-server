import { NextFunction, Response, Request } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import ejs from "ejs";
import { IOrder } from "../models/order.model";
import userModel, { IUser } from "../models/user.model";
import CourseModel, { ICourse } from "../models/course.model";
import { newOrder } from "../services/order.service";
import path from "path";
import { sendMail } from "../utils/sendMail";
import NotificationModel from "../models/notification.model";
import { redis } from "../utils/redis";

// create order
export const createOrder = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, payment_info } = req.body as IOrder;

      const user = await userModel.findById(req.user?._id);

      const courseExistInUser = user?.courses.some(
        (course: any) => course._id.toString() === courseId
      );

      if (courseExistInUser) {
        return next(
          new ErrorHandler("You have already purchased this course", 400)
        );
      }

      const course = await CourseModel.findById(courseId) as ICourse;

      if (!course) {
        return next(new ErrorHandler("Course not found", 400));
      }

      const data: any = {
        courseId: course._id,
        userId: user?._id,
        payment_info
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

      user?.courses.push(data?.courseId)

      await user?.save();

      const notification = await NotificationModel.create({
        user: user?._id,
        title: "New Order",
        message: `You have a new order from ${course?.name}`,
      });

     
    course.sold = (course.sold as number) + 1;
      

      await course.save();

      const isExistRedis = await redis.get(courseId);
      if(isExistRedis){
        redis.del(courseId)

        await redis.set(courseId, JSON.stringify(course));
      }

      const isExistUserRedis = await redis.get(user?._id as string);
      if(isExistUserRedis){
        redis.del(user?._id as string)

        await redis.set(user?._id as string, JSON.stringify(user));
      }

      const isAllCoursesCache = await redis.get("allCourses");

      if(isAllCoursesCache){
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
