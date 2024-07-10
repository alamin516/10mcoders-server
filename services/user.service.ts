import { Response } from "express";
import UserModel from "../models/user.model";
import { redis } from "../utils/redis";

// GET user by id
export const getUserById = async (id: string, res: Response) => {
  const userJson = await redis.get(id);

  if (userJson) {
    const user = JSON.parse(userJson);

    res.status(201).json({
      success: true,
      user,
    });
  }
};

// Get all User service
export const getAllUsersService = async (res: Response) => {
  const users = await UserModel.find({ role: { $ne: "admin" } })
    .sort({
      createdAt: -1,
    })
    .select("-role.admin");

  const admin = await UserModel.find({ role: { $ne: "user" } })
    .sort({
      createdAt: -1,
    })
    .select("-role.admin");

  const total = users.length + admin.length;

  res.status(200).json({
    success: true,
    payload: {
      total,
      users,
      admin,
    },
  });
};

export const updateUserRoleService = async (
  res: Response,
  id: string,
  role: string
) => {
  const user = await UserModel.findByIdAndUpdate(id, { role }, { new: true });

  res.status(201).json({
    success: true,
    user,
  });
};
