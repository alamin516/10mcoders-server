"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLayout = exports.updateLayout = exports.createLayout = void 0;
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const layout_model_1 = __importDefault(require("../models/layout.model"));
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
// Create layout
exports.createLayout = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { type } = req.body;
        const isExistType = await layout_model_1.default.findOne({ type });
        if (isExistType) {
            return next(new ErrorHandler_1.default(`This "${type}" already exist in layout.`, 400));
        }
        if (type === "Banner") {
            const { banner_image, title, subTitle, subTitle2, images, url, url_text } = req.body;
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
            await layout_model_1.default.create(banner);
        }
        if (type === "FAQ") {
            const { faq } = req.body;
            console.log(faq);
            const faqItems = await Promise.all(faq.map(async (item) => {
                return {
                    question: item.question,
                    answer: item.answer,
                };
            }));
            await layout_model_1.default.create({ type: "FAQ", faq: faqItems });
        }
        if (type === "Categories") {
            const { categories } = req.body;
            const categoryItems = await Promise.all(categories.map(async (item) => {
                return {
                    title: item.title,
                };
            }));
            await layout_model_1.default.create({ type: type, categories: categoryItems });
        }
        res.status(200).json({
            success: true,
            message: "Layout created successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// Update layout
exports.updateLayout = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { type } = req.body;
        if (type === "Banner") {
            const bannerData = await layout_model_1.default.findOne({ type });
            const { title, subTitle, subTitle2, url, url_text } = req.body;
            console.log(req.body);
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
            await layout_model_1.default.findByIdAndUpdate(bannerData._id, { banner });
        }
        if (type === "FAQ") {
            const { faq } = req.body;
            const faqItem = await layout_model_1.default.findOne({ type });
            const faqItems = await Promise.all(faq.map(async (item) => {
                return {
                    question: item.question,
                    answer: item.answer,
                };
            }));
            await layout_model_1.default.findByIdAndUpdate(faqItem?._id, {
                type: "FAQ",
                faq: faqItems,
            });
        }
        if (type === "Categories") {
            const { categories } = req.body;
            const categoryItem = await layout_model_1.default.findOne({ type });
            const categoryItems = await Promise.all(categories.map(async (item) => {
                return {
                    title: item.title,
                };
            }));
            await layout_model_1.default.findByIdAndUpdate(categoryItem?._id, {
                type: type,
                categories: categoryItems,
            });
        }
        res.status(200).json({
            success: true,
            message: "Layout updated successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// Get layout to all
exports.getLayout = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { type } = req.params;
        console.log(type);
        const layout = await layout_model_1.default.findOne({ type });
        res.status(200).json({
            success: true,
            layout,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
