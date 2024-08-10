import mongoose, { Document, Schema } from "mongoose";


interface IFaqItem extends Document{
    question: string,
    answer: string
}

interface ICategory extends Document{
    title: string
}

interface IBannerImage extends Document{
    public_id: string,
    url: string
}

interface ILayout extends Document{
    type: string,
    faq: IFaqItem[],
    categories: ICategory[],
    banner: {
        banner_image: IBannerImage,
        title: string,
        subTitle: string,
        subTitle2: string,
        url: string,
        url_text: string,
        images: []
    }
}


const faqSchema = new Schema<IFaqItem>({
question: {type: String},
answer: {type: String}
})


const categorySchema = new Schema<ICategory>({
    title: {type: String}
})

const bannerImageSchema = new Schema<IBannerImage>({
    public_id: {type: String},
    url: {type: String}
})


const layoutSchema = new Schema<ILayout>({
    type: {type: String},
    faq: [faqSchema],
    categories: [categorySchema],
    banner: {
        banner_image: bannerImageSchema,
        title: {type: String},
        subTitle: {type: String},
        subTitle2: {type: String},
        url: {type: String},
        url_text: {type: String},
        images: [{public_id: String, url: String}]
    }
})

const LayoutModel = mongoose.model<ILayout>('Layout', layoutSchema);

export default LayoutModel;