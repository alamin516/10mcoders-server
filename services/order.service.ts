import { NextFunction, Response } from 'express';
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import OrderModel from '../models/order.model';


export const newOrder = CatchAsyncError(async(data: any, res: Response)=> {
    const order = await OrderModel.create(data);
    
    res.status(201).json({
        success: true,
        order
      });
})


// Get All orders service
export const getAllOrdersService = async(res: Response)=> {
  const orders = await OrderModel.find().sort({
      createdAt: -1,
    });

    const total = orders.length;

  res.status(200).json({
      success: true,
      payload: {
        total,
        orders
      }
  })
}