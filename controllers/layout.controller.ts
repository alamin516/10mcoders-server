import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import LayoutModel from "../models/layout.model";
import ErrorHandler from "../utils/ErrorHandler";

// Create layout
export const createLayout = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;
      const isExistType = await LayoutModel.findOne({ type });
      if (isExistType) {
        return next(
          new ErrorHandler(`This "${type}" already exist in layout.`, 400)
        );
      }

      if (type === "Banner") {
        const { banner_image, title, subTitle, subTitle2, images, url, url_text } =
          req.body;

        // const myCloud = await cloudinary.v2.uploader.upload(image, {
        //   folder: "layout",
        // });

        const banner = {
          type: "Banner",
          banner: {
            title,
            banner_image,
            subTitle,
            subTitle2,
            images,
            url,
            url_text
          },
        };

        console.log(banner);

        await LayoutModel.create(banner);
      }

      if (type === "FAQ") {
        const { faq } = req.body;
        console.log(faq);
        const faqItems = await Promise.all(
          faq.map(async (item: any) => {
            return {
              question: item.question,
              answer: item.answer,
            };
          })
        );
        await LayoutModel.create({ type: "FAQ", faq: faqItems });
      }

      if (type === "Categories") {
        const { categories } = req.body;
        const categoryItems = await Promise.all(
          categories.map(async (item: any) => {
            return {
              title: item.title,
            };
          })
        );
        await LayoutModel.create({ type: type, categories: categoryItems });
      }

      res.status(200).json({
        success: true,
        message: "Layout created successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Update layout
export const updateLayout = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;
      if (type === "Banner") {
        const bannerData: any = await LayoutModel.findOne({ type });

        const { title, subTitle, subTitle2, url, url_text } = req.body;

        console.log(req.body)

        // if (bannerData) {
        //   await cloudinary.v2.uploader.destroy(bannerData.image.public_id);
        // }

        // const data = image.startsWith("https") ? bannerData : await cloudinary.v2.uploader.upload(image, {
        //   folder: "layout"})

        // const myCloud = await cloudinary.v2.uploader.upload(image, {
        //   folder: "layout",
        // });

        // image: {
        //   public_id: image.startsWith("https") ? bannerData.banner.image.public_id : data.public_id,
        //   url: image.startsWith("https") ? bannerData.banner.image.url : data.secure_url,
        // },

        const banner = {
          type: "Banner",
          title,
          subTitle,
          subTitle2,
          url,
          url_text
        };

        await LayoutModel.findByIdAndUpdate(bannerData._id, { banner });
      }

      if (type === "FAQ") {
        const { faq } = req.body;
        const faqItem = await LayoutModel.findOne({ type });

        const faqItems = await Promise.all(
          faq.map(async (item: any) => {
            return {
              question: item.question,
              answer: item.answer,
            };
          })
        );
        await LayoutModel.findByIdAndUpdate(faqItem?._id, {
          type: "FAQ",
          faq: faqItems,
        });
      }

      if (type === "Categories") {
        const { categories } = req.body;
        const categoryItem = await LayoutModel.findOne({ type });
        const categoryItems = await Promise.all(
          categories.map(async (item: any) => {
            return {
              title: item.title,
            };
          })
        );
        await LayoutModel.findByIdAndUpdate(categoryItem?._id, {
          type: type,
          categories: categoryItems,
        });
      }

      res.status(200).json({
        success: true,
        message: "Layout updated successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Get layout to all
export const getLayout = CatchAsyncError(
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { type } = req.params;
      console.log(type);
      const layout = await LayoutModel.findOne({ type });

      res.status(200).json({
        success: true,
        layout,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
