"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.UpdateUserRole = exports.getAllUsers = exports.updateUserPicture = exports.updateUserPassword = exports.updateUserInfo = exports.socialAuth = exports.getUserInfo = exports.updateAccessToken = exports.logoutUser = exports.loginUser = exports.activateUser = exports.createActivationToken = exports.registrationUser = void 0;
require("dotenv").config();
const ejs_1 = __importDefault(require("ejs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const path_1 = __importDefault(require("path"));
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const user_model_1 = __importDefault(require("../models/user.model"));
const user_service_1 = require("../services/user.service");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const jwt_1 = require("../utils/jwt");
const redis_1 = require("../utils/redis");
const sendMail_1 = require("../utils/sendMail");
exports.registrationUser = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { name, email, password, mobile } = req.body;
        const isEmailExist = await user_model_1.default.findOne({ email });
        if (isEmailExist) {
            return next(new ErrorHandler_1.default("Email already exist", 400));
        }
        if (!mobile) {
            return next(new ErrorHandler_1.default("Mobile Number is required.", 400));
        }
        const user = {
            name,
            email,
            password,
            mobile
        };
        const activationToken = (0, exports.createActivationToken)(user);
        const activationCode = activationToken.activationCode;
        const data = { user: { name: user.name }, activationCode };
        const html = await ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/activation-mail.ejs"), data);
        try {
            await (0, sendMail_1.sendMail)({
                email: user.email,
                subject: "Activate Your Account",
                template: "activation-mail.ejs",
                data,
            });
            res.status(201).json({
                success: true,
                message: `Please check your email ${user.email} to activate your account`,
                activationToken: activationToken.token,
            });
        }
        catch (error) {
            return next(new ErrorHandler_1.default(error.message, 400));
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
const createActivationToken = (user) => {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const token = jsonwebtoken_1.default.sign({ user, activationCode }, process.env.ACTIVATION_SECRET, {
        expiresIn: "5m",
    });
    return { token, activationCode };
};
exports.createActivationToken = createActivationToken;
exports.activateUser = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { activation_token, activation_code } = req.body;
        const newUser = jsonwebtoken_1.default.verify(activation_token, process.env.ACTIVATION_SECRET);
        if (newUser.activationCode !== activation_code) {
            return next(new ErrorHandler_1.default("Invalid activation code", 400));
        }
        const { name, email, password, mobile } = newUser.user;
        const existUser = await user_model_1.default.findOne({ email });
        if (existUser) {
            return next(new ErrorHandler_1.default("Email already exist", 400));
        }
        const user = await user_model_1.default.create({
            name,
            email,
            password,
            mobile
        });
        console.log(user);
        res.status(201).json({
            success: true,
        });
    }
    catch (error) {
        next(new ErrorHandler_1.default(error.message, 400));
    }
});
exports.loginUser = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const access_token = req.cookies.access_token;
        if (access_token) {
            return next(new ErrorHandler_1.default("You have already logged in", 400));
        }
        if (!email || !password) {
            return next(new ErrorHandler_1.default("Please enter email and password", 400));
        }
        const user = await user_model_1.default.findOne({ email }).select("+password");
        if (!user) {
            return next(new ErrorHandler_1.default("Invalid email or password", 400));
        }
        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            return next(new ErrorHandler_1.default("Invalid password", 400));
        }
        (0, jwt_1.sendToken)(user, 200, res);
    }
    catch (error) {
        next(new ErrorHandler_1.default(error.message, 400));
    }
});
exports.logoutUser = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        res.cookie("access_token", "", { maxAge: 1 });
        res.cookie("refresh_token", "", { maxAge: 1 });
        const userId = req.user?._id || "";
        redis_1.redis.del(userId);
        res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    }
    catch (error) {
        next(new ErrorHandler_1.default(error.message, 400));
    }
});
// update access token
exports.updateAccessToken = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const refresh_token = req.cookies.refresh_token;
        const decoded = jsonwebtoken_1.default.verify(refresh_token, process.env.REFRESH_TOKEN);
        const message = "Could not refresh token";
        if (!decoded) {
            return next(new ErrorHandler_1.default(message, 400));
        }
        const session = await redis_1.redis.get(decoded.id);
        if (!session) {
            return next(new ErrorHandler_1.default("Please login again", 400));
        }
        const user = JSON.parse(session);
        const accessToken = jsonwebtoken_1.default.sign({ id: user._id }, process.env.ACCESS_TOKEN, {
            expiresIn: "1h",
        });
        const refreshToken = jsonwebtoken_1.default.sign({ id: user._id }, process.env.REFRESH_TOKEN, {
            expiresIn: "7d",
        });
        req.user = user;
        res.cookie("access_token", accessToken, jwt_1.accessTokenOptions);
        res.cookie("refresh_token", refreshToken, jwt_1.refreshTokenOptions);
        await redis_1.redis.set(user._id, JSON.stringify(user), "EX", 604800);
        next();
    }
    catch (error) {
        next(new ErrorHandler_1.default(error.message, 400));
    }
});
//get user info
exports.getUserInfo = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const userId = req.user?._id;
        (0, user_service_1.getUserById)(userId, res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// social auth
exports.socialAuth = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { email, name, avatar: image } = req.body;
        const user = await user_model_1.default.findOne({ email });
        if (!user) {
            if (image) {
                const myCloud = await cloudinary_1.default.v2.uploader.upload(image, {
                    folder: "avatars",
                });
                const avatar = {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,
                };
                const newUser = await user_model_1.default.create({ email, name, avatar });
                console.log(newUser);
                (0, jwt_1.sendToken)(newUser, 200, res);
            }
            else {
                throw new Error("Avatar image is required");
            }
        }
        else {
            (0, jwt_1.sendToken)(user, 200, res);
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
exports.updateUserInfo = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { name, mobile } = req.body;
        const userId = req.user?._id;
        const user = await user_model_1.default.findById(userId);
        if (mobile && user) {
            user.mobile = mobile;
        }
        if (name && user) {
            user.name = name;
        }
        await user?.save();
        await redis_1.redis.set(userId, JSON.stringify(user));
        res.status(201).json({
            success: true,
            user,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
exports.updateUserPassword = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return next(new ErrorHandler_1.default("Please inter old and new password", 400));
        }
        const user = await user_model_1.default.findById(req.user?._id).select("+password");
        if (user?.password === undefined) {
            return next(new ErrorHandler_1.default("Invalid user", 400));
        }
        const isPasswordMatch = await user?.comparePassword(oldPassword);
        if (!isPasswordMatch) {
            return next(new ErrorHandler_1.default("Invalid old password", 400));
        }
        user.password = newPassword;
        await user.save();
        await redis_1.redis.set(req.user?._id, JSON.stringify(user));
        res.status(201).json({
            success: true,
            user,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// update profile picture
exports.updateUserPicture = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { avatar } = req.body;
        const userId = req.user?._id;
        const user = await user_model_1.default.findById(userId);
        if (avatar && user) {
            if (user?.avatar.public_id) {
                await cloudinary_1.default.v2.uploader.destroy(user?.avatar?.public_id);
                const myCloud = await cloudinary_1.default.v2.uploader.upload(avatar, {
                    folder: "avatars",
                    width: 150,
                });
                user.avatar = {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,
                };
            }
            else {
                const myCloud = await cloudinary_1.default.v2.uploader.upload(avatar, {
                    folder: "avatars",
                    width: 150,
                });
                user.avatar = {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,
                };
            }
        }
        await user?.save();
        await redis_1.redis.set(userId, JSON.stringify(user));
        res.status(201).json({
            success: true,
            user,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// Get all users - only admin
exports.getAllUsers = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        (0, user_service_1.getAllUsersService)(res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// update user role -> only for admin
exports.UpdateUserRole = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { email, role } = req.body;
        (0, user_service_1.updateUserRoleService)(res, email, role);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// Delete user ==> only admin
exports.deleteUser = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await user_model_1.default.findById(id);
        if (!user) {
            return next(new ErrorHandler_1.default("User not found", 404));
        }
        await user.deleteOne({ id });
        await redis_1.redis.del(id);
        res.status(201).json({
            success: true,
            message: "User deleted successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
