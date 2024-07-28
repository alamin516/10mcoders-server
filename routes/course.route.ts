import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { addAnswer, addQuestion, addReplyToReview, addReview, deleteCourse, editCourse, generateVideoUrl, getAllCourse, getAllCourses, getCourseByUser, getSingleCourse, uploadCourse } from "../controllers/course.controller";
const courseRouter = express.Router();


courseRouter.post("/course/create-course", isAuthenticated, authorizeRoles("admin"), uploadCourse);

courseRouter.put("/course/edit-course/:id", isAuthenticated, authorizeRoles("admin"), editCourse);

courseRouter.get("/course/:id", getSingleCourse);

courseRouter.get("/courses", getAllCourses);

courseRouter.get("/course-content/:id", isAuthenticated, getCourseByUser);

courseRouter.put("/add-question", isAuthenticated, addQuestion);

courseRouter.put("/add-answer", isAuthenticated, addAnswer);

courseRouter.put("/add-review/:id", isAuthenticated, addReview);

courseRouter.put("/reply-review", isAuthenticated, authorizeRoles("admin"), addReplyToReview);

courseRouter.get("/all-courses", isAuthenticated, authorizeRoles("admin"), getAllCourse);

courseRouter.post("/getVdoCipherOTP", generateVideoUrl)

courseRouter.delete("/delete-course/:id", isAuthenticated, authorizeRoles("admin"), deleteCourse);


export default courseRouter;