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
exports.updateAllNotificationsStatus = exports.updateNotificationsStatus = exports.getNotifications = void 0;
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const notification_model_1 = __importDefault(require("../models/notification.model"));
const node_cron_1 = __importDefault(require("node-cron"));
// get all notifications - only admin
exports.getNotifications = (0, catchAsyncErrors_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notifications = yield notification_model_1.default.find().sort({
            createdAt: -1,
        });
        res.status(201).json({
            success: true,
            notifications,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// update notification status - only for admin
exports.updateNotificationsStatus = (0, catchAsyncErrors_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notification = yield notification_model_1.default.findById(req.params.id);
        if (!notification) {
            return next(new ErrorHandler_1.default("Notification not found", 404));
        }
        else {
            notification.status
                ? (notification.status = "read")
                : notification === null || notification === void 0 ? void 0 : notification.status;
        }
        yield notification.save();
        const notifications = yield notification_model_1.default.find().sort({
            createdAt: -1,
        });
        res.status(201).json({
            success: true,
            notifications,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// update all notification status - only for admin
exports.updateAllNotificationsStatus = (0, catchAsyncErrors_1.CatchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield notification_model_1.default.updateMany({}, { status: "read" });
        const notifications = yield notification_model_1.default.find().sort({
            createdAt: -1,
        });
        res.status(201).json({
            success: true,
            notifications,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Delete 30 days previous all read notification - only for admin
node_cron_1.default.schedule("0 0 0 * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    const thirtyDayPrevious = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    yield notification_model_1.default.deleteMany({
        status: "read",
        createdAt: { $lt: thirtyDayPrevious },
    });
    console.log("Deleted all read previous notification");
}));
