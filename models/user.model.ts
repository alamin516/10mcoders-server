import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from 'bcryptjs'

const emailRegexPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface IUser extends Document{
    name: string,
    email: string,
    password: string,
    avatar: {
        public_id: string;
        url: string;
    },
    role: string,
    isVerified: boolean,
    products: Array<{productId: string}>;
    courses: Array<{courseId: string}>;
    comparePassword: (password: string) => Promise<boolean>;
}

const userSchema: Schema<IUser> = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter your name']
    },
    email: {
        type: String,
        required:  [true, 'Please enter your email'],
        validate: {
            validator: (value: string) => {
                return emailRegexPattern.test(value)
            },
            message: 'Please enter a valid email'
        }
    },
    password: {
        type: String,
        required:  [true, 'Please enter your password'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    avatar: {
        public_id: String,
        url: String
    },
    role: {
        type: String,
        default: 'user',
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    products: [
        {
            productId: String,
        }
    ],
    courses: [
        {
            courseId: String,
        }
    ]
}, {timestamps: true});


// Hash Password before saving
userSchema.pre<IUser>('save', async function(next){
    if(!this.isModified('password')){
        return next();
    }
    try {
        this.password = await bcrypt.hash(this.password, 10);
        next();
    } catch (error: any) {
        next(error);
    }
});


// Method to compare passwords
userSchema.methods.comparePassword= async function(password: string): Promise<boolean>{
    return bcrypt.compare(password, this.password);
};



const useModel: Model<IUser> = mongoose.model('User', userSchema) ;

export default useModel;
