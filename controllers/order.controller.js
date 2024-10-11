"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.newPayment = exports.sendStripePublishableKey = exports.getAllOrders = exports.createOrder = void 0;
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
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// create order
exports.createOrder = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { courseId, payment_info } = req.body;
        if (payment_info) {
            if ("id" in payment_info) {
                const paymentIntentId = payment_info.id;
                const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
                if (paymentIntent.status !== "succeeded") {
                    return next(new ErrorHandler_1.default("Payment failed", 400));
                }
            }
        }
        const user = await user_model_1.default.findById(req.user?._id);
        const courseExistInUser = user?.courses.some((course) => course._id.toString() === courseId);
        if (courseExistInUser) {
            return next(new ErrorHandler_1.default("You have already purchased this course", 400));
        }
        const course = (await course_model_1.default.findById(courseId));
        if (!course) {
            return next(new ErrorHandler_1.default("Course not found", 400));
        }
        const data = {
            courseId: course._id,
            userId: user?._id,
            payment_info,
        };
        const orderMailData = {
            order: {
                _id: course._id.toString().slice(0, 6),
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
        const html = await ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/order-confirmation.ejs"), { order: orderMailData });
        try {
            if (user) {
                await (0, sendMail_1.sendMail)({
                    email: user?.email,
                    subject: "Order Confirmation",
                    template: "order-confirmation.ejs",
                    data: orderMailData,
                });
            }
        }
        catch (error) {
            return next(new ErrorHandler_1.default(error.message, 400));
        }
        user?.courses.push({ courseId: data?.courseId });
        await redis_1.redis.set(req.user?._id, JSON.stringify(user));
        await user?.save();
        const notification = await notification_model_1.default.create({
            user: user?._id,
            title: "New Order",
            message: `You have a new order from ${course?.name}`,
        });
        course.sold = course.sold + 1;
        await course.save();
        const isExistRedis = await redis_1.redis.get(courseId);
        if (isExistRedis) {
            redis_1.redis.del(courseId);
            await redis_1.redis.set(courseId, JSON.stringify(course));
        }
        const isExistUserRedis = await redis_1.redis.get(user?._id);
        if (isExistUserRedis) {
            redis_1.redis.del(user?._id);
            await redis_1.redis.set(user?._id, JSON.stringify(user));
        }
        const isAllCoursesCache = await redis_1.redis.get("allCourses");
        if (isAllCoursesCache) {
            const courses = await course_model_1.default.find().select("-courseData.videoUrl -courseData.links -courseData.suggestion -courseData.questions");
            await redis_1.redis.set("allCourses", JSON.stringify(courses));
        }
        (0, order_service_1.newOrder)(data, res, next);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// Get all orders - only admin
exports.getAllOrders = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        (0, order_service_1.getAllOrdersService)(res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// send stripe publishable key
exports.sendStripePublishableKey = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        res.status(200).json({
            stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// new payment
exports.newPayment = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
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
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
