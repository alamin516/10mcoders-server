"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserRoleService = exports.getAllUsersService = exports.getUserById = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const redis_1 = require("../utils/redis");
// GET user by id
const getUserById = async (id, res) => {
    const userJson = await redis_1.redis.get(id);
    if (userJson) {
        const user = JSON.parse(userJson);
        delete user.password;
        res.status(201).json({
            success: true,
            user,
        });
    }
};
exports.getUserById = getUserById;
// Get all User service
const getAllUsersService = async (res) => {
    const users = await user_model_1.default.find({ role: { $nin: ["admin", "moderator"] } })
        .sort({
        createdAt: -1,
    })
        .select("-role.user");
    const admin = await user_model_1.default.find({ role: { $ne: "user" } })
        .sort({
        createdAt: -1,
    })
        .select("-role.admin -role.moderator");
    const allUsers = await user_model_1.default.find().sort({
        createdAt: -1,
    });
    const total = users.length + admin.length;
    res.status(200).json({
        success: true,
        payload: {
            total,
            users,
            admin,
            allUsers
        },
    });
};
exports.getAllUsersService = getAllUsersService;
const updateUserRoleService = async (res, email, role) => {
    try {
        const isUserExist = await user_model_1.default.findOne({ email });
        if (!isUserExist) {
            res.status(400).json({
                success: false,
                message: "User not found",
            });
        }
        if (isUserExist) {
            const id = isUserExist._id;
            const user = await user_model_1.default.findByIdAndUpdate(id, { role }, { new: true });
            res.status(200).json({
                success: true,
                message: "User role updated successfully",
                user,
            });
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.updateUserRoleService = updateUserRoleService;
