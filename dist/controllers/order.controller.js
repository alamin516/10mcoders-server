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
exports.getAllOrders = exports.createOrder = void 0;
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const course_model_1 = __importDefault(require("../models/course.model"));
const notification_model_1 = __importDefault(require("../models/notification.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const order_service_1 = require("../services/order.service");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const redis_1 = require("../utils/redis");
const sendMail_1 = require("../utils/sendMail");
// create order
exports.createOrder = (0, catchAsyncErrors_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { courseId, payment_info } = req.body;
        const user = yield user_model_1.default.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
        const courseExistInUser = user === null || user === void 0 ? void 0 : user.courses.some((course) => course._id.toString() === courseId);
        if (courseExistInUser) {
            return next(new ErrorHandler_1.default("You have already purchased this course", 400));
        }
        const course = (yield course_model_1.default.findById(courseId));
        if (!course) {
            return next(new ErrorHandler_1.default("Course not found", 400));
        }
        const data = {
            courseId: course._id,
            userId: user === null || user === void 0 ? void 0 : user._id,
            payment_info,
        };
        const orderMailData = {
            order: {
                _id: course._id.toString().slice(0, 6),
                name: course.name,
                user_name: user === null || user === void 0 ? void 0 : user.name,
                price: course.price,
                date: new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                }),
            },
        };
        const html = yield ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/order-confirmation.ejs"), { order: orderMailData });
        try {
            if (user) {
                yield (0, sendMail_1.sendMail)({
                    email: user === null || user === void 0 ? void 0 : user.email,
                    subject: "Order Confirmation",
                    template: "order-confirmation.ejs",
                    data: orderMailData,
                });
            }
        }
        catch (error) {
            return next(new ErrorHandler_1.default(error.message, 400));
        }
        user === null || user === void 0 ? void 0 : user.courses.push(data === null || data === void 0 ? void 0 : data.courseId);
        yield (user === null || user === void 0 ? void 0 : user.save());
        const notification = yield notification_model_1.default.create({
            user: user === null || user === void 0 ? void 0 : user._id,
            title: "New Order",
            message: `You have a new order from ${course === null || course === void 0 ? void 0 : course.name}`,
        });
        course.sold = course.sold + 1;
        yield course.save();
        const isExistRedis = yield redis_1.redis.get(courseId);
        if (isExistRedis) {
            redis_1.redis.del(courseId);
            yield redis_1.redis.set(courseId, JSON.stringify(course));
        }
        const isExistUserRedis = yield redis_1.redis.get(user === null || user === void 0 ? void 0 : user._id);
        if (isExistUserRedis) {
            redis_1.redis.del(user === null || user === void 0 ? void 0 : user._id);
            yield redis_1.redis.set(user === null || user === void 0 ? void 0 : user._id, JSON.stringify(user));
        }
        const isAllCoursesCache = yield redis_1.redis.get("allCourses");
        if (isAllCoursesCache) {
            const courses = yield course_model_1.default.find().select("-courseData.videoUrl -courseData.links -courseData.suggestion -courseData.questions");
            yield redis_1.redis.set("allCourses", JSON.stringify(courses));
        }
        (0, order_service_1.newOrder)(data, res, next);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
// Get all orders - only admin
exports.getAllOrders = (0, catchAsyncErrors_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, order_service_1.getAllOrdersService)(res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
