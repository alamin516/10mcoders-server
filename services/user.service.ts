import { Response } from "express";
import UserModel from "../models/user.model";
import { redis } from "../utils/redis";

// GET user by id
export const getUserById = async (id: string, res: Response) => {
  const userJson = await redis.get(id);

  if (userJson) {
    const user = JSON.parse(userJson);

    delete user.password;

    res.status(201).json({
      success: true,
      user,
    });
  }
};

// Get all User service
export const getAllUsersService = async (res: Response) => {
  const users = await UserModel.find({ role: { $nin: ["admin", "moderator"] } })
    .sort({
      createdAt: -1,
    })
    .select("-role.user");

  const admin = await UserModel.find({ role: { $ne: "user" } })
    .sort({
      createdAt: -1,
    })
    .select("-role.admin -role.moderator");

  const allUsers = await UserModel.find().sort({
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

export const updateUserRoleService = async (
  res: Response,
  email: string,
  role: string
) => {
  try {
    const isUserExist = await UserModel.findOne({ email });


    if (!isUserExist) {
      res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    if(isUserExist){
      const id = isUserExist._id;
      const user = await UserModel.findByIdAndUpdate(id, { role }, { new: true });

      res.status(200).json({
        success: true,
        message: "User role updated successfully",
        user,
      });
    }
    
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
