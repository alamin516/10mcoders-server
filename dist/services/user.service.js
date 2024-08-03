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
exports.updateUserRoleService = exports.getAllUsersService = exports.getUserById = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const redis_1 = require("../utils/redis");
// GET user by id
const getUserById = (id, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userJson = yield redis_1.redis.get(id);
    if (userJson) {
        const user = JSON.parse(userJson);
        delete user.password;
        res.status(201).json({
            success: true,
            user,
        });
    }
});
exports.getUserById = getUserById;
// Get all User service
const getAllUsersService = (res) => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield user_model_1.default.find({ role: { $nin: ["admin", "moderator"] } })
        .sort({
        createdAt: -1,
    })
        .select("-role.user");
    const admin = yield user_model_1.default.find({ role: { $ne: "user" } })
        .sort({
        createdAt: -1,
    })
        .select("-role.admin -role.moderator");
    const allUsers = yield user_model_1.default.find().sort({
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
});
exports.getAllUsersService = getAllUsersService;
const updateUserRoleService = (res, email, role) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isUserExist = yield user_model_1.default.findOne({ email });
        console.log(isUserExist);
        if (!isUserExist) {
            res.status(400).json({
                success: false,
                message: "User not found",
            });
        }
        if (isUserExist) {
            const id = isUserExist._id;
            const user = yield user_model_1.default.findByIdAndUpdate(id, { role }, { new: true });
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
});
exports.updateUserRoleService = updateUserRoleService;
