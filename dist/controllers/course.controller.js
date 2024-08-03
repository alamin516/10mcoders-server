"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVideoUrl = exports.deleteCourse = exports.getAllCourse = exports.addReplyToReview = exports.addReview = exports.addAnswer = exports.addQuestion = exports.getCourseByUser = exports.getAllCourses = exports.getSingleCourse = exports.editCourse = exports.uploadCourse = void 0;
const ejs_1 = __importDefault(require("ejs"));
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const course_service_1 = require("../services/course.service");
const course_model_1 = __importDefault(require("../models/course.model"));
const redis_1 = require("../utils/redis");
const mongoose_1 = __importDefault(require("mongoose"));
const path_1 = __importDefault(require("path"));
const sendMail_1 = require("../utils/sendMail");
const notification_model_1 = __importDefault(require("../models/notification.model"));
const axios_1 = __importDefault(require("axios"));
// upload course
exports.uploadCourse = (0, catchAsyncErrors_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = req.body;
        console.log(data);
        const thumbnail = data.thumbnail;
        if (thumbnail) {
            const myCluod = yield cloudinary_1.default.v2.uploader.upload(thumbnail, {
                folder: "courses",
            });
            data.thumbnail = {
                public_id: myCluod.public_id,
                url: myCluod.secure_url,
            };
        }
        (0, course_service_1.createCourse)(data, res, next);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
// edit course export
exports.editCourse = (0, catchAsyncErrors_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const data = req.body;
        const thumbnail = data.thumbnail;
        const courseId = req.params.id;
        const courseData = (yield course_model_1.default.findById(courseId));
        if (thumbnail && !thumbnail.startsWith("https")) {
            if ((_a = courseData.thumbnail) === null || _a === void 0 ? void 0 : _a.public_id) {
                yield cloudinary_1.default.v2.uploader.destroy((_b = courseData.thumbnail) === null || _b === void 0 ? void 0 : _b.public_id);
            }
            console.log("ggg");
            const myCluod = yield cloudinary_1.default.v2.uploader.upload(thumbnail, {
                folder: "courses",
            });
            data.thumbnail = {
                public_id: myCluod.public_id,
                url: myCluod.secure_url,
            };
        }
        if (thumbnail.startsWith("https")) {
            data.thumbnail = {
                public_id: (_c = courseData.thumbnail) === null || _c === void 0 ? void 0 : _c.public_id,
                url: (_d = courseData.thumbnail) === null || _d === void 0 ? void 0 : _d.url,
            };
        }
        const course = yield course_model_1.default.findByIdAndUpdate(courseId, {
            $set: data,
        }, {
            new: true,
        });
        res.status(201).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
// get single course -- without purchasing
exports.getSingleCourse = (0, catchAsyncErrors_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const courseId = req.params.id;
        const isExistRedis = yield redis_1.redis.get(courseId);
        if (isExistRedis) {
            const course = JSON.parse(isExistRedis);
            res.status(200).json({
                success: true,
                course,
            });
        }
        else {
            const course = yield course_model_1.default.findById(req.params.id).select("-courseData.videoUrl -courseData.links -courseData.suggestion -courseData.questions");
            if (!course) {
                return next(new ErrorHandler_1.default("Course not found with this id", 404));
            }
            yield redis_1.redis.set(courseId, JSON.stringify(course), "EX", 604800); // 7 days
            res.status(200).json({
                success: true,
                course,
            });
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
// get all courses -- without purchasing
exports.getAllCourses = (0, catchAsyncErrors_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isAllCoursesCache = yield redis_1.redis.get("allCourses");
        if (isAllCoursesCache) {
            const courses = JSON.parse(isAllCoursesCache);
            res.status(200).json({
                success: true,
                courses,
            });
        }
        else {
            const courses = yield course_model_1.default.find().select("-courseData.videoUrl -courseData.links -courseData.suggestion -courseData.questions");
            yield redis_1.redis.set("allCourses", JSON.stringify(courses));
            res.status(200).json({
                success: true,
                courses,
            });
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
// get course content -- only for enrolled user
exports.getCourseByUser = (0, catchAsyncErrors_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    try {
        const userCourseList = (_e = req.user) === null || _e === void 0 ? void 0 : _e.courses;
        const courseId = req.params.id;
        const courseExists = userCourseList === null || userCourseList === void 0 ? void 0 : userCourseList.find((course) => course._id.toString() === courseId);
        if (!courseExists) {
            return next(new ErrorHandler_1.default("You are not eligible to access this course", 404));
        }
        const course = yield course_model_1.default.findById(courseId);
        const content = course === null || course === void 0 ? void 0 : course.courseData;
        res.status(200).json({
            success: true,
            content,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
exports.addQuestion = (0, catchAsyncErrors_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _f, _g;
    try {
        const { question, contentId, courseId } = req.body;
        const course = yield course_model_1.default.findById(courseId);
        if (!mongoose_1.default.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler_1.default("Invalid content id", 400));
        }
        const courseContent = (_f = course === null || course === void 0 ? void 0 : course.courseData) === null || _f === void 0 ? void 0 : _f.find((item) => item._id.equals(contentId));
        if (!courseContent) {
            return next(new ErrorHandler_1.default("Invalid content id", 400));
        }
        // create a new question object
        const newQuestion = {
            user: req.user,
            question,
            questionReplies: [],
        };
        // add this question to our course content
        courseContent.questions.push(newQuestion);
        // notification
        yield notification_model_1.default.create({
            user: (_g = req.user) === null || _g === void 0 ? void 0 : _g._id,
            title: "New Question Received",
            message: `You have received a new question from ${courseContent.title}`,
        });
        yield (course === null || course === void 0 ? void 0 : course.save());
        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
exports.addAnswer = (0, catchAsyncErrors_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _h, _j, _k, _l, _m;
    try {
        const { answer, courseId, contentId, questionId } = req.body;
        const course = yield course_model_1.default.findById(courseId);
        if (!mongoose_1.default.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler_1.default("Invalid content id", 400));
        }
        const courseContent = (_h = course === null || course === void 0 ? void 0 : course.courseData) === null || _h === void 0 ? void 0 : _h.find((item) => item._id.equals(contentId));
        if (!courseContent) {
            return next(new ErrorHandler_1.default("Invalid content id", 400));
        }
        const question = (_j = courseContent === null || courseContent === void 0 ? void 0 : courseContent.questions) === null || _j === void 0 ? void 0 : _j.find((item) => item._id.equals(questionId));
        if (!question) {
            return next(new ErrorHandler_1.default("Invalid question id", 400));
        }
        // create a new anwer object
        const newAnswer = {
            user: req.user,
            answer,
        };
        // add this answer the question to our course content
        (_k = question === null || question === void 0 ? void 0 : question.questionReplies) === null || _k === void 0 ? void 0 : _k.push(newAnswer);
        yield (course === null || course === void 0 ? void 0 : course.save());
        if (((_l = req.user) === null || _l === void 0 ? void 0 : _l._id) === question.user._id) {
            yield notification_model_1.default.create({
                user: (_m = req.user) === null || _m === void 0 ? void 0 : _m._id,
                title: "Your Question Has Been Replied",
                message: `You have received a new reply from ${courseContent.title}`,
            });
        }
        else {
            const data = {
                name: question.user.name,
                title: courseContent.title,
            };
            const html = yield ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/question-replies.ejs"), data);
            try {
                yield (0, sendMail_1.sendMail)({
                    email: question.user.email,
                    subject: "Question Reply",
                    template: "question-replies.ejs",
                    data,
                });
            }
            catch (error) {
                return next(new ErrorHandler_1.default(error.message, 400));
            }
        }
        res.status(201).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
exports.addReview = (0, catchAsyncErrors_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _o, _p;
    try {
        const userCourseList = (_o = req.user) === null || _o === void 0 ? void 0 : _o.courses;
        const courseId = req.params.id;
        const courseExist = userCourseList === null || userCourseList === void 0 ? void 0 : userCourseList.some((course) => course._id.toString() === courseId.toString());
        if (!courseExist) {
            return next(new ErrorHandler_1.default("Your are not eligible to access this course", 400));
        }
        const course = yield course_model_1.default.findById(courseId);
        const { review, rating } = req.body;
        const newReviewData = {
            user: req.user,
            comment: review,
            rating,
        };
        // If exist review
        const existingReview = course === null || course === void 0 ? void 0 : course.reviews.find((review) => { var _a, _b; return ((_a = review.user) === null || _a === void 0 ? void 0 : _a._id) === ((_b = req.user) === null || _b === void 0 ? void 0 : _b._id); });
        if (existingReview) {
            return next(new ErrorHandler_1.default("You have already reviewed this course", 400));
        }
        course === null || course === void 0 ? void 0 : course.reviews.push(newReviewData);
        let avg = 0;
        course === null || course === void 0 ? void 0 : course.reviews.forEach((rev) => {
            avg += rev.rating;
        });
        if (course) {
            course.ratings = avg / (course === null || course === void 0 ? void 0 : course.reviews.length);
        }
        yield (course === null || course === void 0 ? void 0 : course.save());
        const notification = {
            title: "New Review Received",
            message: `${(_p = req.user) === null || _p === void 0 ? void 0 : _p.name} has given a review in ${course === null || course === void 0 ? void 0 : course.name}`,
        };
        // create notification
        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
exports.addReplyToReview = (0, catchAsyncErrors_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { comment, courseId, reviewId } = req.body;
        const course = yield course_model_1.default.findById(courseId);
        if (!course) {
            return next(new ErrorHandler_1.default("Course not found", 400));
        }
        const review = course.reviews.find((rev) => rev._id.toString() === reviewId);
        if (!review) {
            return next(new ErrorHandler_1.default("Review not found", 400));
        }
        const replayData = {
            user: req.user,
            comment,
        };
        if (!review.commentReplies) {
            review.commentReplies = [];
        }
        review.commentReplies.push(replayData);
        yield (course === null || course === void 0 ? void 0 : course.save());
        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
// Get all courses - only admin
exports.getAllCourse = (0, catchAsyncErrors_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, course_service_1.getAllCoursesService)(res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
// Delete Course ==> only admin
exports.deleteCourse = (0, catchAsyncErrors_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const course = yield course_model_1.default.findById(id);
        if (!course) {
            return next(new ErrorHandler_1.default("Course not found", 404));
        }
        yield course.deleteOne({ id });
        yield redis_1.redis.del(id);
        res.status(201).json({
            success: true,
            message: "Course deleted successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
// generate video url
exports.generateVideoUrl = (0, catchAsyncErrors_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _q, _r;
    try {
        const { videoId } = req.body;
        console.log(videoId);
        const response = yield axios_1.default.post(`https://dev.vdocipher.com/api/videos/${videoId}/otp`, { ttl: 300 }, {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `Apisecret ${process.env.VIDEO_CIPHER_API_SECRET}`
            }
        });
        res.json(response.data);
    }
    catch (error) {
        console.error("Error generating video URL:", ((_q = error.response) === null || _q === void 0 ? void 0 : _q.data) || error.message);
        return next(new ErrorHandler_1.default(((_r = error.response) === null || _r === void 0 ? void 0 : _r.data.message) || error.message, 400));
    }
}));
