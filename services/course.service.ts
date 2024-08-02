import { NextFunction, Response, Request } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import CourseModel from "../models/course.model";

export const createCourse = CatchAsyncError(
  async (data: any, res: Response) => {
    const course = await CourseModel.create(data);

    res.status(201).json({
      success: true,
      course,
    });
  }
);

// Get All Courses service
export const getAllCoursesService = async (res: Response) => {
  const courses = await CourseModel.find().sort({
    createdAt: -1,
  });

  const totalCourses = courses.length;

  res.status(200).json({
    success: true,
    payload: {
      total: totalCourses,
      courses,
    },
  });
};
