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
exports.getOrderAnalytics = exports.getCourseAnalytics = exports.getUsersAnalytics = void 0;
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const course_model_1 = __importDefault(require("../models/course.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const analytics_generator_1 = require("../utils/analytics.generator");
const order_model_1 = __importDefault(require("../models/order.model"));
// Get users analytics ==> only for admin
exports.getUsersAnalytics = (0, catchAsyncErrors_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield (0, analytics_generator_1.generateLast12MonthsData)(user_model_1.default);
        const totalMonth = users.last12Months.length;
        res.status(200).json({
            success: true,
            payload: {
                totalMonth,
                users,
            },
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Get Course analytics ==> only for admin
exports.getCourseAnalytics = (0, catchAsyncErrors_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const course = yield (0, analytics_generator_1.generateLast12MonthsData)(course_model_1.default);
        const totalMonth = course.last12Months.length;
        res.status(200).json({
            success: true,
            payload: {
                totalMonth,
                course,
            },
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Get Order analytics ==> only for admin
exports.getOrderAnalytics = (0, catchAsyncErrors_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const order = yield (0, analytics_generator_1.generateLast12MonthsData)(order_model_1.default);
        const totalMonth = order.last12Months.length;
        res.status(200).json({
            success: true,
            payload: {
                totalMonth,
                order,
            },
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
